const _ = require('lodash');

const {
    FREQUENCY_BANDS_5P8GHZ,
    ORDERED_FREQ_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ
} = require('./../db/models/shared-model-constants');

/**
 * Returns a freqObj for a given "frequency id" (e.g. "A1").
 * Example: "A1" --> {f: 5865, b: ['A'], n: [1]}
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

/**
 * Returns an array of freqObj for a given array of bands (i.e. ['A', 'E'])
 */
const bandsArrToFreqsObjArr = (bandsArr) => {
    // check that bandsArray is given
    if(!bandsArr) {
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
    );
};

module.exports = {
    freqIdToFreqObj,
    bandsArrToFreqsObjArr
}