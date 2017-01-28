const {validateBandTypeParam} = require('./middleware/validateBandTypeParam');
const {
    BAND_TYPE, 
    ENUM_BAND_TYPES, 
    FREQUENCY_BANDS_5P8GHZ, 
    FREQUENCY_BANDS_1P3GHZ,
    FREQUENCY_BANDS_2P4GHZ,
    ENUM_FREQUENCY_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_5P8GHZ,
    ENUM_ALL_COMMON_BANDS_1P3GHZ,
    ENUM_ALL_COMMON_BANDS_2P4GHZ
} = require('./../db/models/shared-model-constants');


// ---------------------------------------------------------------------
// -------------------- Basic logic functions --------------------------
// ---------------------------------------------------------------------
const getBandsOfBandType = (band_type) => {
    if(band_type === BAND_TYPE._5P8GHZ) {
        const bands = ENUM_ALL_COMMON_BANDS_5P8GHZ.reduce((bands, current_band_id) => {
            const current_band = {
                band: FREQUENCY_BANDS_5P8GHZ[current_band_id].band,
                freq: FREQUENCY_BANDS_5P8GHZ[current_band_id].freq
            };
            bands.push(current_band);
            return bands;
        }, []);

        return bands;

    } else if(band_type === BAND_TYPE._1P3GHZ) {
        const bands = ENUM_ALL_COMMON_BANDS_1P3GHZ.reduce((bands, current_band_id) => {
            const current_band = {
                band: FREQUENCY_BANDS_1P3GHZ[current_band_id].band,
                freq: FREQUENCY_BANDS_1P3GHZ[current_band_id].freq
            };
            bands.push(current_band);
            return bands;
        }, []);

        return bands;
    } else if(band_type === BAND_TYPE._2P4GHZ) {
        const bands = ENUM_ALL_COMMON_BANDS_2P4GHZ.reduce((bands, current_band_id) => {
            const current_band = {
                band: FREQUENCY_BANDS_2P4GHZ[current_band_id].band,
                freq: FREQUENCY_BANDS_2P4GHZ[current_band_id].freq
            };
            bands.push(current_band);
            return bands;
        }, []);

        return bands;
    }
};

const getBandOfBandType = (bands, band) => {
    const res = bands.find((currBand) => {
        return currBand.band === band;
    });
    if(!res) {
        return {
            error: 'no such band \'' +band +'\''
        }
    }
    return res;
};

// ---------------------------------------------------------------------
// -------------------- "Webifying" functions --------------------------
// ---------------------------------------------------------------------
const handleBandsOfBandType = (req,res,band_type) => {
    const bands = getBandsOfBandType(band_type);
    if(bands.length === 0) {
        return res.status(200).send({error: 'not implemented yet'});
    }
    return bands;
};

const handleBandOfBandType = (req,res,bands, band_id) => {
    band_id = band_id.toUpperCase();
    const band = getBandOfBandType(bands, band_id);
    
    if(band_id.error) {
        return res.status(400).send(band_id); 
    }
    return band;
};

// ---------------------------------------------------------------------
// ------------------------ Express routes -----------------------------
// ---------------------------------------------------------------------
const addBandsExpressRoutes = (app) => {

    app.get('/bands', (req,res) => {
        return res.status(200).send({
            band_types: ENUM_BAND_TYPES
        });
    });

    app.get('/bands/:band_type', validateBandTypeParam, (req,res) => {
        // if it's a valid band_type is already checked in the middleware
        const bands = handleBandsOfBandType(req, res, req.params.band_type);
        return res.status(200).send({bands});
    });

    app.get('/bands/:band_type/:band_id', validateBandTypeParam, (req,res) => {
        const bands = handleBandsOfBandType(req, res, req.params.band_type);
        const band  = handleBandOfBandType(req, res, bands, req.params.band_id);
        
        return res.status(200).send(band);        
    });

    app.get('/bands/:band_type/:band_id/:num', validateBandTypeParam, (req,res) => {
        const bands = handleBandsOfBandType(req, res, req.params.band_type);
        const band  = handleBandOfBandType(req, res, bands, req.params.band_id);
        
        if(req.params.num < 1 || req.params.num > band.freq.length) {
            return res.status(400).send({error: 'bad band num. must be between 1 and ' +band.freq.length}); 
        }
        
        return res.status(200).send({
            freq: band.freq[req.params.num-1]
        });        
    });
};

module.exports = {addBandsExpressRoutes};