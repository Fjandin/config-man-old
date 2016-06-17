'use strict';

const get = require('lodash/get');

module.exports = function validateConfig(o) {
    let config = o.config;
    let schema = o.schema;

    // Validate config
    return schema
        .map((s) => {
            let val;
            val = get(config, s.key);
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
            return null;
        })
        .filter((e) => e);
};

function realTypeOf(obj) {
    return ({}).toString.call(obj).replace(/\[object\s(.*?)\]/, '$1').toLowerCase();
}
