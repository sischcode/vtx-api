const express = require('express');
const bodyParser = require('body-parser');

const {config} = require('./config');

var app = express();
app.use(bodyParser.json());

app.listen(config.server.server_port, () => {
    console.log('Started server on port ' +config.server.server_port)
});

module.exports = {
    app: app
};