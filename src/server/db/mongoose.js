const mongoose = require('mongoose');

const {config} = require('./../config');

// telling mongoose which promise impplementation to use
mongoose.Promise = global.Promise;                      
mongoose.connect(config.db.mongodb_url);

module.exports = {
    mongoose
};