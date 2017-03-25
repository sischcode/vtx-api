const _ = require('lodash');
const Combinatorics = require('js-combinatorics');

const {computePathsForTrees} = require('./tree-paths'); // as an alternative to the CP function of js-combinatorics
const FrequencyUtils = require('./classes/FrequencyUtils');
const FpvPilot = require('./classes/FpvPilot');
const {getSolutionsForConstraints} = require('./generate-general-solution-pool'); 


const OPTIMIZEBY_PILOT_PREFERENCE = "pilot_preference";
const OPTIMIZEBY_MAX_MHZ_DISTANCE = "max_mhz_distance";
const VALID_OPTIMIZEBY_VALUES = [OPTIMIZEBY_PILOT_PREFERENCE, OPTIMIZEBY_MAX_MHZ_DISTANCE];

/**
 * Compute feasible solutions for the given constraints.
 * 
 * @param {Array.<FpvPilot>} pilots The pilots input. What frequencies are available and what are the preferred ones. (aka pilots' constraints)
 * @param {number} minMhzDistance The minimal gap that must be between any two frequencies.
 * @param {number} minFrequency (optional) The minimal frequency
 * @param {number} maxFrequency (optional) The maximal frequency
 */
const computeFeasibleSolutions = (pilots, minMhzDistance, minFrequency, maxFrequency) => {

    // based on the pilots' available bands, generate an ordered array of FrequencyObjects,
    // building up, what's available to work with, frequency wise.
    const baseFreqArr = FrequencyUtils.sortByFreq(
                            FrequencyUtils.mkFrequencyObjectArrFromBandIdArr(
                                FpvPilot.getPossibleBandPoolFromPilots(pilots)));


    // =========================================================================================
    // = Preliminary step: Build up general solutions, based on the basic constraints.         =
    // =                   We will use these as "blueprints", and try to "implement" them in   =
    // =                   next step.                                                          =
    // =========================================================================================
    // generate solution blueprints from ordered frequencies. That is, all possibilities 
    // (= feasible solutions) for the given: 
    // #pilots, the minMhzDistance, the available frequencies and optional min-/max-freq. constraints.
    // 
    // (this operation is very fast. It takes only about 50ms for full set of all general solutions)
    const solutionBlueprints 
        = getSolutionsForConstraints(pilots.length, 
                                     minMhzDistance, 
                                     baseFreqArr, 
                                     minFrequency ? minFrequency : baseFreqArr[0].freq, 
                                     maxFrequency ? maxFrequency : baseFreqArr[baseFreqArr.length-1].freq);
    
    // =========================================================================================
    // == Main step: Try to build all "implementations" of a given blueprint (gen. solution) ===
    // =========================================================================================
    // solutionBlueprints = all feasible solutions for the given: #pilots, minMhzDistance and 
    // available frequencies.
    // One blueprint (=general solution) at a time, do...
    const nestedUnsortedSolutionImplementations = solutionBlueprints.map((solutionBlueprint) => {
        // In essence what we're trying to do here is, try if we can
        // "build" the suggested solution (=blueprint) based on the
        // the pilots frequencies. 
        // If this is possible, we build all possible combinations of it, later on.
             
        const currBlueprintTupleBase = solutionBlueprint.map((blueprintFreqObj) => {
            // For every frequency of the blueprint, we gather the availability of it on the pilots.
            // Meaning, if a pilot does have this frequency, we add the appropriate "PilotFrequencyObject"
            // to the pool of objects for this frequency.
            // This constructs an array of arrays, where every inner array reprents pilots, that can 
            // use this particular frequency.
            return FpvPilot.getPilotFrequencyObjectsForFreq(blueprintFreqObj.freq, pilots) // <-- this is (was) a very expensive operation!
                           .filter((pFreqObj) => pFreqObj !== undefined);            
        });


        // For blueprint to be (potentially) feasible, every pilot has to appear at least once.
        // Though this is only a criterium what is 100% not feasible. It still may not be feasible 
        // after this check. It just helps with filtering out.
        const distinctPilots =_.uniq(_.flatten(currBlueprintTupleBase)
                                      .filter((pFreqObj) => pFreqObj != undefined)
                                      .map((pFreqObj) => pFreqObj.pilotName) );

        // = definately not feasible
        if(distinctPilots.length !== pilots.length) {
            return [];
        }
        
        // At this point it's (most likely) possible to construct at least one feasible solution, 
        // based on the weighted arrays.
        // Also mind, that the nested arrays in currBlueprintTupleBase are sorted by pilot name!
        
        // Create sets... (cartesian product...the easy and inefficient way).
        // This means, we build up ALL combinations that could (at least partially) "implement" the proposed "blueprint" (solution).
        // I.e. we build up the frequency-list of the "blueprint" all the time, but with different 
        // pilot-combinations. (since many pilots can potentially use a certain frequency of a "solution")
        // ===============================================================================================
        
        /* Older, way less efficient, but also far less complicated...
        const blueprintImplementationsCP = Combinatorics.cartesianProduct(...currBlueprintTupleBase).toArray();
        // find valid combinations/solution-blueprint-implementations (based on unique #pilots)
        const feasibleBlueprintImplementations = blueprintImplementationsCP.filter((innerblueprint) => {
            const uniqueNames = _.uniq(innerblueprint.map((pFreqObj) => pFreqObj.pilotName));
            return uniqueNames.length === pilots.length;                          
        });
        return feasibleBlueprintImplementations;
        */

        // This is also a very expensive operation, compared to the rest!
        return computePathsForTrees(currBlueprintTupleBase).filter((innerblueprint) => {
            const uniqueNames = _.uniq(innerblueprint.map((pFreqObj) => pFreqObj.pilotName));
            return uniqueNames.length === pilots.length;                          
        });
        
    });
    
    return {
        solutionBlueprints: solutionBlueprints,
        solutions: _.flatten(nestedUnsortedSolutionImplementations)
    };
}

