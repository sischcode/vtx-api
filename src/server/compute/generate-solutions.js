const _ = require('lodash');
const Combinatorics = require('js-combinatorics');

const {
    getWeightedDedupedFreqsObjArrFromPilot,
    getBandsFromPilot
} = require('./frequencies-from-pilot');
const {
    freqIdToFreqObj, 
    bandsArrToFreqsObjArr
} = require('./band-and-frequency-utils');
const {
    computeOptimalFreqObjArrayForMhzDistance,
    generateSolutionCandidatePoolForFixedMhzMinDistance,
    generateSortedSolutionCandidatePoolForNumPilots
} = require('./generate-candidate-pool');


const req = {
    "pilots":[{
        "name": "Name1",
        "craft_name": "Craft-01",
        "vtx_name": "ET25R",
        "bands": ["A", "B", "E", "F", "R"],
        "preferred_bands": ["A","R"],
        "preferred_frequencies": ["A1", "R1"]
    },{
        "name": "Name2",
        "craft_name": "Craft-02",
        //"bands": ["A", "B", "E", "F", "R"],
        "preferred_bands": ["B"],
        "preferred_frequencies": ["B1"]
    },{
        "name": "Name3",
        "craft_name": "Craft-03",
        "bands": ["A", "B", "E", "F", "R"],
        "preferred_bands": ["F"],
        "preferred_frequencies": ["B5"]
    },{
        "name": "Name4",
        "craft_name": "Craft-04",
        "bands": ["A", "B", "E", "F", "R"],
        "preferred_bands": ["R"],
        "preferred_frequencies": ["R6"]
    }]
};

// todo: check for more than 8 pilots

const pilotsFreqs = req.pilots.map(getWeightedDedupedFreqsObjArrFromPilot);
//console.log("freqs:",pilotsFreqs[0]);

// get possible bands info from pilots (obsolete by FpvPilot.js)
const possibleBands = _.uniq(
    req.pilots.map(getBandsFromPilot)
              // flatten
              .reduce((a,b) => {
                    return a.concat(b);
              },[])
);

// compute ordered freq list from possible bands (obsolete by FrequencyUtils.js)
const baseFreqArr 
    = bandsArrToFreqsObjArr(possibleBands)
        // sort ascending
        .sort((a,b) => {
            if(a.f < b.f) return -1;
            if(a.f > b.f) return 1;
            if(a.f === b.f) return 0;
        });

// generate solution candidates from ordered frequencies
// that is: all possibilities for the given:
// - #pilots
// - minMhzDistance 
// - and available frequencies 
const solutionCandidates 
    = generateSortedSolutionCandidatePoolForNumPilots(req.pilots.length, 60, baseFreqArr);

const getWeightForFreqForPilot = (freq, pilot) => {
    return getWeightedDedupedFreqsObjArrFromPilot(pilot)
                .find( (weightedFreqObj) => {
                    return weightedFreqObj.f == freq;
                });
};

const getWeightArrForFreqForPilots = (freq, pilots) => {
    return pilots.map( (pilot) => {
        return getWeightForFreqForPilot(freq, pilot);
    });
};

/**
 * solutionCandidates = all possibilities (frequency combinations) for the given: #pilots, minMhzDistance and available frequencies (will be FEWER than resulting solutions!)
 * candidate = one combination of frequencies that meets the requirements for #pilots, minMhzDistance and available frequencies 
 */
const generateSolutions = (solutionCandidates) => {
    // One candidate at a time
    const rawSolutions = solutionCandidates.map((candidate) => {
        // for every frequency of the candidate gather the possible weights
        const currCandTupleBase = candidate.map( (candFreqObj) => {
            // get the weight of particular frequency from pilot (if possible)
            return getWeightArrForFreqForPilots(candFreqObj.f, req.pilots).filter( (elem) => elem != undefined);            
        });

        // each pilots name must at least appear once in any of the arrays to construct a feasible solution
        const distinctPilots =
             _.uniq(currCandTupleBase
                    .reduce((a,b) => {
                        return a.concat(b);
                    },[])
                    .filter( (elem) => elem != undefined)
                    .map( (elem) => {
                        return elem.i;
                    })
            );

        // = not feasible
        if(distinctPilots.length !== req.pilots.length) {
            //console.log("...candidate infeasible", candidate);
            return [];
        }

        // at this point it's possible to construct at least one feasible solution, based on the weighted arrays
        // also mind, that the nested arrays in currCandTubleBase are sorted by pilot name
        
        // create tuples (cartesian product...the easy and inefficient way)
        const cartesianProduct = Combinatorics.cartesianProduct(...currCandTupleBase).toArray();
        
        // find valid combinations (based on unique #pilots)
        const feasibleSolutions = cartesianProduct.filter((innerCandidate) => {
            const uniqueNames = _.uniq(innerCandidate.map((elem) => elem.i));
            return uniqueNames.length == req.pilots.length;                          
        });

        return feasibleSolutions;
    })
    // flatten
    .reduce((a,b) => {
        return a.concat(b);
    },[]);
    
    /*// it's already duplicate free...
    const identOfSolution = (solutionArrSortedByFreq) => {
        return solutionArrSortedByFreq.map( (elem) => {
            return "" +elem.f +"_" +elem.i +"_";
        }).reduce( (a,b) => {
            return a+b;
        });
    };
    const uniqueSolutions = _.uniqBy(rawSolutions, identOfSolution);*/

    return rawSolutions;
};

//console.log(generateSolutions(solutionCandidates.slice(0,10))); // test a feasible candidate

const unorderedSolutions = generateSolutions(solutionCandidates);

const evaluateFitnessOfSolution = (solution) => {
    if(!solution || solution.length == 0) {
        return 0;
    }

    return solution.map((freqObj) => {
        return freqObj.w;
    }).reduce( (a,b) => {
        return a+b;
    },0);
};

const orderedSolutions = unorderedSolutions.sort((a,b) => {
    if(evaluateFitnessOfSolution(a) > evaluateFitnessOfSolution(b)) return -1;
    if(evaluateFitnessOfSolution(a) < evaluateFitnessOfSolution(b)) return 1;
    if(evaluateFitnessOfSolution(a) == evaluateFitnessOfSolution(b)) return 0;
});

// note that there can be more solutions than combinations (=solution candidate), because these are different things.
// a) a solution candidate is the actual combinations,
// b) a solutions is the "implementation" of a combination. 
// =========================================================
// in other words, a solution candidate only has the set of frequency and no info of who holds the frequency. thusly there are much fewer combinations.
// each combination (solution candidate) can be build up multiple times through solutions...
console.log("num solution candidates (= valid combinations): " +solutionCandidates.length);

console.log("total solutions: " +orderedSolutions.length);

console.log("Best: Fitness:  " +evaluateFitnessOfSolution(orderedSolutions[0]));
console.log("Best: Solution: ",orderedSolutions[0]);

console.log("Worst: Fitness:  " +evaluateFitnessOfSolution(orderedSolutions[orderedSolutions.length-1]));
console.log("Worst: Solution: ",orderedSolutions[orderedSolutions.length-1]);


// TODO 1: (alternative) optimize over mhzDistance (gt is better) -> work down from very high distance until a solution is found -> will sacrifice fitness!

// TODO 2: try to increase mhzDistance without sacrificing fitness.
//         (lowest mhzDistance determines highest possible fitness)

// Currently it is optimized for weight (i.e. so that it minimizes the pilots that have to change frequency)

// let user decide minimal mhz Distance, then let them either maximize by a) fitness or b) mhzdistance