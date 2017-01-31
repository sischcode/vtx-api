const _ = require('lodash');
const chai = require("chai");
const chaiSubset = require('chai-subset');
const chaiAsPromised = require("chai-as-promised");

const { ManufacturerModel } = require('./../manufacturer-model');
const manufacturerSeed = require('./../_seed/manufacturer-seed.json');

chai.use(chaiSubset);
chai.use(chaiAsPromised);
chai.should();              // preferred
const expect = chai.expect; // ...not so much, but can be useful for unchainable multiple assertions on the same promise...I guess

describe('Save manufacturer model(s) to mongodb:', () => {
    beforeEach((done) => {
        ManufacturerModel.remove({})
            .then(() => done())
            .catch((err) => {
                done(err);
            });
    });

    it('should save single Manufacturer model without an error', () => {
        const EACHINE = manufacturerSeed[0];
        const testPromise = new ManufacturerModel(EACHINE).save();        

        // I have to omit 'links' here...otherwise it won't work. which is bad!
        return testPromise.should.eventually.containSubset(_.omit(EACHINE,'links'));
    });

    it('should prevent a duplicate entry and fail with an error of code 11000 (for duplicate entry)', () => {
        const testPromise1 = new ManufacturerModel(manufacturerSeed[0]).save();
        const testPromise2 = new ManufacturerModel(manufacturerSeed[0]).save();

        // I have to omit 'links' here...otherwise it won't work. which is bad!
        return Promise.all([
            testPromise1.should
                .eventually.be.fulfilled.and
                .eventually.containSubset(_.omit(manufacturerSeed[0], 'links')),
            testPromise2.should
                .eventually.be.rejected.and
                .eventually.have.property('code', 11000)
        ]);
    });

});