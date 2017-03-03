class FrequencyObject {
    constructor(freq, band, bandNr) {
        this.freq = freq;
        this.band = band;
        this.bandNr = bandNr;
    }

    static fromSimpleObject(obj) {
        return new FrequencyObject(obj.f, obj.b, obj.n);
    }
}

module.exports = FrequencyObject;