const {ObjectID} = require('mongodb');

const validateIdParam = (req, res, next) => {
    if(req.params.id) {
        if(!ObjectID.isValid(req.params.id)) {
            return res.status(400).send({error: 'invalid id format'});
        }
    }
    next();
};

module.exports = {validateIdParam};