class PilotResultObject {
    constructor(pilot_name, craft_name, freq, freq_id, polarization, hints) {
        this.pilot_name = pilot_name;
        this.craft_name = craft_name;
        this.freq = freq;
        this.freq_id = freq_id;
        this.polarization = polarization;
        this.hints = hints;
    }

    static fromPilotFrequencyObject(pfo, hints) {
        return new PilotResultObject(
            pfo.pilotName,
            pfo.craftName,
            pfo.freq,
            pfo.band + pfo.bandNr,
            pfo.polarization,
            hints
        );
    }
}

module.exports = PilotResultObject;