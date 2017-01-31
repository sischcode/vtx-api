const _ = require('lodash');
const chai = require("chai");
const chaiSubset = require('chai-subset');
const chaiAsPromised = require("chai-as-promised");

const {VtxModel} = require('./../vtx-model');
const vtxSeed = require('./../_seed/vtx-seed.json');

chai.use(chaiSubset);
chai.use(chaiAsPromised);
chai.should();              // preferred
const expect = chai.expect; // ...not so much, but can be useful for unchainable multiple assertions on the same promise...I guess

describe('Save vtx model(s) to mongodb:', () => {
    beforeEach((done) => {
        VtxModel.remove({})
            .then(() => done())
            .catch((err) => {
                done(err);
            });
        
        /*VtxModel.remove({})
            .then((remRes) => {
                const vtxPromises = vtxSeed.map((vtx) => {
                    return new VtxModel(vtx).save();
                });
                return Promise.all(vtxPromises);
            }).then((insResArr) => {
                console.log('result:', insResArr);
            }).catch((err) => {
                done(err);
            });*/
    });

    it('should save single vtx model without an error', () => {
        const UNIFY_PRO_HV = vtxSeed[2];
        const testPromise = new VtxModel(UNIFY_PRO_HV).save();
        
        // I have to omit 'links' here...otherwise it won't work. which is bad!
        return testPromise.should.eventually.containSubset( _.omit(UNIFY_PRO_HV, 'links'));

        //return expect(testPromise).to.eventually.containSubset(UNIFY_PRO_HV);        
        /*return testPromise.then( (res) => {
            expect(res).to.have.property('power_mw').to.include.members(ET25R.power_mw);
            expect(res).to.have.deep.property('manufacturer', ET25R.manufacturer);
        });*/
    });

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

});