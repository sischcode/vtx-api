const _ = require('lodash');

const {ORDERED_FREQ_5P8GHZ} = require('./../db/models/shared-model-constants');

/**
 * Generates an array of frequency objects for the given input requirements. Does return only the first
 * solution that fits these requirement.
 * 
 * Params:
 * ======
 * - orderedFreqObjArr [default = ORDERED_FREQ_5P8GHZ] = an ordered array of freqObj objects. e.g.: {f: 5645, b: ['E'], n: [1]} as input frequencies
 * - minMhzDistance [default=40] = the minimal distance in MHZ the frequencies _must_ be apart from each other
 * - minFreq [default=orderedFreqObjArr[first]] = the minimal frequency, so the first frequency in the result array must be >= this
 * - maxFreq [default=orderedFreqObjArr[last]] = the maximal frequency, so the last frequency in the result array must be <= this
 * 
 * Result:
 * =======
 * orderedFreqObjArr = an ordered array of freqObj objects that fit the above requirements.
 *                     Only one (the first) solution that fits.
 * 
 */
const computeOptimalFreqObjArrayForMhzDistance = (  orderedFreqObjArr = ORDERED_FREQ_5P8GHZ, 
                                                    minMhzDistance = 40, 
                                                    minFreq = orderedFreqObjArr[0].f, 
                                                    maxFreq = orderedFreqObjArr[orderedFreqObjArr.length-1].f) => {
    // check min-freq
    const minObj = orderedFreqObjArr.find((freqObj) => {
        return freqObj.f === minFreq;
    });
    if(!minObj) {
        throw Error(`illegal min-frequency: ${minFreq}`);
    }

    // check max-freq
    const maxObj = orderedFreqObjArr.find((freqObj) => {
        return freqObj.f === maxFreq;
    });
    if(!maxObj) {
        throw Error(`illegal max-frequency: ${maxFreq}`);
    }

    // check logic (max must be > min )
    if(minObj.f >= maxObj.f) {
        return [];
        //throw Error(`infeasible. maxFreq >= minFreq`);
    }

    // compute first possible solution based on all bands
    return orderedFreqObjArr.reduce((res, next) => {
        if(next.f >= minObj.f && next.f <= maxObj.f) {
            if(res.length === 0) {
                res.push(next);
            } else {            
                prev = res[res.length-1];
                if(next.f-prev.f >= minMhzDistance) {
                    res.push(next);
                }
            }
        }
        return res;
    },[]);
};

/**
 * Generate a pool of solutions (that is an array of frequency-array objects) that fits the requirements. 
 * (# pilots, mhz distance)
 * This is done by utilizing the function "computeOptimalFreqObjArrayForMhzDistance". We just iterate through
 * all possible frequencies of the input array, shifting the min-frequency upwards each time.
 * 
 * Params:
 * ======
 * - numPilots = The number of pilots (= # of different frequencies in resulting solutions)
 * - orderedFreqObjArr [default = ORDERED_FREQ_5P8GHZ] = an ordered array of freqObj objects. 
 *                                e.g.: {f: 5645, b: ['E'], n: [1]} as input frequencies
 * - minMhzDistance [default=40] = the minimal distance in MHZ the frequencies _must_ be apart from each other
 * 
 * Result:
 * =======
 * [orderedFreqObjArr] = an ordered array of freqObj-object-arrays that fit the above requirements.
 * 
 */
const generateSolutionCandidatePoolForFixedMhzMinDistance = (numPilots,                                                     
                                                             minMhzDistance = 40,
                                                             orderedFreqObjArr = ORDERED_FREQ_5P8GHZ) => {
    const candidates = orderedFreqObjArr.map( (freqObj) => {
        return computeOptimalFreqObjArrayForMhzDistance(orderedFreqObjArr, minMhzDistance, freqObj.f);
    });

    let res = candidates.filter( (candidate) => {
        return candidate.length >= numPilots;
    }).map( (candidate) => {
        if(candidate.length == numPilots) return candidate;
        return candidate.slice(0,numPilots);
    });

    return res;
};

const identOfFreqArrObj = (arrOfFreqObj) => {
    return arrOfFreqObj.map( (elem) => {
        return "" +elem.f;
    }).reduce( (a,b) => {
        return a+b;
    });
};

/**
 * Based on naive computation of sum of distance between every two frequencies.
 */
const computeFitnessOfCandidate = (candidate) => {
    if(!candidate) return -1;

    return candidate.reduce( (res, curr) => {
        if(res[0] == null) {
            res[0] = curr;
        } else {
            const prev = res[0];
            const diff = curr.f - prev.f;
            res[1] = res[1]+diff;
            res[0] = curr;
        }
        return res;
    }, [null,0])[1];   
};

/**
 * We generate a pool of solutions that fit the requirements/constraints. We do this by
 * utilizing "generateSolutionPoolForFixedMhzMinDistance" and shifting the distance param
 * upwards until no solution can be found any more. Effectively ending the search.
 * These candidates are then sorted by their "fitness" and the resulting array (of arrays)
 * is returned.
 * 
 * Params:
 * ======
 * - numPilots = The number of pilots (= # of different frequencies in resulting solutions)
 * - orderedFreqObjArr [default = ORDERED_FREQ_5P8GHZ] = an ordered array of freqObj objects. 
 *                                e.g.: {f: 5645, b: ['E'], n: [1]} as input frequencies
 * - minMhzDistance [default=40] = the minimal distance in MHZ the frequencies _must_ be apart from each other
 * 
 * Result:
 * =======
 * [orderedFreqObjArr] = an ordered array of freqObj-object arrays that fit the above requirements.
 *
*/ 
const generateSortedSolutionCandidatePoolForNumPilots = (numPilots, 
                                                         minMhzDistance = 40,
                                                         orderedFreqObjArr = ORDERED_FREQ_5P8GHZ) => {
    let mhzDistance = minMhzDistance;
    let newCandidates = generateSolutionCandidatePoolForFixedMhzMinDistance(numPilots, mhzDistance, orderedFreqObjArr);
    let rawCandidates = [];
    rawCandidates.push(...newCandidates);
        
    while(newCandidates.length > 0) {
        mhzDistance = mhzDistance+1;
        newCandidates = generateSolutionCandidatePoolForFixedMhzMinDistance(numPilots, mhzDistance, orderedFreqObjArr);
        rawCandidates.push(...newCandidates);
    }

    return _.uniqBy(rawCandidates, identOfFreqArrObj)
            .sort((a,b) => {
                if(computeFitnessOfCandidate(a) > computeFitnessOfCandidate(b)) return -1;
                if(computeFitnessOfCandidate(a) < computeFitnessOfCandidate(b)) return 1;
                if(computeFitnessOfCandidate(a) == computeFitnessOfCandidate(b)) return 0;
            });
}

/*const res = generateSortedSolutionCandidatePoolForNumPilots(4, 60);
console.log(res.length +" candidates meet the requirements");
const firstNSolutions = res.slice(0,5);

firstNSolutions.forEach( (solution) => {
    console.log("Solution:" +solution);
    console.log("Fitness:" +computeFitnessOfCandidate(solution));
    console.log("------------");
});*/

module.exports = {
    computeOptimalFreqObjArrayForMhzDistance,
    generateSolutionCandidatePoolForFixedMhzMinDistance,
    generateSortedSolutionCandidatePoolForNumPilots
};