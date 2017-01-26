const { VtxModel } = require('./../vtx-model');
const { 
    MANUFACTURERS,    
    ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ
} = require('./../shared-model-constants');


const vtx_ET25R = new VtxModel({
    name: 'ET25R', 
    power_mw: [25],
    manufacturer: {
        name: MANUFACTURERS.EACHINE
    },
    bands: ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ
});

vtx_ET25R.save().then((data) => {
    console.log('success', data);
}, (err) => {
    console.log('fail', err);
});