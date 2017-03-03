const _ = require('lodash');

const FrequencyObject = require('./FrequencyObject');

class WeightedFrequencyObject extends FrequencyObject {
    constructor(freq, band, bandNr, weight=2) {
        super(freq,band,bandNr);
        this.weight = weight;
    }

    static fromFrequencyObject(freqObj, weight=2) {
        return new WeightedFrequencyObject(freqObj.freq, freqObj.band, freqObj.bandNr, weight);
    }

    // 1) Takes the obj with higher weight, if duplicates (based on frequency) exist.
    // 2) Returns an array, sorted by frequency
    static dedupAndPreferizeWeightedFreqsObjArr(weightedFreqsObjArrWithDups) {
        return _.sortBy(weightedFreqsObjArrWithDups,'freq')
                .reduce((res, curr) => {
                    if(res.length === 0) {
                        res.push(curr);
                        return res;
                    }

                    const last = res[res.length-1];
                    if(last.freq === curr.freq) {
                        if(curr.weight > last.weight) {
                            res[res.length-1] = curr;
                        }
                    } else {
                        res.push(curr);
                    }
                    return res;
                },[]);
    };
}

module.exports = WeightedFrequencyObject;