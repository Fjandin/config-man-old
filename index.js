'use strict';

// modules
const get = require('lodash/get');
const path = require('path');
const fs = require('fs');
const parseConfigs = require('./lib/parse-configs.js');
const validateConfig = require('./lib/validate-config.js');


const getConfig = {
    package: require('./lib/config-package.js'),
    env: require('./lib/config-env.js'),
    arg: require('./lib/config-arg.js'),
    default: require('./lib/config-default.js'),
    json: require('./lib/config-json.js'),
    local: require('./lib/config-local.js'),
    dynamodb: require('./lib/config-dynamodb.js')
};

// Object that holds the config
const configData = {};

const init = (o) => {
    // We are not supposed to call init more than once
    if (configData._init) {
        throw new Error('CONFIG-MAN: ConfigMan already initialized once.');
    // config-man.json file is required
    } else if (!fs.existsSync(path.join(o.cwd || __dirname, 'config-man.json'))) {
        throw new Error('CONFIG-MAN: You need to add a config-man.json file to your project root.');
    }

    // Set options
    const options = Object.assign({
        cwd: __dirname,
        configs: ['default', 'env', 'arg'],
        schema: require(path.join(o.cwd || __dirname, 'config-man.json')).schema
    }, o);

    // Make list of configs and meta
    let configs = options.configs.map((config) => {
        if (typeof config.config === 'string') {
            return {
                method: getConfig[config.config],
                args: config.args || {}
            };
        }
        return {method: config.config, args: config.args || {}};
    });

    configs = configs.map((config) => {
        return config.method(Object.assign({}, config.args, {
            schema: options.schema,
            cwd: options.cwd,
            sync: options.sync
        }));
    });

    if (options.sync) {
        Object.assign(configData, parseConfigs(configs));
        Object.freeze(configData);
        let errors = validateConfig({config: configData, schema: options.schema});
        if (errors.length) {
            errors.forEach((error) => console.error(error)); // eslint-disable-line
            throw new Error('CONFIG-MAN: Invalid config');
        }
        return true;
    }

    return Promise.all(configs)
        .then(parseConfigs)
        .then((config) => {
            Object.assign(configData, config);
            Object.freeze(configData);
            let errors = validateConfig({config: configData, schema: options.schema});
            if (errors.length) {
                errors.forEach((error) => console.error(error)); // eslint-disable-line
                throw new Error('CONFIG-MAN: Invalid config');
            }
        });

};

// Get a config value
module.exports.get = getConfigKey.bind(null, configData);

module.exports.meta = (key) => getConfigKey(configData, '_meta.' + key, true);

// Export raw config object
module.exports._config = configData;

// Async initialize
module.exports.init = init;

// Sync initialize
module.exports.initSync = (o) => init(Object.assign({}, o, {sync: true}));

// HELPERS

// Get a config key
function getConfigKey(obj, key, noThrow) {
    if (!obj || !obj._init) {
        throw new Error('CONFIG-MAN: Config-man is not initialized');
    }
    if (!key || typeof (key) !== 'string') {
        throw new Error('CONFIG-MAN: config.get expects (key<string>) got "' + key + '"');
    }
    let value = get(obj, key, undefined);
    if (!noThrow && value === undefined) {
        throw new Error('CONFIG-MAN: config key "' + key + '" not found');
    }
    return value;
}
