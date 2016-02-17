'use strict';

const set = require('lodash/set');

module.exports = function getEnvironmentVarConfig(o) {
    const schema = o && o.schema || [];
    const sync = o && o.sync;
    const prefix = o && o.prefix || 'CM_';

    let config = schema.reduce((red, option) => {
        let envKey = prefix + option.key.replace(/\./g, '_');
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

    return sync ? config : Promise.resolve(config);
};
