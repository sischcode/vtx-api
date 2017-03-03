const WeightedFrequencyObject = require('./WeightedFrequencyObject');

class PilotFrequencyObject extends WeightedFrequencyObject {
    constructor(freq, band, bandNr, weight, pilotName, polarisation='RHCP') {
        super(freq, band, bandNr, weight);
        this.polarisation = polarisation;
        this.pilotName = pilotName;
    }

    static fromWeightedFrequencyObject(weightedFreqObj, pilotName, polarisation='RHCP') {
        return new PilotFrequencyObject(weightedFreqObj.freq, 
                                        weightedFreqObj.band, 
                                        weightedFreqObj.bandNr, 
                                        weightedFreqObj.weight,
                                        pilotName, 
                                        polarisation);
    }    
}

module.exports = PilotFrequencyObject;