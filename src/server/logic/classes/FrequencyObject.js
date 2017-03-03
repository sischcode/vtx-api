class FrequencyObject {
    constructor(freq, band, bandNr) {
        this.freq = freq;
        this.band = band;
        this.bandNr = bandNr;
    }

    static fromSimpleObject(obj) {
        return new FrequencyObject(obj.f, obj.b, obj.n);
    }

    get ident() {
        return this.freq + this.band + this.bandNr;
    }

    /**
     * Will firstly order the input array asc by elem.ident
     */
    static getIdentOfObjArr(objArr) {
        return objArr.map((elem) => elem.ident +"_")
                     .sort((a,b) => {
                         if(a < b) return -1;
                         if(a > b) return 1;
                         if(a == b) return 0;
                     })
                     .reduce( (a,b) => {
                        return a+b;
                     });
    };
}

module.exports = FrequencyObject;

/*const f1 = new FrequencyObject(5900, "A", 1);
const f2 = new FrequencyObject(5800, "F", 2);
console.log(FrequencyObject.getIdentOfObjArr([f1,f2]));*/