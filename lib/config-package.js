'use strict';

const configJson = require('./config-json.js');

module.exports = function getConfigPackageJson(o) {
    const cwd = o && o.cwd || __dirname;
    let sync = o && o.sync;

    if (sync) {
        let packageJson = configJson({sync, cwd, path: 'package.json'});
        let config = packageJson.config || {};
        return Object.assign({}, config, {
            _meta: {name: packageJson.name, version: packageJson.version}
        });
    }

    let getConfig = configJson({sync, cwd, path: 'package.json'});
    return getConfig.then((packageJson) => {
        let config = packageJson.config || {};
        return Object.assign({}, config, {
            _meta: {name: packageJson.name, version: packageJson.version}
        });
    });
};
