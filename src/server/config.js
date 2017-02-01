const PROPS = require('./config.json');

const ENV = (process.env.NODE_ENV || PROPS.development.env_name).trim();    // fallback to dev environment
console.log('process.env.NODE_ENV:', ENV);

let config;
switch(ENV) {
    case PROPS.test.env_name: 
        config = PROPS.test;
        break;    
    case PROPS.development.env_name:
        config = PROPS.development;
        break;
    case PROPS.production.env_name:
        config = PROPS.production;
        // MONGODB_URL env var should be set already!
        config.db.mongodb_url = process.env.MONGODB_URL;
        // PORT env var should be set already!
        config.server.server_port = process.env.PORT;
        break;    
    default:
        console.error("no configuration!");
        break;    
}

module.exports = { config };