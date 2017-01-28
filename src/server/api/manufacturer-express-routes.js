const _ = require('lodash');
const {ObjectID} = require('mongodb');

const {validateIdParam} = require('./middleware/validateIdParam');
const {ManufacturerModel} = require('./../db/models/manufacturer-model');


const addManufacturerExpressRoutes = (app) => {
    app.get('/manufacturers', (req,res) => {
        ManufacturerModel.find({}).then((result) => {
            return res.status(200).send({
                vtxs: result,
                count: result.length
            });
        }).catch((err) => {
            res.status(500).send();
        });
    });

    app.get('/manufacturers/:id', validateIdParam, (req, res) => {
        ManufacturerModel.findById(req.params.id).then((result) => {
            if(!result) {
                res.status(404).send();
            }
            return res.status(200).send({
                vtx: result
            });
        }).catch((err) => {
            res.status(500).send();
        });
    });

    return app;
};

module.exports = {
    addManufacturerExpressRoutes
}