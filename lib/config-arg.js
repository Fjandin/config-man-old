'use strict';

const set = require('lodash/set');

module.exports = function getArgumentsConfig(o) {
    const schema = o && o.schema || [];
    const sync = o && o.sync;
    let config = schema.reduce((red, option) => {
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

    return sync ? config : Promise.resolve(config);
};
