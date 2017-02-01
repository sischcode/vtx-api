const _ = require('lodash');

const {mongoose} = require('./../mongoose');
const {VtxModel} = require('./vtx-model');
const {ManufacturerModel} = require('./manufacturer-model');


function enrichManufacturerDocWithVtxIfNecessary(doc, next) {    
    // next is ONLY(!) useful to trigger the next middleare in sequence.
    // ====================================================================
    // it does NOT(!) guarantee the post-hook the be executed / in sequence, 
    // before the .then() call on save e.g. save().then()
    // in other words, if we save something in a post middleware, it may
    // sequentially be executed after the save().then()
    // ====================================================================
    // see: https://github.com/Automattic/mongoose/issues/3228

    const vtx = this;
    ManufacturerModel.findOne({name: vtx.manufacturer.name})
        .then((manufacturer) => {
            if(manufacturer) {   
                const vtxRefFound = manufacturer.vtxs.find((vtxRef) => {
                    return vtxRef.name === vtx.name;
                });
                if(!vtxRefFound) {
                    return Promise.resolve(manufacturer);    
                }
                return Promise.reject(new Error("vtxref-already-exists"));
            }
            return Promise.reject(new Error("no-manufacturer-found"));
            
        }).then((manufacturerToUpdate) => {
            manufacturerToUpdate.vtxs.push({
                name: vtx.name,
                _ref: vtx._id
            });            
            return manufacturerToUpdate.update({
                vtxs: manufacturerToUpdate.vtxs
            });
        }).then((updMan) => {
            //console.log(`successfully updated manufacturer with ref to vtx "${vtx.name}"`);   
            next();
        }).catch((err) => {
            if(err.message) {
                if(err.message === "vtxref-already-exists") {
                    //console.log('nothing to update: ', err.message);
                } else if(err.message === "no-manufacturer-found") {
                    //console.log('nothing to update: ', err.message);
                } else {
                    console.log('error during update!', err);
                }
            } else {
                console.log('error during update!', err);
            }
            next();
        });
}


module.exports = {
    enrichManufacturerDocWithVtxIfNecessary
}