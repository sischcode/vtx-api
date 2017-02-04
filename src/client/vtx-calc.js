const _ = require('lodash');

const {
    FREQUENCY_BANDS_5P8GHZ,
    ORDERED_FREQ_5P8GHZ,
    ENUM_FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ
} = require('./../server/db/models/shared-model-constants');

/*const req = {
    "pilots":[{
        "name": "Name1",
        "craft_name": "Lisam210-01",
        "vtx_name": "ET25R",
        "bands": ["A", "B", "E", "F", "R"],
        "preferred_bands": ["A","R"],
        "preferred_frequencies": ["A1", 5800],
        "polarisation": "RHCP"
    }]
};
*/

/*
    weight:
    =======
    preferred_frequencies = 8
    preferred_bands = 4 
    bands = 2
    vtx_name = 2
*/

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
    let arr = bandsArr;
    if(!_.isArray(arr)) {
        arr = [bandsArr];
    }
    return _.uniq(
        // check if current band is a string
        arr.filter((band) => {
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

const weightedFreqsFromFreqs = freqsArrToWeightedFreqsObjArr([5880, 5745, 'a1', 'E5', 'Z5']);
const weightedFreqsFromPrefBands = bandsArrToWeightedFreqsObjArr(['R'], 4);
const weightedFreqsFromBands = bandsArrToWeightedFreqsObjArr(['F','R'], 2);
const weightedFreqsFromVtxBands = bandsArrToWeightedFreqsObjArr(['F','R'], 2);
const availableWeightedFreqsRaw = 
    weightedFreqsFromFreqs.concat(weightedFreqsFromPrefBands)
                          .concat(weightedFreqsFromBands)
                          .concat(weightedFreqsFromVtxBands);

const availableWeightedFreqs = _.sortBy(availableWeightedFreqsRaw,'f').reduce((res, curr) => {
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

console.log(availableWeightedFreqsRaw);
console.log('---------------------------------');
console.log(availableWeightedFreqs);