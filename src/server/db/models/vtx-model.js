const _ = require('lodash');

const {mongoose} = require('./../mongoose');
const {enrichManufacturerDocWithVtxIfNecessary} = require('./cross-model-hook-functions');
const {linkSchema} = require('./shared-model-schemas');
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
    special_features: {
        type: {
            camvtxcombo: {
                type: Boolean,
                required: false,
                default: false
            },
            pitmode: {
                type: Boolean,
                required: false,
                default: false
            },
            switchable_power: {
                type: Boolean,
                required: false,
                default: false
            }
        },
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
    return _.pick(vtx, [
        '_id', 
        'name', 
        'manufacturer', 
        'power_mw', 
        'band_type', 
        'bands', 
        'links', 
        'special_features',
        'desc'
    ]);
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
        vtx.links = _.uniqBy(vtx.links, 'url');
    } 
    next();
});

vtxSchema.pre('save', function joinSwitchablePowerFeature(next) {
    let vtx = this;    
    if(vtx.isNew || vtx.isModified('power_mw')) {       // also check out: doc.$isDefault(path) and isNew
        if(vtx.power_mw && vtx.power_mw.length > 0) {
            if(!vtx.special_features) { 
                vtx.special_features = {}; 
            }
            if(vtx.power_mw.length > 1) {
                vtx.special_features.switchable_power = true;
            } else {    // === 1
                vtx.special_features.switchable_power = false;
            } 
        }
    } 
    next();
});

// See: https://github.com/Automattic/mongoose/issues/3228
// (TL;DR: this is NOT going to work as planned. Can't be 
//         (savely) used for updating references)
vtxSchema.post('save', enrichManufacturerDocWithVtxIfNecessary);

const VtxModel = mongoose.model('vtx', vtxSchema);

module.exports = {
    VtxModel
}