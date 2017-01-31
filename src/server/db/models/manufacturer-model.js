const _ = require('lodash');

const { mongoose } = require('./../mongoose');
const { linkSchema } = require('./shared-model-schemas');
const { MANUFACTURERS, ENUM_MANUFACTURERS, LINK_TYPE, ENUM_LINK_TYPES } = require('./shared-model-constants');

const manufacturerSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 35,
        required: true,
        unique: true
    },
    vtxs: {
        type: [{
            _id: false,
            name: {
                type: String,
                required: true
            },
            _ref: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            }
        }],
        required: false
    },
    links: {
        type: [linkSchema],
        required: false
    }
});

// Override toJSON to only contain a subset of the original document
manufacturerSchema.methods.toJSON = function() {
    const manufacturer = this.toObject();
    return _.pick(manufacturer, ['_id', 'name', 'vtxs', 'links']);
};

const ManufacturerModel = mongoose.model('manufacturer', manufacturerSchema);

module.exports = {
    ManufacturerModel
};