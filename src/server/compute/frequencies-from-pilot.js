const _ = require('lodash');

const {
    freqIdToFreqObj,
    bandsArrToFreqsObjArr
} = require('./band-and-frequency-utils');

/*
    OBSOLETE by FpvPilot.js
*/


const freqsArrToWeightedFreqsObjArr = (prefFreqArr, weight=8) => {
    return prefFreqArr.map(freqIdToFreqObj)
        .filter((e) => e !== undefined)
        .map((freqObj) => {
            return {
                f: freqObj.f,
                b: freqObj.b,
                n: freqObj.n,
                w: weight
            };
        });
};

const bandsArrToWeightedFreqsObjArr = (bandsArr, weight=4) => {
    // enrich with weight
    return bandsArrToFreqsObjArr(bandsArr)
            .map((freqObj) => {
                return {
                    f: freqObj.f,
                    b: freqObj.b,
                    n: freqObj.n,
                    w: weight
                };
            });
};

// 1) Takes the obj with higher weight, if duplicates (based on frequency) exist.
// 2) Returns an array, sorted by frequency
const dedupAndPreferizeWeightedFreqsObjArr = (raw) => {
    return _.sortBy(raw,'f')
            .reduce((res, curr) => {
                if(res.length === 0) {
                    res.push(curr);
                    return res;
                }

                const last = res[res.length-1];
                if(last.f === curr.f) {
                    if(curr.w > last.w) {
                        res[res.length-1] = curr;
                    }
                } else {
                    res.push(curr);
                }
                return res;
            },[]);
};

/*  weight:
    =======
    preferred_frequencies = 8
    preferred_bands = 4 
    bands = 2
    vtx_name = 2

    polarisation defaults to 'RCHP'

    Object: {
        f: <frequency>,
        b: [<band>],
        n: [<number-in-band>],
        w: <weight>,
        p: <polarisation>,
        i: <identifier-pilotname>,
    }
*/
const getWeightedDedupedFreqsObjArrFromPilot = (pilot) => {
    const weightedFreqsFromFreqs     = freqsArrToWeightedFreqsObjArr(pilot.preferred_frequencies, 8);
    const weightedFreqsFromPrefBands = bandsArrToWeightedFreqsObjArr(pilot.preferred_bands, 4);
    const weightedFreqsFromBands     = bandsArrToWeightedFreqsObjArr(pilot.bands, 2);
    
    // to be extracted from VTX name
    //const weightedFreqsFromVtxBands  = bandsArrToWeightedFreqsObjArr(['F','R'], 2);

    const availableWeightedFreqsRaw = weightedFreqsFromFreqs.concat(weightedFreqsFromPrefBands)
                                                            .concat(weightedFreqsFromBands);
    // add polarisation
    return dedupAndPreferizeWeightedFreqsObjArr(availableWeightedFreqsRaw).map((fo) => {
        fo.p = pilot.polarisation || 'RCHP';
        fo.i = pilot.name;
        return fo;
    });
};

/**
 * Get available bands from pilot:
 * - bands, if available, OR
 * - preferred_bands, if available, OR
 * - band info constructed from preferred_frequencies
 * 
 * Returns an array of Bands (i.e. ['A', 'E', 'R'])
 */
const getBandsFromPilot = (pilot) => {
    if(pilot.bands) {
        return pilot.bands;
    } 

    if(pilot.preferred_bands) {
        return pilot.preferred_bands;
    }

    if(pilot.preferred_frequencies) {
        return _.uniq(pilot.preferred_frequencies
                            .map(freqIdToFreqObj)
                            .filter((e) => e !== undefined)
                            .map( (elem) => elem.b)
                            // flatten
                            .reduce((a,b) => {
                                return a.concat(b);
                            },[])
        );
    }

    return [];
};

module.exports = {
    getWeightedDedupedFreqsObjArrFromPilot,
    getBandsFromPilot
};