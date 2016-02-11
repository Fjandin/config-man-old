'use strict';

// modules
const merge = require('lodash/merge');
const set = require('lodash/set');
const get = require('lodash/get');
const path = require('path');
const fs = require('fs');

// Object that holds the config
const configData = {};

const init = (o, sync) => {
    // We are not supposed to call init more than once
    if (configData._init) {
        throw new Error('CONFIG-MAN: ConfigMan already initialized once.');
    }

    const options = Object.assign({
        cwd: __dirname,
        externalConfig: []
    }, o);

    if (!fs.existsSync(path.join(options.cwd, 'config-man.json'))) {
        console.warn('CONFIG-MAN: You need to add a config-man.json file to your root.'); // eslint-disable-line
    }
    options.schema = requireJsonSync(path.join(options.cwd, 'config-man.json')).schema || [];

    const CONFIGS = {};

    // Get default values from schema
    CONFIGS.DEFAULT = {};
    options.schema.forEach((option) => {
        option.default !== undefined && set(CONFIGS.DEFAULT, option.key, option.default);
    });

    // Get config from arguments
    CONFIGS.ARG = options.schema.reduce((red, option) => {
        let index = process.argv.findIndex((a) => a === '-' + option.key);
        if (index > -1 && option.type.match(/^(number|string)$/)) {
            let value = process.argv[index + 1] || '';
            if (option.type === 'number' && value.match(/^-?\d*(\.\d+)?$/)) {
                value = parseFloat(value);
            } else if (option.type === 'boolean' && value.match(/^(true|false)$/)) {
                value = (value === 'true');
            }
            set(red, option.key, value);
        }
        return red;
    }, {});

    // Get config from environment
    CONFIGS.ENV = options.schema.reduce((red, option) => {
        let envKey = 'CM_' + option.key.replace(/\./g, '_').toUpperCase();
        let value = process.env[envKey];
        if (value !== undefined) {
            if (option.type === 'number' && value.match(/^-?\d*(\.\d+)?$/)) {
                value = parseFloat(value);
            } else if (option.type === 'boolean' && value.match(/^(true|false)$/)) {
                value = (value === 'true');
            }
            set(red, option.key, value);
        }
        return red;
    }, {});

    const parseResults = (results) => {
        const jsonPackage = results.shift();

        merge.apply(null, [configData].concat(results).concat({
            meta: {
                name: jsonPackage.name,
                version: jsonPackage.version,
                init: true,
                options: options
            }
        }));

        // Freeze config
        Object.freeze(configData);

        // Validate config
        let errors = options.schema
            .map((s) => {
                let val;
                val = getConfigKey(configData, s.key, true);
                if ((val === undefined || val === null) && s.nullable) {
                    return null;
                }
                let type = realTypeOf(val);
                if (type !== s.type) {
                    return 'config ' + s.key + ' expected <' + s.type + '> but got <' + type + '> (' + JSON.stringify(val) + ')';
                }
                if (s.allowed && !~s.allowed.indexOf(val)) {
                    return 'config ' + s.key + ' must be one of [' + s.allowed.join(', ') + '] got ' + val;
                }
            })
            .filter((e) => e);
        if (errors.length) {
            errors.forEach((error) => console.error(error)); // eslint-disable-line
            throw new Error('CONFIG-MAN: Invalid config');
        }
    };

    // Syncronous initialize (remote db not available for Syncronous init)
    if (sync) {
        let results = [requireJsonSync(path.join(options.cwd, 'package.json'))].concat(options.configs.map((config) => {
            if (typeof config === 'string') {
                if (config === 'JSON') {
                    return requireJsonSync(path.join(options.cwd, 'config.json'));
                }
                if (!CONFIGS[config]) {
                    throw new Error('CONFIG-MAN: Unknown config type "' + config + '"');
                }
                return CONFIGS[config];
            } else if (typeof config.then === 'function') {
                throw new Error('CONFIG-MAN: You cannot add asyncronous configs to initSync call');
            }
            return config;
        }));

        results = [
            requireJsonSync(path.join(options.cwd, 'package.json')),
            requireJsonSync(path.join(options.cwd, 'config.json'))
        ].concat(options.externalConfig.map((config) => {
            return config;
        }));
        parseResults(results);
        return true;
    }

    // Asyncronous initialize
    let asyncResults = [requireJson(path.join(options.cwd, 'package.json'))].concat(options.configs.map((config) => {
        if (typeof config === 'string') {
            if (config === 'JSON') {
                return requireJson(path.join(options.cwd, 'config.json'));
            }
            if (!CONFIGS[config]) {
                throw new Error('CONFIG-MAN: Unknown config type "' + config + '"');
            }
            return Promise.resolve(CONFIGS[config]);
        } else if (typeof config.then !== 'function') {
            return Promise.resolve(config);
        }
        return config;
    }));

    return Promise.all(asyncResults).then(parseResults);
};

// Get a config value
module.exports.get = getConfigKey.bind(null, configData);

// Export raw config object
module.exports._config = configData;

// Async initialize
module.exports.init = init;

// Sync initialize
module.exports.initSync = (o) => init(o, true);

// HELPERS

// Get a config key
function getConfigKey(obj, key, noThrow) {
    if (!obj || !obj.meta || !obj.meta.init) {
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

function realTypeOf(obj) {
    return ({}).toString.call(obj).replace(/\[object\s(.*?)\]/, '$1').toLowerCase();
}

function requireJsonSync(jsonPath) {
    if (fs.existsSync(jsonPath)) {
        return require(jsonPath);
    }
    return {};
}

function requireJson(jsonPath) {
    return new Promise((resolve) => {
        fs.exists(jsonPath, (exists) => {
            if (!exists) {
                return resolve({});
            }
            return resolve(require(jsonPath));
        });
    });
}
