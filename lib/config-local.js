'use strict';

module.exports = function getLocalConfig(o) {
    const sync = o && o.sync;
    if (sync) {
        return o && o.config || {};
    }
    return Promise.resolve(o && o.config || {});
};
