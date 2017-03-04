const _ = require('lodash');

const {validateCalcReqObject} = require('./middleware/validateCalcReqObject');
const FpvPilot = require('./../logic/classes/FpvPilot');
const {computeAndSortSolutions, VALID_OPTIMIZEBY_VALUES} = require('./../logic/generate-solutions');

const addCalcExpressRoutes = (app) => {
    const DEFAULT_OPTIONS_OPTIMIZEBY = VALID_OPTIMIZEBY_VALUES[0];  // pilot_preference
    const DEFAULT_OPTIONS_MINMHZDISTANCE = 60;

    app.post('/calc/optimizepilotfreqs', validateCalcReqObject, (req,res) => {
        const {pilots, options} = _.pick(req.body, ['pilots', 'options']); 
        
        // construct pilot object array
        const fpvPilotArr = pilots.map(FpvPilot.fromSimpleObject);

        // override defaults where applicable
        let optimizeBy = DEFAULT_OPTIONS_OPTIMIZEBY;
        let minMhzSpacing = DEFAULT_OPTIONS_MINMHZDISTANCE;
        if(options) {
            if(options.min_mhz_spacing) {
                minMhzSpacing = options.min_mhz_spacing;
            }
            if(options.optimize_by) {
                optimizeBy = options.optimize_by;
            }
        }

        const result 
            = computeAndSortSolutions(  fpvPilotArr, 
                                        minMhzSpacing, 
                                        optimizeBy);

        // TODO: re-organize object to return!

        if(result.solutions.length < 1) {
            return res.status(200).send({ solution: [] });
        } else {
            res.status(200).send({ solution: result.solutions[0] });    // order by pilot_name input order
        }
    });

    return app;
};

module.exports = {
    addCalcExpressRoutes
}