/**
 * Evaluates the fitness of (a feasible) solution (= blueprint-implementation),
 * by max combined frequency diff. (Which is a very naive approach)
 *
 * @param {Array.<{freq: number}> } solution The solution to compute the fitness for
 * @returns {number} the absolute fitness value as a number
 */
const evaluateFitnessByFreqDiff = (solution) => {
    if(!solution || solution.length == 0) {
        return 0;
    }
    return solution.reduce( (res, curr) => {
        if(res[0] == null) {
            res[0] = curr;
        } else {
            const prev = res[0];
            const diff = curr.freq - prev.freq;
            res[1] = res[1]+diff;
            res[0] = curr;
        }
        return res;
    }, [null,0])[1];   
};

/**
 * Evaluates the fitness of (a feasible) solution (= blueprint-implementation),
 * by max weight (aka pilot preference).
 * 
 * @param {Array.<{freq: number}> } solution The solution to compute the fitness for
 * @returns {number} the absolute fitness value as a number
 */
const evaluateFitnessByPilotPreferences = (solution) => {
    if(!solution || solution.length == 0) {
        return 0;
    }
    return solution.map((freqObj) => {
        return freqObj.weight;
    }).reduce( (a,b) => {
        return a+b;
    },0);
};





/**
 * a) enrich with fitness value, based on fitness-function choice
 * b) sort by fitness value (sortOrder as given)
 * 
 * @param {*} solutionPool 
 * @param {*} fnFitness 
 * @param {*} order 
 */
const addAndSortByFitnessFn =  (solutionPool, fnFitness, order="asc") => {
    let sortedAsc = solutionPool.map((solution) => {
        return {
            solution: solution,
            fitness: fnFitness(solution)
        };
    }).sort((a,b) => {
        if(a.fitness < b.fitness) return -1;
        if(a.fitness > b.fitness) return 1;
        if(a.fitness == b.fitness) return 0;
    });

    if(order === "desc") {
        return sortedAsc.reverse();
    };
}


/**
 * 
 * @param {*} args Object of: pilots, minMhzDistance, minFrequency, maxFrequency, optimizeBy=OPTIMIZEBY_PILOT_PREFERENCE, sortOrder="desc"
 */
