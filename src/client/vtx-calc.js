const _ = require('lodash');
const {
    FREQUENCY_BANDS_5P8GHZ,
    ENUM_FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ
} = require('./../server/db/models/shared-model-constants');

/*
    weight:
    =======
    preferred_frequencies = 8
    preferred_bands = 4 
    bands = 2
    vtx_name = 2
*/

const ORDERED_FREQ_5P8GHZ 
    = Object.values(FREQUENCY_BANDS_5P8GHZ)
            // map bands to array of freq and band. (produces nestes arrays)
            .map((band) => {
                return band.freq.reduce((res, freq) => {
                    res.push({
                        f: freq,
                        b: [band.band],
                        n: [res.length+1]
                    });
                    return res;
                },[]);
            })
            // flatten nested maps out
            .reduce((a,b) => {
                return a.concat(b);
            },[])
            // sort ascending
            .sort((a,b) => {
                if(a.f < b.f) return -1;
                if(a.f > b.f) return 1;
                if(a.f === b.f) return 0;
            })
            // join frequencies that occur in more than one band
            .reduce((res, next) => {        
                const idx = res.findIndex((resElem) => {
                    return _.isEqual(resElem.f, next.f);    // value equality based on frequency
                });              
                if(idx > -1) {
                    res[idx].b.push(next.b[0]);
                    res[idx].n.push(next.n[0]);
                } else {
                    res.push(next);
                }
                return res;
            },[]);

//console.log(ORDERED_FREQ_5P8GHZ);

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

const freqIdToFreqObj = (fId) => {
    if(_.isNumber(fId)) {
        return ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === fId);
    } else if(  _.isString(fId) && 
                fId.length == 2 &&
                _.isNumber(parseInt(fId[1])) &&
                ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(fId[0].toUpperCase()) > -1 &&
                fId[1] > 0 && 
                fId[1] <= 8 
    ) {
        const f = FREQUENCY_BANDS_5P8GHZ[fId[0].toUpperCase()].freq[fId[1]-1];
        return ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === f);
    } else {
        // though, else block is not needed as js returns undefined is nothing is retuned explicitly
        console.log('invalid frequency: ' +fId);
        return;
    }
};

const frequenciesToWeightedFreqsArr = (prefFreqArr, weight=8) => {
    return prefFreqArr.map(freqIdToFreqObj)
        .filter((e) => e !== undefined)
        .map((freqObj) => {
            freqObj.w = weight;
            return freqObj;
        });
};

const bandsToWeightedFreqsArr = (bandsArr, weight=4) => {
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
        .map((freq) => {
            let freqObjWithWeight = freq;
            freqObjWithWeight.w = weight;
            return freqObjWithWeight;
        })
    );
};

console.log(frequenciesToWeightedFreqsArr([5880, 5745, 'a1', 'E5', 'Z5']));
console.log('------');
console.log(bandsToWeightedFreqsArr(['F','A'], 2));