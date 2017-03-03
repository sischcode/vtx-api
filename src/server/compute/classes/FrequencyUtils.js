const _ = require('lodash');

const FrequencyObject = require('./FrequencyObject');
const {
    FREQUENCY_BANDS_5P8GHZ,
    ORDERED_FREQ_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ
} = require('./../../db/models/shared-model-constants');


class FrequencyUtils {    
    /**
     * Returns a freqObj for a given "frequency id" (e.g. "A1"). 
     * 
     * Example: "A1" --> FrequencyObject { freq: 5865, band: [ 'A' ], bandNr: [ 1 ] }
     */
    static mkFrequencyObjectFromFreqId(freqId) {
        if(_.isNumber(freqId)) {
            return FrequencyObject.fromSimpleObject(ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === freqId));

        } else if(  _.isString(freqId) && freqId.length == 2 &&
                    _.isNumber(parseInt(freqId[1])) &&
                    ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(freqId[0].toUpperCase()) > -1 &&
                    freqId[1] > 0 && freqId[1] <= 8 
        ) {
            const f = FREQUENCY_BANDS_5P8GHZ[freqId[0].toUpperCase()].freq[freqId[1]-1];
            return FrequencyObject.fromSimpleObject(ORDERED_FREQ_5P8GHZ.find((elem) => elem.f === f));
        } 
        // return implicit 'undefined' on else
    }

    /**
     * Returns an array of FrequencyObjects for the given Band Id (i.e. 'A' or 'R' (RaceBand))
     */
    static mkFrequencyObjectArrFromBandId(bandId) {
        if( !_.isString(bandId) || (ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(bandId.toUpperCase()) === -1) ) {
            // invalid
            return [];
        }

        return ORDERED_FREQ_5P8GHZ.filter((elem) => {
            return elem.b.find((b) => b === bandId.toUpperCase());
        }).map((elem) => {
            if(elem.b.length > 1) {
                const i = elem.b.indexOf(bandId.toUpperCase());
                elem.b = [elem.b[i]];
                elem.n = [elem.n[i]];
            }
            return elem;
        }).map(FrequencyObject.fromSimpleObject);        
    }

    /**
     * Returns an array of FrequencyObjects for a given array of bands (i.e. ['A', 'E'])
     */
    static mkFrequencyObjectArrFromBandIdArr(bandIds) {
        // check that bandsArray is given
        if(!bandIds) {
            return [];
        }
        // check that it's an array
        if(!_.isArray(bandIds)) {
            return [];
        }

        return _.uniq(bandIds.map(FrequencyUtils.mkFrequencyObjectArrFromBandId)
                             .filter((e) => e !== undefined)
                             .filter((e) => e !== []) 
                             .reduce((a,b) => {
                                 return a.concat(b);
                             },[])
                             .filter((e) => e !== undefined)
                             .filter((e) => e !== []) 
                     );
    }
}

module.exports = FrequencyUtils;

//console.log(FrequencyUtils.mkFrequencyObjectFromFreqId(5800));
//console.log(FrequencyUtils.mkFrequencyObjectFromFreqId('A1'));

//console.log(FrequencyUtils.mkFrequencyObjectArrFromBandId('R'));
//console.log(FrequencyUtils.mkFrequencyObjectArrFromBandIdArr(['A', 'R']));