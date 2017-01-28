const {ENUM_BAND_TYPES} = require('./../../db/models/shared-model-constants');

const validateBandTypeParam = (req, res, next) => {
    // if no band_type is set, it fill fall back to another route anyway
    req.params.band_type = req.params.band_type.toUpperCase();

    if(ENUM_BAND_TYPES.indexOf(req.params.band_type) === -1) {
        return res.status(400).send({
            error: 'unknown \'band_type\' parameter: ' +req.params.band_type
        });
    }
    next();
};

module.exports = {validateBandTypeParam};

