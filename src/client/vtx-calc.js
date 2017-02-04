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

const frequenciesToWeightedFreqsArr = (prefFreqArr) => {
    return prefFreqArr.map((freq) => {
        if(_.isNumber(freq)) {
            let elem = ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === freq);
            elem.w = 8;            
            return elem;

        } else if(  _.isString(freq) && 
                    freq.length == 2 &&
                    ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(freq[0].toUpperCase()) > -1 &&
                    freq[1] > 0 && 
                    freq[1] <= 8 
        ) {
            const f = FREQUENCY_BANDS_5P8GHZ[freq[0].toUpperCase()].freq[freq[1]-1];
            let elem = ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === f);
            elem.w = 8;
            return elem;

        } else {
            console.log('invalid frequency: ' +freq);
            return;
        }
    }).filter((e) => e !== undefined);
};

const bandsToWeightedFreqsArr = (bandsArr, weight) => {
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
console.log(bandsToWeightedFreqsArr(['F','A'], 4));