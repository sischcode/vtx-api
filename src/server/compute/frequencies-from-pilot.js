const _ = require('lodash');

const {
    FREQUENCY_BANDS_5P8GHZ,
    ORDERED_FREQ_5P8GHZ,
    ENUM_FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ
} = require('./../db/models/shared-model-constants');


const freqIdToFreqObj = (fId) => {
    if(_.isNumber(fId)) {
        return ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === fId);
    } else if(  _.isString(fId) && fId.length == 2 &&
                _.isNumber(parseInt(fId[1])) &&
                ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(fId[0].toUpperCase()) > -1 &&
                fId[1] > 0 && fId[1] <= 8 
    ) {
        const f = FREQUENCY_BANDS_5P8GHZ[fId[0].toUpperCase()].freq[fId[1]-1];
        return ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === f);
    } else {
        // though, else block is not needed as js returns undefined is nothing is retuned explicitly
        console.log('invalid frequency: ' +fId);
        return;
    }
};

const freqsArrToWeightedFreqsObjArr = (prefFreqArr, weight=8) => {
    return prefFreqArr.map(freqIdToFreqObj)
        .filter((e) => e !== undefined)
        .map((freqObj) => {
            return {
                f: freqObj.f,
                b: freqObj.b,
                w: weight
            };
        });
};

const bandsArrToWeightedFreqsObjArr = (bandsArr, weight=4) => {
    // check that bandsArray is given
    if(bandsArr === undefined) {
        return [];
    }
    // check that it's an array
    if(!_.isArray(bandsArr)) {
        return [];
    }

    return _.uniq(
        // check if current band is a string
        bandsArr.filter((band) => {
            return _.isString(band);
        })
        // uppercase all remaining bands
        .map((band) => {
            return band.toUpperCase();
        })
        // filter out unknown bands
        .filter((band) => {
            return ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(band) > -1;
        })
        // get freq objects, based on band        
        .map((band) => {
            return ORDERED_FREQ_5P8GHZ.filter((freqObj) => {
                return freqObj.b.find((b) => b === band);
            });
        })
        // flatten
        .reduce((a,b) => {
            return a.concat(b);
        },[])
        // enrich with weight
        .map((freqObj) => {
            return {
                f: freqObj.f,
                b: freqObj.b,
                w: weight
            };
        })
    );
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
        fo.p = pilot.polarisation;
        fo.n = pilot.name;
        return fo;
    });
};

/*const req = {
    "pilots":[{
        "name": "Name1",
        "craft_name": "Lisam210-01",
        "vtx_name": "ET25R",
        //"bands": ["A", "B", "E", "F", "R"],
        "preferred_bands": ["A","R"],
        "preferred_frequencies": ["A1", 5800],
        "polarisation": "RHCP"
    }]
};
console.log(getWeightedDedupedFreqsObjArrFromPilot(req.pilots[0]));*/