const _ = require('lodash');

const FrequencyObject = require('./FrequencyObject');
const {
    FREQUENCY_BANDS_5P8GHZ,
    ORDERED_FREQ_5P8GHZ_SIMPLE,
    ENUM_ALL_COMMON_BANDS_5P8GHZ
} = require('./../../db/models/shared-model-constants');


class FrequencyUtils {    
    /**
     * Returns a freqObj for a given "frequency id" (e.g. "A1").      * 
     * Example: "A1" --> FrequencyObject { freq: 5865, band: 'A', bandNr: 1 }
     * Note: we disallow simple frequency input (i.e. 5880), because of 
     *       ambiguity. (Sadly, the combination F8/R7 ruins it all!)
     */
    static mkFrequencyObjectFromFreqId(freqId) {
        if(  _.isString(freqId) && freqId.length == 2 &&
                    _.isNumber(parseInt(freqId[1])) &&
                    ENUM_ALL_COMMON_BANDS_5P8GHZ.indexOf(freqId[0].toUpperCase()) > -1 &&
                    freqId[1] > 0 && freqId[1] <= 8 
        ) {
            const f = FREQUENCY_BANDS_5P8GHZ[freqId[0].toUpperCase()].freq[freqId[1]-1];
            return FrequencyObject.fromSimpleObject(ORDERED_FREQ_5P8GHZ_SIMPLE.find((elem) => elem.f === f));
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

        return ORDERED_FREQ_5P8GHZ_SIMPLE.filter((elem) => {
            return elem.b === bandId.toUpperCase();
        })
        .map(FrequencyObject.fromSimpleObject);        
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

    /**
     * Create a sorted array of freqObj, based on the available bands in the 5.8GHz spectrum.
     */
    static getAll5P8FreqsAsOrderedFreqObjArr() {
        return ORDERED_FREQ_5P8GHZ_SIMPLE.map(FrequencyObject.fromSimpleObject);
    }

    /**
     * Sort an array FrequencyObject (or its childs)
     */
    static sortByFreq(arr, order="asc") {
        const arrSortedAsc = arr.sort((a,b) => {
            if(a.freq < b.freq) return -1;
            if(a.freq > b.freq) return 1;
            if(a.freq === b.freq) return 0;
        });
        if(order === "desc") {
            return arrSortedAsc.reverse();
        }
        return arrSortedAsc;
    }
}

module.exports = FrequencyUtils;

/*console.log(FrequencyUtils.mkFrequencyObjectFromFreqId(5800));
console.log(FrequencyUtils.mkFrequencyObjectFromFreqId('A1'));

console.log(FrequencyUtils.mkFrequencyObjectArrFromBandId('R'));
console.log(FrequencyUtils.mkFrequencyObjectArrFromBandIdArr(['A', 'R']));

console.log(FrequencyUtils.getAll5P8FreqsAsOrderedFreqObjArr());*/