'use strict';

const merge = require('lodash/merge');

module.exports = function parseConfig(configs) {
    let config = merge.apply(null, [{}].concat(configs).concat({
        _init: true
    }));
    return config;
};
