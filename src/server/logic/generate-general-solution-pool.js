const _ = require('lodash');

const FrequencyObject = require('./classes/FrequencyObject');
const FrequencyUtils = require('./classes/FrequencyUtils');


const DEFAULT_FREQ_POOL_ALL5P8 = FrequencyUtils.getAll5P8FreqsAsOrderedFreqObjArr();

/**
 * Generates an array of type FrequencyObject for the given input requirements. Does return only the first
 * solution that fits these requirement.
 *
 * NOTE: Based on the constraints. The solution array may vary in its size, down to only one element. This
 *       normal behaviour!
 * 
 * Params:
 * ======
 * - minMhzDistance [default=40] = the minimal distance in MHZ the frequencies _must_ be apart from each other
 * - ordFreqObjPool [default = DEFAULT_FREQ_POOL_ALL5P8] = an ordered array of FrequencyObject as input frequencies. (We need a ".freq" property on the object, representing the frequency as as integer)
 * - minFreq [default=orderedFreqObjArr[first]] = the minimal frequency, so the first frequency in the result array must be >= this
 * - maxFreq [default=orderedFreqObjArr[last]] = the maximal frequency, so the last frequency in the result array must be <= this
 * 
 * Result:
 * =======
 * An array of type FrequencyObject that fit the above requirements. (= the first solution that fits).
 * 
 */
const generateFirstFitSolutionForConstraints = (minMhzDistance = 40, 
                                                ordFreqObjPool = DEFAULT_FREQ_POOL_ALL5P8, 
                                                minFreq = ordFreqObjPool[0].freq, 
                                                maxFreq = ordFreqObjPool[ordFreqObjPool.length-1].freq) => {
    // check min-freq
    const minObj = ordFreqObjPool.find((freqObj) => {
        return freqObj.freq === minFreq;
    });
    if(!minObj) {
        throw Error(`illegal min-frequency: ${minFreq}`);
    }

    // check max-freq
    const maxObj = ordFreqObjPool.find((freqObj) => {
        return freqObj.freq === maxFreq;
    });
    if(!maxObj) {
        throw Error(`illegal max-frequency: ${maxFreq}`);
    }

    // check logic (max must be > min )
    if(minObj.freq >= maxObj.freq) {
        return [];
        //throw Error(`infeasible. maxFreq >= minFreq`);
    }

    // compute first possible solution based on all bands.
    // It simply generates a list of frequencies that are at least:
    // a) "minMhzDistance" away from each other and
    // b) between the given "minFreq" and "maxFreq" constraints
    return ordFreqObjPool.reduce((res, next) => {
        if(next.freq >= minObj.freq && next.freq <= maxObj.freq) {
            if(res.length === 0) {
                res.push(next);
            } else {            
                prev = res[res.length-1];
                if(next.freq-prev.freq >= minMhzDistance) {
                    res.push(next);
                }
            }
        }
        return res;
    },[]);
};

/**
 * Generate a pool of solutions (that is an array of arrays, consisting of "FrequencyObject"s) that fits 
 * the constraints of "numPilots"" and "minMhzDistance" (based on given ordered input frequency pool).
 *
 * This is done by utilizing the function "generateFirstFitSolutionByConstraints". 
 * a) We just iterate through
 * all possible frequencies of the "ordFreqObjPool" (our pool of available frequencies), shifting the 
 * "minFreq" upwards each time, so that we generate new solution each time. Each starting with a different 
 * "minFreq".
 * b) Afterwars we evaluate each candidate-solution for the "numPilots" constraint. Meaning, that solution
 * candidates will be filtered out, that don't meet this requirement.
 * 
 * Params:
 * ======
 * - numPilots = The number of pilots (= # of different frequencies in resulting solutions)
 * - ordFreqObjPool [default = DEFAULT_FREQ_POOL_ALL5P8] = an ordered array of FrequencyObject as input frequencies. (We need a ".freq" property on the object, representing the frequency as as integer)
 * - minMhzDistance [default=40] = the minimal distance in MHZ the frequencies _must_ be apart from each other
 * 
 * Result:
 * =======
 * An array of arrays of "FrequencyObject"s, where each (outer) array represents one solution that fulfills 
 * the given constraints.
 * 
 */
