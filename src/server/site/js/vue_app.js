const pilotToPilotReq = (pilot) => {
    const prefBands = pilot.bands.filter((band) => band.sel).map((band) => band.name);

    const prefFreqs = pilot.bands.map((band) => {
        return band.freqs.filter((freq) => freq.sel)
                         .map((freq) => freq.name);
    })// flatten
    .reduce((a,b) => {
        return a.concat(b);
    },[]);

    let valid = false;
    let pilotInput =  {};
    pilotInput.pilot_name = pilot.name;
    if(pilot.allBands === true) {
        pilotInput.bands = pilot.bands.map((band) => band.name);
        valid = true;
    }
    if(prefBands.length > 0) {
        pilotInput.preferred_bands = prefBands;        
        valid = true;
    }
    if(prefFreqs.length > 0) {
        pilotInput.preferred_frequencies = prefFreqs;
        valid = true
    }    
    
    return (valid ? pilotInput : null);
};

const mkPilot = (name) => {
    return {
        name: name,
        allBands: false,
        bands: [{
            name: 'A',
            sel: false,
            freqs: [ 
                {name: 'A1', freq: 5865, sel: false},
                {name: 'A2', freq: 5845, sel: false},
                {name: 'A3', freq: 5825, sel: false},
                {name: 'A4', freq: 5805, sel: false},
                {name: 'A5', freq: 5785, sel: false},
                {name: 'A6', freq: 5765, sel: false},
                {name: 'A7', freq: 5745, sel: false},
                {name: 'A8', freq: 5725, sel: false}
            ]
        },{
            name: 'B',
            sel: false,
            freqs: [ 
                {name: 'B1', freq: 5733, sel: false},
                {name: 'B2', freq: 5752, sel: false},
                {name: 'B3', freq: 5771, sel: false},
                {name: 'B4', freq: 5790, sel: false},
                {name: 'B5', freq: 5809, sel: false},
                {name: 'B6', freq: 5828, sel: false},
                {name: 'B7', freq: 5847, sel: false},
                {name: 'B8', freq: 5866, sel: false}
            ]
        },{
            name: 'E',
            sel: false,
            freqs: [ 
                {name: 'E1', freq: 5705, sel: false},
                {name: 'E2', freq: 5685, sel: false},
                {name: 'E3', freq: 5665, sel: false},
                {name: 'E4', freq: 5645, sel: false},
                {name: 'E5', freq: 5885, sel: false},
                {name: 'E6', freq: 5905, sel: false},
                {name: 'E7', freq: 5925, sel: false},
                {name: 'E8', freq: 5945, sel: false}
            ]
        },{
            name: 'F',
            sel: false,
            freqs: [ 
                {name: 'F1', freq: 5740, sel: false},
                {name: 'F2', freq: 5760, sel: false},
                {name: 'F3', freq: 5780, sel: false},
                {name: 'F4', freq: 5800, sel: false},
                {name: 'F5', freq: 5820, sel: false},
                {name: 'F6', freq: 5840, sel: false},
                {name: 'F7', freq: 5860, sel: false},
                {name: 'F8', freq: 5880, sel: false}
            ]
        },{
            name: 'R',
            sel: false,
            freqs: [ 
                {name: 'R1', freq: 5658, sel: false},
                {name: 'R2', freq: 5695, sel: false},
                {name: 'R3', freq: 5732, sel: false},
                {name: 'R4', freq: 5769, sel: false},
                {name: 'R5', freq: 5806, sel: false},
                {name: 'R6', freq: 5843, sel: false},
                {name: 'R7', freq: 5880, sel: false},
                {name: 'R8', freq: 5917, sel: false}
            ]
        }]
    }
}

const pilotInput = new Vue({
    el: '#pilots-input',
    data: {        
        pilots: [],
        pref: {
            mindist: 60,
            optimizeby: 'pilot_preference'
        },
        result: {
            data: null,
            hidden: true
        }
    },

    mounted() {
        this.pilots = [mkPilot('Name-1'), mkPilot('Name-2')];
    },

    /*beforeUpdate() {
        console.log('BEFORE UPDATE // TODO: implement logic for all-bands-check');        
    },*/

    methods: {
        reset() {
            this.pilots = [mkPilot('Name-1'), mkPilot('Name-2')];
            this.result.data = null;
            this.result.hidden = true;
        },        
        addPilotInput() {
            if(this.pilots.length < 8) {
                const n = this.pilots.length+1;
                this.pilots.push(mkPilot('Name-' +n));
            }
        },
        computeSolutions() {
            const pilotsInput = this.pilots.map(pilotToPilotReq);
            if(pilotsInput.some((e) => e === null)) {
                this.result.data = "One or more pilots don't have sufficient freq-config to compute a solution";
                this.result.hidden = false;
                return;
            }

            const postRequest = {
                pilots: pilotsInput,
                options: {
                    optimize_by: this.pref.optimizeby,
                    min_mhz_spacing: this.pref.mindist
                }
            };

            console.log(JSON.stringify(postRequest));

            axios.post('/api/calc/optimizepilotfreqs', postRequest)
                 .then(response => {
                     console.log(response.data);
                     this.result.data = response.data;
                     this.result.hidden = false;
                 })
                 .catch(error => {
                     console.log("error", error);
                     this.result.data = error;
                     this.result.hidden = false;
                 });
        }
    }
});

