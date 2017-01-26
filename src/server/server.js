const express = require('express');
const bodyParser = require('body-parser');

const {config} = require('./config');
const {addVtxExpressRoutes} = require('./api/vtx-express-routes');

var app = express();
app.use(bodyParser.json());

app = addVtxExpressRoutes(app);

app.listen(config.server.server_port, () => {
    console.log('Started server on port ' +config.server.server_port)
});

module.exports = {
    app: app
};