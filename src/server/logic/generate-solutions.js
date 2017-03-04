const _ = require('lodash');
const Combinatorics = require('js-combinatorics');

const FrequencyUtils = require('./classes/FrequencyUtils');
const FpvPilot = require('./classes/FpvPilot');
const { generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint } = require('./generate-general-solution-pool');


const OPTIMIZEBY_PILOT_PREFERENCE = "pilot_preference";
const OPTIMIZEBY_MAX_MHZ_DISTANCE = "max_mhz_distance";
const VALID_OPTIMIZEBY_VALUES = [OPTIMIZEBY_PILOT_PREFERENCE, OPTIMIZEBY_MAX_MHZ_DISTANCE];

const computeFeasibleSolutions = (pilots, minMhzDistance) => {
    // based on the pilots' available bands, generate an ordered array of FrequencyObjects
    const baseFreqArr = 
        FrequencyUtils.sortByFreq(
            FrequencyUtils.mkFrequencyObjectArrFromBandIdArr(
                FpvPilot.getPossibleBandPoolFromPilots(pilots)));

    
    // =========================================================================================
    // = Prelimiary step: Build up general solutions, based on the basic constraints.          =
    // =                  We will use these as "blueprints", and try to "implement" them in    =
    // =                  next step.                                                           =
    // =========================================================================================
    // generate solution blueprints from ordered frequencies
    // that is: all possibilities for the given:
    // - #pilots
    // - minMhzDistance 
    // - and available frequencies 
    const solutionBlueprints 
        = generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint(pilots.length, minMhzDistance, baseFreqArr);
    
    // =========================================================================================
    // == Main step: Try to build all "implementations" of a given blueprint (gen. solution) ===
    // =========================================================================================
    // solutionBlueprints = all possibilities (frequency combinations) for the given: #pilots, minMhzDistance and available frequencies (will be FEWER than resulting solutions!)
    // blueprint = one combination of frequencies that meets the requirements for #pilots, minMhzDistance and available frequencies 

    // One blueprint (=general solution) at a time...
    const unsortedSolutionImplementations = solutionBlueprints.map((solutionBlueprint) => {        

        // In essence what we're trying to do here is, try if we can
        // "build" the suggested solution (=blueprint) based on the
        // the pilots frequencies. 
        // If this is possible, we build all possible combinations of it.

        // For every frequency of the blueprint gather the possible weights.        
        const currBlueprintTupleBase = solutionBlueprint.map((blueprintFreqObj) => {
            // This means, that for every "candFreqObj" of the blueprint, an
            // array of (weighted) "PilotFrequencyObject"s get's constructed.
            // Resulting in a nested array of "PilotFrequencyObject"s.

            // get the weight of particular frequency(!) from pilot (if possible)
            return FpvPilot.getWeightFreqArrForFreqForPilots(blueprintFreqObj.freq, pilots)
                           .filter((pFreqObj) => pFreqObj !== undefined);            
        });

        // Each pilots name must at least appear once in any of the arrays to 
        // construct a feasible solution
        const distinctPilots =
             _.uniq(currBlueprintTupleBase.reduce((a,b) => {
                                               return a.concat(b);
                                           },[])
                                           .filter((pFreqObj) => pFreqObj != undefined)
                                           .map((pFreqObj) => pFreqObj.pilotName)
            );

        // = not feasible
        if(distinctPilots.length !== pilots.length) {
            return [];
        }
        
        // At this point it's possible to construct at least one feasible solution, 
        // based on the weighted arrays.
        // Also mind, that the nested arrays in currBlueprintTupleBase are sorted by pilot name!
        
        // Create tuples (cartesian product...the easy and inefficient way).
        // This means, we build up ALL combinations that could (at least partially) "implement" the proposed "blueprint" (solution).
        // I.e. we build up the frequency-list of the "blueprint" all the time, but with different 
        // pilot-combinations. (since many pilots can potentially use a certain frequency of a "solution")
        // ===============================================================================================
        // NOTE: We have a lot of improvement potential here, as we don't have to build up the whole CP.
        const blueprintImplementationsCP = Combinatorics.cartesianProduct(...currBlueprintTupleBase).toArray();
        
        // find valid combinations/solution-blueprint-implementations (based on unique #pilots)
        const feasibleBlueprintImplementations = blueprintImplementationsCP.filter((innerblueprint) => {
            const uniqueNames = _.uniq(innerblueprint.map((pFreqObj) => pFreqObj.pilotName));
            return uniqueNames.length === pilots.length;                          
        });

        return feasibleBlueprintImplementations;
    })
    // flatten
    .reduce((a,b) => {
        return a.concat(b);
    },[]);

    return {
        solutionBlueprints: solutionBlueprints,
        solutions: unsortedSolutionImplementations
    };
}

