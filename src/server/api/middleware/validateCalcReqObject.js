var validator = require("is-my-json-valid")

const {VALID_OPTIMIZEBY_VALUES} = require('./../../logic/generate-solutions');
const {ENUM_ALL_COMMON_BANDS_5P8GHZ} = require('./../../db/models/shared-model-constants');

const validateInputObj = validator({
    required: true,
    type: "object",
    properties: {
        pilots: {
            required: true,
            type: "array",
            minItems: 2,
            maxItems: 8,
            items: { 
                type: "object",
                anyOf: [
                    {required: ["bands"]},
                    {required: ["preferred_bands"]},
                    {required: ["preferred_frequencies"]},
                ],
                properties: {
                    pilot_name: {
                        required: true,
                        type: "string",
                        minLength: 2,
                        maxLength: 50
                    },
                    craft_name: {
                        required: false,
                        type: "string",
                        minLength: 2,
                        maxLength: 50
                    },
                    vtx_name: {
                        required: false,
                        type: "string",
                        minLength: 2,
                        maxLength: 50
                    },
                    bands: {
                        required: false,
                        type: "array",
                        minItems: 1,
                        items: { 
                            type: "string",
                            enum: ENUM_ALL_COMMON_BANDS_5P8GHZ
                        },
                        uniqueItems: true
                    },
                    preferred_bands: {
                        required: false,
                        type: "array",
                        minItems: 1,
                        items: { 
                            type: "string" ,
                            enum: ENUM_ALL_COMMON_BANDS_5P8GHZ
                        },
                        uniqueItems: true
                    },
                    preferred_frequencies: {
                        required: false,
                        type: "array",
                        minItems: 1,
                        items: { 
                            type: "string",
                            minLength: 2,
                            maxLength: 2,
                            pattern: "^([ABEFRabefr][1-8]){1}"
                        },
                        uniqueItems: true
                    }
                }
            },
            uniqueItems: true
        },
        options: {
            required: false,
            type: "object",
            properties: {
                optimizeBy: {
                    required: false,
                    type: "string",
                    enum: VALID_OPTIMIZEBY_VALUES
                },
                min_mhz_spacing: {
                    required: false,
                    type: "integer",
                    minimum: 40,
                    maximum: 150
                }
            }
        }
    },
    additionalProperties: true  // ignore noise (= additional properties will be ignored)
},{
  verbose: true
});

const validateCalcReqObject = (req, res, next) => {
    if(!req.body) {
        return res.status(400).send({error: "no input given..."});
    } else {
        if(!validateInputObj(req.body)) {
            return res.status(400).send({error: validateInputObj.errors});
        }
    }
    next();
};

module.exports = {validateCalcReqObject};
