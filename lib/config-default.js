'use strict';

const set = require('lodash/set');

module.exports = function getDefaultConfig(o) {
    const schema = o && o.schema || [];
    const sync = o && o.sync;
    let config = schema.reduce((red, option) => {
        option.default !== undefined && set(red, option.key, option.default);
        return red;
    }, {});

    return sync ? config : Promise.resolve(config);
};
