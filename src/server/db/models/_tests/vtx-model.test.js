const _ = require('lodash');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./../../mongoose');
const {
    VtxModel,
    ENUM_MANUFACTURERS,
    ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ
} = require('./../vtx-model');

const vtx_ET25R = new VtxModel({
    name: 'ET25R', 
    power_mw: [25],
    _manufacturer: 'Eachine',
    bands: ENUM_ALL_COMMON_FIVE_BANDS_5P8GHZ
});

vtx_ET25R.save().then((data) => {
    console.log('success', data);
}, (err) => {
    console.log('fail', err);
});