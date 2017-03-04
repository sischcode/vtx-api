const express = require('express');
const bodyParser = require('body-parser');

const {config} = require('./config');
const {addBandsExpressRoutes} = require('./api/bands-express-routes');
const {addVtxExpressRoutes} = require('./api/vtx-express-routes');
const {addManufacturerExpressRoutes} = require('./api/manufacturer-express-routes');
const {addCalcExpressRoutes} = require('./api/calc-express-routes');

var app = express();
app.use(bodyParser.json());

addBandsExpressRoutes(app);
addVtxExpressRoutes(app);
addManufacturerExpressRoutes(app);
addCalcExpressRoutes(app);

/**
 * For routes that don't exist
 */
app.use(function(req, res){
    res.status(404).send({
        error: "Oops, that doesn\'t exist, ... I guess."
    });
});

/**
 * catch-all error handler (i.e. catches invalid JSON input as well.)
 */
app.use(function errorHandler(err, req, res, next) {
    res.status(400).send({
        error: "something went wrong. (please check your input!)"
    });
});

app.listen(config.server.server_port, () => {
    console.log('Started server on port ' +config.server.server_port)
});

module.exports = {
    app: app
};