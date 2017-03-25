const _ = require('lodash');


const {
    validateCalcReqObject,
    OPTION_NUM_RESULTS_BEST,
    OPTION_NUM_RESULTS_MAX_TOP_10,
    DEFAULT_OPTIONS_OPTIMIZEBY,
    DEFAULT_OPTIONS_MINMHZDISTANCE,
    DEFAULT_OPTIONS_NUM_RESULTS
} = require('./middleware/validateCalcReqObject');

const FpvPilot = require('./../logic/classes/FpvPilot');
const PilotResultObject = require('./../logic/classes/PilotResultObject');
const {computeSortAndEnrichSolutions, VALID_OPTIMIZEBY_VALUES} = require('./../logic/generate-solutions');


// =============================================================================================
// Some helpers for later...
// =============================================================================================

// remap from "PilotFrequencyObject"s to "PilotResultObject"s
const remapSolutionObjectsToResultObj = (solution) => {
    return solution.map((pilotObj) => PilotResultObject.fromPilotFrequencyObject(pilotObj));
};

// compute hints (i.e. compute if preferred_frequency is different from recommended frequency)
// input solution MUST consist of "PilotResultObject"s
const addHintsToSolution = (solution, pilots) => {
    return solution.map((pro) => {
        // find corresponding input
        const pilotInput = pilots.find((e) => e.pilot_name === pro.pilot_name);
        
        // if we have preferred frequencies, we check for the ones that match the solution and add those as hints
        if(pilotInput.preferred_frequencies) {
            const prefFreqArrContainsFreqId = pilotInput.preferred_frequencies.find((freqId) => pro.freq_id === freqId);
            if(prefFreqArrContainsFreqId) {                        
                pro.hints = [];
                if(pilotInput.preferred_frequencies.length === 1) {
                    pro.hints.push("FREQID_IS_PREFERRED_FREQ");
                } else {
                    pro.hints.push("FREQID_IN_PREFERRED_FREQS");
                }
            }
        }

        // see if band change is required
        if(pilotInput.preferred_bands) {                    
            const prefBandArrContainsBandId = pilotInput.preferred_bands.find((band) => pro.freq_id[0] === band);
            if(prefBandArrContainsBandId) {
                if(!pro.hints) {
                    pro.hints = [];
                }
                if(pilotInput.preferred_bands.length === 1) {
                    pro.hints.push("NO_BAND_CHANGE_REQUIRED");
                } else {
                    pro.hints.push("BAND_IN_PREFERRED_BANDS");
                }
            } 
        }
        return pro;
    })
};

// =============================================================================================
// Actual express routing stuff
// =============================================================================================
const addCalcExpressRoutes = (app) => {
    // POST route    
    app.post('/api/calc/optimizepilotfreqs', validateCalcReqObject, (req,res) => {
        const {pilots, options} = _.pick(req.body, ['pilots', 'options']); 
        
        // construct pilot object array
        const fpvPilotArr = pilots.map(FpvPilot.fromSimpleObject);

        // override defaults for options where applicable
        let optimizeBy = DEFAULT_OPTIONS_OPTIMIZEBY;
        let minMhzSpacing = DEFAULT_OPTIONS_MINMHZDISTANCE;
        let returnNumResults = DEFAULT_OPTIONS_NUM_RESULTS
        if(options) {
            if(options.min_mhz_spacing) {
                minMhzSpacing = options.min_mhz_spacing;
            }
            if(options.optimize_by) {
                optimizeBy = options.optimize_by;
            }
            if(options.num_results) {
                returnNumResults = options.num_results;
            }
        }

        // the result is an object where:
        // - the solutions are ordered by fitness desc (so, best first)
        // - the individual solution itself (array) is ordered by the given pilot input order
        const inputArgs = {
            pilots: fpvPilotArr, 
            minMhzDistance: minMhzSpacing, 
            optimizeBy: optimizeBy, 
            sortOrder: "desc",
            minFrequency: options.min_frequency ? options.min_frequency : null,
            maxFrequency: options.max_frequency ? options.max_frequency : null
        };
        const computationResult 
            = computeSortAndEnrichSolutions(inputArgs);

        // =============================================================================================
        // Case: return with no solution
        // =============================================================================================
        if(computationResult.solutions_with_fitness.length < 1) {
            return res.status(200).send({
                results: [],
                hints: ["try removing a hard constraint (i.e. if a pilot only has one preferred frequency)", 
                        "try lowering min_mhz_distance if possible"
                ] 
            });
        }        

        // =============================================================================================
        // Case: BEST solution only
        // =============================================================================================
        if(returnNumResults === OPTION_NUM_RESULTS_BEST) {        
            const bestSolutionWithFitness = computationResult.solutions_with_fitness[0];
            const fitness = bestSolutionWithFitness.fitness;
            const solution = remapSolutionObjectsToResultObj(bestSolutionWithFitness.solution);            
            const solutionWHints = addHintsToSolution(solution, pilots);

            return res.status(200).send({
                results: [{
                    solution: solutionWHints,
                    fitness: fitness
                }],
                stats: computationResult.statistics
            });    
        }

        // =============================================================================================
        // Case: ALL solutions (return max 10)
        // =============================================================================================
        if(returnNumResults === OPTION_NUM_RESULTS_MAX_TOP_10) {   
            // a) remap to PilotResultOjects
            const solutionWFitnessAsResultObjs = computationResult.solutions_with_fitness.map((solWFit) => {
                return {
                    solution: remapSolutionObjectsToResultObj(solWFit.solution),
                    fitness: solWFit.fitness
                }
            });
            // b) add hints
            const solutionWFitnessAndHintsAsResultObjs = solutionWFitnessAsResultObjs.map((solWFit) => {
                return {
                    solution: addHintsToSolution(solWFit.solution, pilots),
                    fitness: solWFit.fitness
                }
            });

            return res.status(200).send({
                results: (solutionWFitnessAndHintsAsResultObjs.length <= 10) ? solutionWFitnessAndHintsAsResultObjs : solutionWFitnessAndHintsAsResultObjs.slice(0,10),
                stats: computationResult.statistics
            });    
        }

        return res.status(404).send("that should not have happened!");
    });

    return app;
};

module.exports = {
    addCalcExpressRoutes
}