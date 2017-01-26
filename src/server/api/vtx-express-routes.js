const _ = require('lodash');
const {ObjectID} = require('mongodb');

const {validateIdParam} = require('./middleware/validateIdParam');
const {VtxModel} = require('./../db/models/vtx-model');


const addVtxExpressRoutes = (app) => {
    app.get('/vtxs', (req,res) => {
        VtxModel.find({}).then((result) => {
            return res.status(200).send({
                vtxs: result,
                count: result.length
            });
        }).catch((err) => {
            res.status(500).send();
        });
    });

    app.get('/vtxs/:id', validateIdParam, (req, res) => {
        VtxModel.findById(req.params.id).then((result) => {
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
    addVtxExpressRoutes
}