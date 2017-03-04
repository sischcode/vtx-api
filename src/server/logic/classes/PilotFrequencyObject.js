const WeightedFrequencyObject = require('./WeightedFrequencyObject');

class PilotFrequencyObject extends WeightedFrequencyObject {
    constructor(freq, band, bandNr, weight, pilotName, craftName, polarization="RHCP") {
        super(freq, band, bandNr, weight);
        this.polarization = polarization;
        this.pilotName = pilotName;
        this.craftName = craftName;
    }

    /**
     * @override
     */
    get ident() {
        return super.ident + this.pilotName + this.polarization;
    }

    static fromWeightedFrequencyObject(weightedFreqObj, pilotName, craftName, polarization="RHCP") {
        return new PilotFrequencyObject(weightedFreqObj.freq, 
                                        weightedFreqObj.band, 
                                        weightedFreqObj.bandNr, 
                                        weightedFreqObj.weight,
                                        pilotName, 
                                        craftName,
                                        polarization);
    }    
}

module.exports = PilotFrequencyObject;