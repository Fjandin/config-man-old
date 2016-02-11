'use strict';

const fs = require('fs');
const pathParse = require('path');

module.exports = function getJsonConfig(o) {
    const cwd = o && o.cwd || __dirname;
    const path = pathParse.join(cwd, o && o.path || '');
    const sync = o && o.sync;
    if (sync) {
        return requireJsonSync(path);
    }
    return requireJson(path);
};

function requireJsonSync(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
        throw new Error('CONFIG-MAN: ' + jsonPath + ' does not exist.');
    }
    return require(jsonPath);
}

function requireJson(jsonPath) {
    return new Promise((resolve, reject) => {
        fs.exists(jsonPath, (exists) => {
            if (!exists) {
                return reject(new Error('CONFIG-MAN: ' + jsonPath + ' does not exist.'));
            }
            return resolve(require(jsonPath));
        });
    });
}
