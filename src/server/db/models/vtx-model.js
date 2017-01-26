const { mongoose } = require('./../mongoose');
const { linkSchema } = require('./shared-model-schemas');
const { 
    BAND_TYPE, 
    ENUM_BAND_TYPES, 
    FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ,
    ENUM_FREQUENCY_BANDS_5P8GHZ,
    MANUFACTURERS, 
    ENUM_MANUFACTURERS, 
    LINK_TYPE, 
    ENUM_LINK_TYPES 
} = require('./shared-model-constants');

// =================================================================================== //

const ratingSchema = new mongoose.Schema({});

const vtxSchema = new mongoose.Schema({
    manufacturer: {
        type: {
            name: {
                type: String,
                enum: ENUM_MANUFACTURERS,
                required: true
            },
            _ref: {
                type: mongoose.Schema.Types.ObjectId,
                required: false
            }
        },
        required: true
    },
    name: {
        type: String,
        minlength: 3,
        maxlength: 35,
        unique: true
    },
    desc: {
        type: String,
        minlength: 20,
        maxlength: 512,
        required: false
    },
    band_type: {
        type: String,
        enum: ENUM_BAND_TYPES,
        default: BAND_TYPE._5P8GHZ,
        required: true
    },
    bands: {
        type: [String],
        enum: ENUM_FREQUENCY_BANDS_5P8GHZ,
        required: true
    },
    power_mw: {
        type: [Number],
        required: true
    }, 
    links: {
        type: [linkSchema],
        required: false
    },
    similar_to: {
        type: [{
            name: String,
            _ref: mongoose.Schema.Types.ObjectId
        }],
        required: false
    },
    ratings: {
        type: [ratingSchema],
        required: false
    }
});

const VtxModel = mongoose.model('vtx', vtxSchema);

module.exports = {
    VtxModel
}