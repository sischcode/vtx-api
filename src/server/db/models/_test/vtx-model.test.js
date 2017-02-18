const _ = require('lodash');
const chai = require("chai");
const chaiSubset = require('chai-subset');
const chaiAsPromised = require("chai-as-promised");
const {ObjectID} = require('mongodb');

const {VtxModel} = require('./../vtx-model');
const {ManufacturerModel} = require('./../manufacturer-model');
const vtxSeed = require('./../_seed/vtx-seed.json');
const manSeed = require('./../_seed/manufacturer-seed.json');

chai.use(chaiSubset);
chai.use(chaiAsPromised);
chai.should();              // preferred
const expect = chai.expect; // ...not so much, but can be useful for unchainable multiple assertions on the same promise...I guess


// for something like:
//return testPromise.then( (res) => {
//    expect(res).to.have.property('power_mw').to.include.members(ET25R.power_mw);
//    expect(res).to.have.deep.property('manufacturer', ET25R.manufacturer);
//});

describe('Save vtx model(s) to mongodb:', () => {
    beforeEach((done) => {
        Promise.all([
            VtxModel.remove({}),
            ManufacturerModel.remove({}),
            (new ManufacturerModel(manSeed[0])).save()
        ]).then(() => {
            //console.log('beforeEach execution finished');
            done();
        }).catch((err) => {
            console.log('error in beforeEach', err);
            done(err);
        });
    });
    
    it('should save single vtx model without an error', () => {
        const ET25R = vtxSeed[0];
        const testPromise = new VtxModel(ET25R).save();        
        
        return testPromise.should.eventually.containSubset( _.omit(ET25R, 'links'));
    });
        
    it('should save single vtx model and DROP DUPLICATE links!', () => {
        let UNIFY_PRO_HV = vtxSeed[2];
        UNIFY_PRO_HV.links = [UNIFY_PRO_HV.links[0], UNIFY_PRO_HV.links[0], UNIFY_PRO_HV.links[1]];    // duplicate!
        const testPromise = new VtxModel(UNIFY_PRO_HV).save();       
        
        return testPromise.should.eventually.containSubset( _.omit(UNIFY_PRO_HV, 'links')); // this limitation kinda defeats this test...
    });

    it('should save single vtx model and DROP DUPLICATE aliases!', () => {
        let UNIFY_PRO_HV = vtxSeed[2];
        UNIFY_PRO_HV.aliases = [UNIFY_PRO_HV.aliases[0], UNIFY_PRO_HV.aliases[0]];    // duplicate!
        const testPromise = new VtxModel(UNIFY_PRO_HV).save();       
        
        return testPromise.should.eventually.containSubset( _.omit(UNIFY_PRO_HV, 'links'));
    });

    /*// this won't work because of: https://github.com/Automattic/mongoose/issues/3228
    it('should save the vtx (ET25R) and add it as a reference to the manufacturer (Eachine) document', () => {
        let ET25R = vtxSeed[0];
        ET25R._id = new ObjectID();
        const vtxPromise = new VtxModel(ET25R).save();
        const manPromise = ManufacturerModel.findOne({name: ET25R.manufacturer.name});

        return Promise.all([
            vtxPromise.should.eventually.containSubset( _.omit(ET25R, 'links')), 
            manPromise.should.eventually.have.property('vtxs').to.eventually.deep.include.members([{
                name: ET25R.name,
                _ref: ET25R._id
            }])
        ]);
    });*/

    it('should prevent a duplicate entry and fail with an error of code 11000 (for duplicate entry)', () => {
        const testPromise1 = new VtxModel(vtxSeed[0]).save();
        const testPromise2 = new VtxModel(vtxSeed[0]).save();

        return Promise.all([
            testPromise1.should
                .eventually.be.fulfilled.and
                .eventually.containSubset(vtxSeed[0]),
            testPromise2.should
                .eventually.be.rejected.and
                .eventually.have.property('code', 11000)
        ]);
    });

    it('should save all seed data without a problem', () => {
        const promises = vtxSeed.map( (vtx) => {
            return new VtxModel(vtx).save();
        });
        const promiseAllArr = promises.map((prom) => {
            return prom.should.eventually.be.fulfilled;
        });

        return Promise.all(promiseAllArr);
    });

});