'use strict';

const set = require('lodash/set');
const AWS = require('aws-sdk');
module.exports = function getDynamodbConfig(o) {
    if (o && o.sync) {
        throw new Error('CONFIG-MAN: DynamodbConfig is not compatible with initSync');
    }
    return new Promise((resolve, reject) => {
        const awsSdkConfig = o && o.awsSdkConfig;
        const scanParams = o && o.scanParams;
        AWS.config.update(awsSdkConfig);
        const configClient = new AWS.DynamoDB.DocumentClient();
        configClient.scan(scanParams, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data.Items.reduce((red, item) => {
                return set(red, item.key, item.value);
            }, {}));
        });
    });
};
