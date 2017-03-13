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

const pref_def_mindist = 60;
const pref_def_optimizeby = 'pilot_preference';
const pref_def_numresults = 'BEST';

const init = () => {    
    return {
        // PilotInput-Area
        pilots: [mkPilot('Name-1'), mkPilot('Name-2')],
        // Preferences
        prefs: {
            min_mhz_dist: pref_def_mindist,
            optimize_by: pref_def_optimizeby
        },
        // Result View
        result: {
            data: null,
            hidden: true
        },
        // Error View
        error: {
            data: null,
            hidden: true
        },
        // Debug View
        debug: {
            is_debug_mode: false,
            data: null,
            hidden: true
        }
    }   
};


Vue.component('pilot-result', {
  props: ['pilot', 'index'],
  template: ` <li v-id="pilot" :id="'pilot-' +index +'-config'" class="list-group-item"> 
                <div class="row">
                    <div class="col col-xs-12 col-sm-3 col-md-2 col-lg-2" >
                        <h4><span class="glyphicon glyphicon-equalizer"></span>  <label class="label label-info">{{pilot.freq_id}} <span class="badge">{{pilot.freq}}</span></label></h4>
                    </div>                    
                    <div class="col col-xs-12 col-sm-4 col-md-4 col-lg-3 text-left">
                        <h4><span class="glyphicon glyphicon-user"></span> <strong>{{pilot.pilot_name}}<strong></h4>
                    </div>
                    <div class="col col-xs-12 col-sm-5 col-md-5 col-lg-6 text-left" v-if="pilot.hints">
                        <h4><span class="glyphicon glyphicon-random"></span>  Hints: </h4>
                        <ul class="list-unstyled">
                            <template v-for="hint in pilot.hints">
                                <li><h6><strong>{{hint}}</strong></h6></li>
                            </template>  
                        </ul>
                    </div>
                </div>
              </li>`
});

Vue.component('pilots-result', {
  props: ['solution'],
  template: ` <div v-id="solution" id="result-config">
                <ul class="list-group">
                    <template v-for="(pilot,index) in solution">
                        <pilot-result :pilot="pilot" :index="index"></pilot-result>
                    </template>  
                </ul>
              </div>`
});

const pilotInput = new Vue({
    el: '#app',
    data: {
        pilots: [],
        prefs: {},
        result: {},
        error: {},
        debug: {},
        site: {
            loading: false
        }
    },

    mounted() {
        this.reset();
    },

    /*beforeUpdate() {
        console.log('BEFORE UPDATE');        
    },*/

    methods: {
        reset() {
            dataInit = init();
            this.pilots = dataInit.pilots;
            this.prefs = dataInit.prefs;
            this.result = dataInit.result;
            this.error = dataInit.error;
            this.debug = dataInit.debug;
            this.site.loading = false;
        },
        showError(errString) {
            this.error.data = errString;
            this.result.hidden = true;
            this.debug.hidden  = true;
            this.error.hidden  = false;
        },        
        showResult(resultObj) {
            this.result.data = resultObj;
            this.result.hidden = false;
            this.debug.hidden  = true;
            this.error.hidden  = true;
        },  
        showDebug(debugObj) {
            this.debug.data = debugObj;
            this.result.hidden = true;
            this.debug.hidden  = false;
            this.error.hidden  = true;
        },  
        addPilotInput() {
            if(this.pilots.length < 8) {
                const n = this.pilots.length+1;
                this.pilots.push(mkPilot('Name-' +n));
            }
        },
        computeSolutions() {
            const pilotsInput = this.pilots.map(pilotToPilotReq);
            
            // validate pilots-iput
            if(pilotsInput.some((e) => e === null)) {
                this.showError("One or more pilots don't have sufficient freq-config to compute a solution");
                return;
            }

            // validate options
            if(Number.isNaN(this.prefs.min_mhz_dist) || this.prefs.min_mhz_dist < 40 || this.prefs.min_mhz_dist > 150) {
                this.showError("Minimal MHz distance is out of limits (should be between 40 and 150)");
                return;
            }

            // build up request post data
            const postRequest = {
                pilots: pilotsInput,
                options: {
                    optimize_by: this.prefs.optimize_by,
                    min_mhz_spacing: this.prefs.min_mhz_dist,
                    num_results: this.debug.is_debug_mode ? 'MAX_TOP_10' : this.prefs.num_results
                }
            };

            console.log(JSON.stringify(postRequest));

            // TODO: tunnel HTTP 400 info back correctly
            // TODO: check for equal frequencies...

            // post data to API and handle response 
            this.site.loading = true;
            this.error.hidden = true;
            axios.post('/api/calc/optimizepilotfreqs', postRequest)
                 .then(succ => {
                     // in any case. disable loading screen
                     this.site.loading = false;
                     // no result case                     
                     if(succ.data.results.length === 0) {
                         if(succ.data.hints !== 0) {
                             return this.showError("no solution found. " +succ.data.hints.reduce((a,b) => a +'; ' +b)); 
                         } else {
                             return this.showError("...oops something went wrong. please try again!"); 
                         }
                     }
                     // result debug case
                     if(!this.debug.is_debug_mode) {
                        return this.showResult(succ.data);
                     } 
                     // result normal case
                     return this.showDebug(succ.data); 
                 })
                 .catch(err => {
                     console.log("err:", err);
                     // in any case. disable loading screen
                     this.site.loading = false;
                     if(!err.response) {
                         console.log("network error");    
                         return this.showError("network error. can't call API");
                     } 
                     console.log("error:", err.response.data.error);    // is still a JSON at this point
                     return this.showError(err.response.data.error);
                 });
        }
    }
});

