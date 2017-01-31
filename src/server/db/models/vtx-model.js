const _ = require('lodash');

const { mongoose } = require('./../mongoose');
const { linkSchema } = require('./shared-model-schemas');
const { 
    BAND_TYPE, 
    ENUM_BAND_TYPES, 
    FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ,
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
    aliases: {
        type: [{
            type: String,
            minlength: 3,
            maxlength: 35    
        }],
        required: false        
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

// Override toJSON to only contain a subset of the original document
vtxSchema.methods.toJSON = function() {
    const vtx = this.toObject();
    return _.pick(vtx, ['_id', 'name', 'manufacturer', 'power_mw', 'band_type', 'bands', 'links', 'desc']);
};

vtxSchema.pre('save', function uniquifyAliasesArray(next) {
    let vtx = this;    
    if(vtx.isNew || vtx.isModified('aliases')) {       // also check out: doc.$isDefault(path) and isNew
        vtx.aliases = Array.from(new Set(vtx.aliases));
    } 
    next();
});

vtxSchema.pre('save', function uniquifyLinksArray(next) {
    let vtx = this;    
    if(vtx.isNew || vtx.isModified('links')) {       // also check out: doc.$isDefault(path) and isNew
        vtx.links = Array.from(new Set(vtx.links));
    } 
    next();
});

// TODO: add a post hook, to update the associated manufacturer document with a link to the vtx

const VtxModel = mongoose.model('vtx', vtxSchema);

module.exports = {
    VtxModel
}