const generateSolutionPoolForConstraints = (numPilots,                                                     
                                            minMhzDistance = 40,
                                            ordFreqObjPool = DEFAULT_FREQ_POOL_ALL5P8) => {
    const candidates = ordFreqObjPool.map( (freqObj) => {
        return generateFirstFitSolutionForConstraints(minMhzDistance, ordFreqObjPool, freqObj.freq);
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
        return "" +elem.freq;
    }).reduce( (a,b) => {
        return a+b;
    });
};

/**
 * Generate a pool of solutions (that is an array of arrays, consisting of "FrequencyObject"s) that fits 
 * the constraints of "numPilots"" and "minMhzDistance" (based on given ordered input frequency pool).
 * But in addition we "tense" the "minMhzDistance" constraint by increments of 1 (i.e. 1 Mhz), to generate
 * even more Solutions for the pool.
 * 
 * We do this by repeated calls to "generateSolutionPoolForConstraints", where we constantly increase the
 * "minMhzDistance" until "generateSolutionPoolForConstraints" doesn't find any more feasible solutions.
 * 
 * Params:
 * ======
 * - numPilots = The number of pilots (= # of different frequencies in resulting solutions)
 * - ordFreqObjPool [default = DEFAULT_FREQ_POOL_ALL5P8] = an ordered array of FrequencyObject as input frequencies. (We need a ".freq" property on the object, representing the frequency as as integer)
 * - minMhzDistance [default=40] = the minimal distance in MHZ the frequencies _must_ be apart from each other
 * 
 * Result:
 * =======
 * An array of arrays of "FrequencyObject"s, where each (outer) array represents one solution that fulfills 
 * the given constraints.
 *
*/ 
const generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint = ( numPilots, 
                                                                            minMhzDistance = 40,
                                                                            ordFreqObjPool = DEFAULT_FREQ_POOL_ALL5P8) => {
    let mhzDistance = minMhzDistance;
    let newCandidates = generateSolutionPoolForConstraints(numPilots, mhzDistance, ordFreqObjPool);
    let rawCandidates = [];
    rawCandidates.push(...newCandidates);
        
    while(newCandidates.length > 0) {
        mhzDistance = mhzDistance+1;
        newCandidates = generateSolutionPoolForConstraints(numPilots, mhzDistance, ordFreqObjPool);
        rawCandidates.push(...newCandidates);
    }

    return _.uniqBy(rawCandidates, FrequencyObject.getIdentOfObjArr);   // getIdentOfObjArr will implicitly sort the solution (rawCandidates element / array of freq) ascending first.
}

module.exports = {
    generateFirstFitSolutionForConstraints,
    generateSolutionPoolForConstraints,
    generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint
};




//console.log(generateFirstFitSolutionForConstraints(60));

//console.log(generateSolutionPoolForConstraints(4,60));
//console.log(generateSolutionPoolForConstraints(4,60).length);

//console.log(generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint(4,60));
//console.log(generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint(4,60).length);

/* 
 // Based on naive computation of sum of distance between every two frequencies.
 // TODO: improve function, so that even-spread gets a better rating!
const computeFitnessOfSolutionByFreqDiff = (candidate) => {
    if(!candidate) return -1;

    return candidate.reduce( (res, curr) => {
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

const sortSolutionPoolByFitness = (solutionPool, fnFitness, order="asc") => {
    let sortedAsc = solutionPool.sort((a,b) => {
        if(fnFitness(a) < fnFitness(b)) return -1;
        if(fnFitness(a) > fnFitness(b)) return 1;
        if(fnFitness(a) == fnFitness(b)) return 0;
    });
    if(order === "desc") {
        return sortedAsc.reverse();
    }
    return sortedAsc;
};

const widenedSolPool = generateIncreasedSolutionPoolByMaximizingMinMhzDistanceConstraint(4,80); // will expand up, until no solution can be found
const weightedSortedSolPool = sortSolutionPoolByFitness(widenedSolPool, computeFitnessOfSolutionByFreqDiff, "desc");
console.log("Num solutions: " +weightedSortedSolPool.length);
weightedSortedSolPool.forEach( (solution) => {
    console.log("Solution:",solution);
    console.log("Fitness:" +computeFitnessOfSolutionByFreqDiff(solution));
    console.log("------------");
});
*/