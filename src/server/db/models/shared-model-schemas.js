require('mongoose-type-url');

const { mongoose } = require('./../mongoose');
const { LINK_TYPE, ENUM_LINK_TYPES } = require('./shared-model-constants');

const linkSchema = new mongoose.Schema({    
    link_type: {
        type: String,
        enum: ENUM_LINK_TYPES,
        default: LINK_TYPE.WEBSITE,
        required: true
    },
    url: {
        type: mongoose.SchemaTypes.Url,
        required: true
    }        
});

module.exports = {
    linkSchema
}