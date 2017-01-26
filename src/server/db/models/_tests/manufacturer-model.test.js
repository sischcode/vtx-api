const { ManufacturerModel } = require('./../manufacturer-model');
const { 
    MANUFACTURERS,
    LINK_TYPE
} = require('./../shared-model-constants');

const eachine = new ManufacturerModel({
    name: MANUFACTURERS.EACHINE,
    links: [{
        url: 'http://www.eachine.com'
    }]
});

eachine.save().then((data) => {
    console.log('success', data);
}, (err) => {
    console.log('fail', err);
});