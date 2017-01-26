const { mongoose, __shared__modelOptions } = require('./../mongoose');


const BAND_TYPE = {
    _5P8GHZ: "5P8GHZ",
    _1P3GHZ: "1P3GHZ",
    _2P4GHZ: "2P4GHZ"
};
const ENUM_BAND_TYPES = Object.keys(BAND_TYPE).map(key => BAND_TYPE[key]);


const ALLOWED_FREQUENCIES_5P8GHZ = {
    DE: {
        min: 5725,
        max: 5880
    }
};

const FREQUENCY_BANDS_5P8GHZ = {
    A: {
        band: 'Band A', 
        freq: [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725]
    },
    B: {
        band: 'Band B', 
        freq: [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866]
    },
    E: {
        band: 'Band E', 
        freq: [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945]
    },
    F: {
        band: 'Band F', 
        freq: [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880]
    },
    R: {
        band: 'Race Band',
        freq: [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917]
    }
};

const ENUM_FREQUENCY_BANDS_5P8GHZ = Object.keys(FREQUENCY_BANDS_5P8GHZ).map(key => FREQUENCY_BANDS_5P8GHZ[key]);
const ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ = ['A', 'B', 'E', 'F', 'R'];

const ENUM_LINK_TYPES = ['MANUAL'];

const ENUM_MANUFACTURERS = ['Eachine', 'TBS', 'ImmersionRC', 'Boscam'];

const ratingSchema = new mongoose.Schema({});

const vtxSchema = new mongoose.Schema({
    _author: {
        type: String,
        default: 'joerg.s',
        required: true
    },
    _manufacturer: {
        type: String,
        enum: ENUM_MANUFACTURERS,
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
        type: [{
            type: String,
            enum: ENUM_LINK_TYPES
        }],
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
    BAND_TYPE,
    ENUM_BAND_TYPES,
    ALLOWED_FREQUENCIES_5P8GHZ,
    FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ,
    ENUM_FREQUENCY_BANDS_5P8GHZ,
    ENUM_MANUFACTURERS,
    VtxModel
}