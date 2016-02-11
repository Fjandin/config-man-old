'use strict';

const fs = require('fs');
const pathParse = require('path');

module.exports = function getJsonConfig(o) {
    const cwd = o && o.cwd || __dirname;
    const path = pathParse.join(cwd, o && o.path || '');
    const sync = o && o.sync;
    const optional = o && o.optional;
    if (sync) {
        return requireJsonSync(path, optional);
    }
    return requireJson(path, optional);
};

function requireJsonSync(jsonPath, noFail) {
    if (!fs.existsSync(jsonPath)) {
        if (noFail) {
            return {};
        }
        throw new Error('CONFIG-MAN: ' + jsonPath + ' does not exist.');
    }
    return require(jsonPath);
}

function requireJson(jsonPath, noFail) {
    return new Promise((resolve, reject) => {
        fs.exists(jsonPath, (exists) => {
            if (!exists) {
                if (noFail) {
                    return {};
                }
                return reject(new Error('CONFIG-MAN: ' + jsonPath + ' does not exist.'));
            }
            return resolve(require(jsonPath));
        });
    });
}
