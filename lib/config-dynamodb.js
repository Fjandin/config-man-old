'use strict';

const set = require('lodash/set');
const AWS = require('aws-sdk');

module.exports = function getDynamodbConfig(o) {
    if (o && o.sync) {
        throw new Error('CONFIG-MAN: DynamodbConfig is not compatible with initSync');
    }
    return new Promise((resolve, reject) => {
        const awsConfig = o && o.awsConfig;
        const tableName = awsConfig.tableName;
        delete awsConfig.tableName;
        AWS.config.update(awsConfig);
        const configClient = new AWS.DynamoDB.DocumentClient();
        const params = {TableName: tableName};
        configClient.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data.Items.reduce((red, item) => {
                return set(red, item.key, item.value);
            }, {}));
        });
    });
};