/**
 * evaluate fitness of (feasible) solution-implementation 
 * by max combined frequency diff (very naive approach)
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
 * evaluate fitness of (feasible) solution-implementation 
 * by max weight (aka pilot preference)
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
 * Combining it all....
 * param "optimizeBy" = "pilot_preference" | "max_mhz_distance"
 */
const computeSortAndEnrichSolutions = (pilots, minMhzDistance, optimizeBy=OPTIMIZEBY_PILOT_PREFERENCE, sortOrder="desc") => {
    const fnFitness 
        = optimizeBy === OPTIMIZEBY_PILOT_PREFERENCE 
            ? evaluateFitnessByPilotPreferences 
            : evaluateFitnessByFreqDiff;

    // a) enrich with fitness value, based on fitness-function choice
    // b) sort by fitness value (sortOrder as given)
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
    
    // compute solutions (blueprints), based on general constraints
    const feasibleSolutions = computeFeasibleSolutions(pilots, minMhzDistance);
    // compute solutions (implementations of said blueprints) that also fulfill the pilot constraints
    const orderedSolutionsWithFitness
        = addAndSortByFitnessFn(feasibleSolutions.solutions, 
                                fnFitness, 
                                sortOrder);


    // order individual(!) solution by pilot input order. (so we re-order the inner order)
    const pOrdSolsWFitness 
        = orderedSolutionsWithFitness.map((solutionWithFitness) => {
                const remappedSolution = pilots.map((pilot) => {            
                                                    return solutionWithFitness.solution.find((pfo) => pfo.pilotName === pilot.pilot_name);
                                                })
                                                // flatten
                                                .reduce((a,b) => {
                                                    return a.concat(b);
                                                },[]);

                solutionWithFitness.solution = remappedSolution;
                return solutionWithFitness;
            });


    //TODO: in case of "max_mhz_distance", where there are multiple best solutions, factor in the "pilot_preference" as well!

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

// TODO: if equal fitness by preference, than additionally weight by max-mhz-distance

/*
const pilots = [
    new FpvPilot("name1", "craft-01", "ET25R", ["A", "B", "E", "F", "R"], ["A","R"], ["A1", "R1"]),
    new FpvPilot("name2", "craft-02", null, null, ["B"], ["B1"]),
    new FpvPilot("name3", "craft-03", null, ["A", "B", "E", "F", "R"], ["F"], ["B5"]),
    new FpvPilot("name4", "craft-04", null, ["A", "B", "E", "F", "R"], ["R"], ["R6"])
];
*/

/*
// by pilots' preferences
const result = computeAndSortSolutions(pilots, 60);
console.log("num solution blueprints (= valid combinations): " +result.solutionBlueprints.length);
console.log("total solutions: " +result.solutions.length);
console.log("Best: Fitness:  " +evaluateFitnessByPilotPreferences(result.solutions[0]));
console.log("Best: Solution: ",result.solutions[0]);
console.log("Worst: Fitness:  " +evaluateFitnessByPilotPreferences(result.solutions[result.solutions.length-1]));
console.log("Worst: Solution: ",result.solutions[result.solutions.length-1]);
*/

/* 
// by max mhz distance
const result = computeAndSortSolutions(pilots, 60, "maxMhzDistance");
console.log("num solution blueprints (= valid combinations): " +result.solutionBlueprints.length);
console.log("total solutions: " +result.solutions.length);
console.log("Best: Fitness:  " +evaluateFitnessByFreqDiff(result.solutions[0]));
console.log("Best: Solution: ",result.solutions[0]);
console.log("Worst: Fitness:  " +evaluateFitnessByFreqDiff(result.solutions[result.solutions.length-1]));
console.log("Worst: Solution: ",result.solutions[result.solutions.length-1]);
*/


// TODO 1: (alternative) optimize over mhzDistance (gt is better) -> work down from very high distance until a solution is found -> will sacrifice fitness!
// TODO 2: try to increase mhzDistance without sacrificing fitness.
//         (lowest mhzDistance determines highest possible fitness)

// Currently it is optimized for weight (i.e. so that it minimizes the pilots that have to change frequency)
// let user decide minimal mhz Distance, then let them either maximize by a) fitness or b) mhzdistance
