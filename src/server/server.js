const express = require('express');
const bodyParser = require('body-parser');

const {config} = require('./config');
const {addBandsExpressRoutes} = require('./api/bands-express-routes');
const {addVtxExpressRoutes} = require('./api/vtx-express-routes');
const {addManufacturerExpressRoutes} = require('./api/manufacturer-express-routes');

var app = express();
app.use(bodyParser.json());

addBandsExpressRoutes(app);
addVtxExpressRoutes(app);
addManufacturerExpressRoutes(app);

app.listen(config.server.server_port, () => {
    console.log('Started server on port ' +config.server.server_port)
});

module.exports = {
    app: app
};