const _ = require('lodash');

const FpvPilot = require('./../logic/classes/FpvPilot');
const {computeAndSortSolutions} = require('./../logic/generate-solutions');

const addCalcExpressRoutes = (app) => {

    app.post('/calc/optimizepilotfreqs', (req,res) => {
        const {pilots, options} = _.pick(req.body, ['pilots', 'options']); 
        
        if(!pilots) {
            return res.status(400).send("no \"pilots\" array given in request");
        }
        if(!_.isArray(pilots)) {
            return res.status(400).send("\"pilots\" is not an array");
        }
        const invalidPilot = pilots.find((pilot) => !_.isObject(pilot));
        if(invalidPilot) {
            return res.status(400).send("\"" +invalidPilot +"\" is not a valid pilot-object");
        }
        // TODO ...rest of checks

        const fpvPilotArr = pilots.map(FpvPilot.fromSimpleObject);

        const result = computeAndSortSolutions(fpvPilotArr, options.min_mhz_spacing, options.optimizeBy);

        console.log(fpvPilotArr);
        console.log("-----");
        console.log(result.solutions[0]);

        res.status(200).send({ best_fit: result.solutions[0] });    // order by pilot_name input order
    });

    return app;
};

module.exports = {
    addCalcExpressRoutes
}