const computeSortAndEnrichSolutions = (args) => {
    // defaulting optional, but needed args
    if(!args.optimizeBy) {
        args.optimizeBy = OPTIMIZEBY_PILOT_PREFERENCE;
    }
    if(!args.sortOrder) {
        args.sortOrder = "desc";
    }

    const fnFitness 
        = args.optimizeBy === OPTIMIZEBY_PILOT_PREFERENCE 
            ? evaluateFitnessByPilotPreferences 
            : evaluateFitnessByFreqDiff;
    
    // compute solutions (blueprints), based on general constraints
    const feasibleSolutions = computeFeasibleSolutions(args.pilots, 
                                                       args.minMhzDistance, 
                                                       args.minFrequency, 
                                                       args.maxFrequency);

    // compute solutions (implementations of said blueprints) that also fulfill the pilot constraints
    const orderedSolutionsWithFitness
        = addAndSortByFitnessFn(feasibleSolutions.solutions, 
                                fnFitness, 
                                args.sortOrder);

    // order individual(!) solution by pilot input order. (so we re-order the inner order)
    const pOrdSolsWFitness 
        = orderedSolutionsWithFitness.map((solutionWithFitness) => {
                const remappedSolution = _.flatten(args.pilots.map((pilot) => {            
                    return solutionWithFitness.solution.find((pfo) => pfo.pilotName === pilot.pilot_name);
                }));

                solutionWithFitness.solution = remappedSolution;
                return solutionWithFitness;
            });


    // TODO: in case of "max_mhz_distance", where there are multiple best solutions
    // a) factor in the "pilot_preference" as well!
    // b) include the minimal mhz gap of the best solution in the facts

    // TODO: if equal fitness by preference, than additionally weight by max-mhz-distance

    // enrich with some statistics
    return {
        solution_blueprints: feasibleSolutions.solutionBlueprints,
        solutions_with_fitness: pOrdSolsWFitness,
        statistics: {
            min_fitness: pOrdSolsWFitness.length === 0 ? 0 : pOrdSolsWFitness[pOrdSolsWFitness.length-1].fitness,
            max_fitness: pOrdSolsWFitness.length === 0 ? 0 : pOrdSolsWFitness[0].fitness,
            avg_fitness: pOrdSolsWFitness.length === 0 ? 0 : ( (pOrdSolsWFitness.map((sol) => sol.fitness).reduce((a,b) => (a+b))) / pOrdSolsWFitness.length),
            num_solutions: pOrdSolsWFitness.length
        }
    };
}

module.exports = {
    computeSortAndEnrichSolutions,
    OPTIMIZEBY_PILOT_PREFERENCE,
    OPTIMIZEBY_MAX_MHZ_DISTANCE,
    VALID_OPTIMIZEBY_VALUES
}

// TODO: - optimize by weight and distance
//       - add multiple fitness values to solutions
//       - add constraints here as well!


/*const pilots = [
    new FpvPilot("name1", "craft-01", null, null, ["A"]),
    new FpvPilot("name2", "craft-02", null, null, ["B"], ["B1"]),
    new FpvPilot("name3", "craft-03", null, ["A", "B", "E", "F", "R"], ["E"], ["E5"]),
    new FpvPilot("name4", "craft-04", null, ["A", "B", "E", "F", "R"], ["R"])
];*/

/* ...results in a cartesian product of all, so, this stresses the algorithm the most 
const pilots = [
    new FpvPilot("name1", "craft-01", null, ["A", "B", "E", "F", "R"]),
    new FpvPilot("name2", "craft-02", null, ["A", "B", "E", "F", "R"]),
    new FpvPilot("name3", "craft-03", null, ["A", "B", "E", "F", "R"]),
    new FpvPilot("name4", "craft-04", null, ["A", "B", "E", "F", "R"])
];
*/

/*
// by pilots' preferences
const inputArgs = {
    pilots, 
    minMhzDistance: 60, 
    optimizeBy: OPTIMIZEBY_PILOT_PREFERENCE, 
    sortOrder: "desc"
    //,minFrequency: 5725,
    //,maxFrequency: 5880
}

const from = Date.now();
const result = computeSortAndEnrichSolutions(inputArgs);
console.log("sec:", (Date.now() - from)/1000);

console.log("num solution blueprints (= valid combinations): " +result.solution_blueprints.length);
console.log("stats: ", result.statistics);
console.log("Best: Solution: ",result.solutions_with_fitness[0]);
console.log("Worst: Solution: ",result.solutions_with_fitness[result.solutions_with_fitness.length-1]);
*/