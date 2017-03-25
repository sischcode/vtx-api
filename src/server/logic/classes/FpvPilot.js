const _ = require('lodash');

const FrequencyUtils = require('./FrequencyUtils');
const WeightedFrequencyObject = require('./WeightedFrequencyObject');
const PilotFrequencyObject = require('./PilotFrequencyObject');

/*  weight:
    =======
    preferred_frequencies = 8
    preferred_bands = 4 
    bands = 2
    vtx_name = 2

    polarisation defaults to 'RCHP'
*/
class FpvPilot {
    constructor(pilot_name, craft_name, vtx_name, bands, preferred_bands, preferred_frequencies, polarization='RHCP') {
        this.pilot_name = pilot_name;
        this.craft_name = craft_name;
        this.vtx_name = vtx_name;
        this.bands = bands;
        this.preferred_bands = preferred_bands;
        this.preferred_frequencies = preferred_frequencies;
        this.polarization = polarization;

        // the following 4 properties are computed here, though keep in mind, that
        // this will currently NOT be recomputed, when values (frequencies) of the
        // pilot are changed!!!
        // Currently this is duplicate code, i've yet figure how to cleanup correctly

        this.weightedFreqObjArrOfPrefFreqs 
            = preferred_frequencies 
                ? preferred_frequencies.map(FrequencyUtils.mkFrequencyObjectFromFreqId)
                                       .filter((e) => e !== undefined)
                                       .filter((e) => e !== null)
                                       .map((e) => WeightedFrequencyObject.fromFrequencyObject(e, 8))    // weight of 8
                :[];
        
        this.weightedFreqObjArrOfPrefBands = FrequencyUtils.mkFrequencyObjectArrFromBandIdArr(this.preferred_bands)
                                                           .map((e) => WeightedFrequencyObject.fromFrequencyObject(e, 4));    // weight of 4

        this.weightedFreqObjArrOfBands = FrequencyUtils.mkFrequencyObjectArrFromBandIdArr(this.bands)
                                                       .map((e) => WeightedFrequencyObject.fromFrequencyObject(e, 2));    // weight of 2              

        
        // a) deduplicate (and when doing so, preferize by weight, where duplicates are)
        // b) add pilot-name and polarisation info and convert to 'PilotFrequencyObject's
        this.dedupedWeightedPilotFreqObjArr = 
            WeightedFrequencyObject.dedupAndPreferizeWeightedFreqsObjArr([].concat(this.weightedFreqObjArrOfPrefFreqs)
                                                                           .concat(this.weightedFreqObjArrOfPrefBands)
                                                                           .concat(this.weightedFreqObjArrOfBands) )
                                    .map((weightedFreqObj) => {
                                        return PilotFrequencyObject.fromWeightedFrequencyObject(weightedFreqObj, 
                                                                                                this.pilot_name,
                                                                                                this.craft_name, 
                                                                                                this.polarization);
                                    });           
                
    }

    static fromSimpleObject(obj) {
        return new FpvPilot(obj.pilot_name,
                            obj.craft_name,
                            obj.vtx_name,
                            obj.bands,
                            obj.preferred_bands,
                            obj.preferred_frequencies,
                            obj.polarization);
    }
    
    /**
     * return a "PilotFrequencyObject" for a frequency
     * ( we us the "cached" variant of the deduped frequencies now)
     */
    getPilotFrequencyObjectForFreq(freq) {
        return this.dedupedWeightedPilotFreqObjArr.find((weightedFreqObj) => {
            return weightedFreqObj.freq === freq;
        });
    }

    /**
     * Get available bands from pilot:
     * - bands, if available, OR
     * - preferred_bands, if available, OR
     * - band info constructed from preferred_frequencies
     * 
     * Returns an array of Bands (i.e. ['A', 'E', 'R'])
     */
    getAvailableBands() {
        if(this.bands) {
            return this.bands;
        } 

        if(this.preferred_bands) {
            return this.preferred_bands;
        }

        if(this.preferred_frequencies) {
            return _.uniq(_.flatten(this.preferred_frequencies.map(FrequencyUtils.mkFrequencyObjectFromFreqId)
                                                              .filter(e => e !== undefined)
                                                              .map(obj => obj.band) ) );
        }

        return [];
    };

    /**
     * given a list of pilots, compute the possible bands that can be used
     */
    static getPossibleBandPoolFromPilots(fpvPilotsArr) {
        if(!fpvPilotsArr || !_.isArray(fpvPilotsArr)) {
            return [];
        }
        return _.uniq(_.flatten(fpvPilotsArr.map(pilot => pilot.getAvailableBands() )));
    }    

    /**
     * returns an array of "PilotFrequencyObject"s
     */
    static getPilotFrequencyObjectsForFreq(freq, pilots) {
        return pilots.map(pilot => pilot.getPilotFrequencyObjectForFreq(freq));
    };
}

module.exports = FpvPilot;

/*
const testPilot = new FpvPilot(
    'Name-01',
    'Craft-01',
    'ET25R',
    ["A", "B", "E", "F", "R"],
    ["A", "R"],
    ["A1", "R1"]
);
console.log(testPilot);
console.log("------------------------------------------");
console.log(testPilot.getWeightedFreqObjArrOfPrefFreqs());
console.log("------------------------------------------");
console.log(testPilot.getWeightedFreqObjArrOfPrefBands());
console.log("------------------------------------------");
console.log(testPilot.getWeightedFreqObjArrOfBands());
console.log("------------------------------------------");
console.log(testPilot.getDedupedWeightedPilotFreqObjArr());
*/

/*
const testPilot1 = new FpvPilot(
    'Name-01',
    'Craft-01',
    'ET25R',
    null,
    null,
    ['A1','R1']
);

console.log(testPilot1.getAvailableBands());
*/

/*
const testPilot2 = new FpvPilot(
    'Name-01',
    'Craft-01',
    'ET25R',
    ["A", "B", "E"],
    ["A", "R"],
    ["A1", "R1"]
);
const testPilot3 = new FpvPilot(
    'Name-01',
    'Craft-01',
    'ET25R',
    ["E", "F", "R"],
    ["A", "R"],
    ["A1", "R1"]
);
const pilots = [testPilot2,testPilot3];
console.log(FpvPilot.getPossibleBandPoolFromPilots(pilots));
*/

/*
const testPilot = new FpvPilot(
    'Name-01',
    'Craft-01',
    'ET25R',
    ["B"],
    ["R"],
    ["R1"]
);
console.log(testPilot.getDedupedWeightedPilotFreqObjArr().map(e => e.freq));
console.log("-------");
console.log(testPilot.dedupedWeightedPilotFreqObjArr.map(e => e.freq));
*/