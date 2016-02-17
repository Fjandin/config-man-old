# config-man

Configuration manager for NodeJS apps (Browser app support underway)

## Installation

`npm install --save config-man`

## Usage

You need to have a `config-man.json` file in your project root. This file defines the schema of your config.

Example config-man.json:
```
{
    "schema": [
        {"key": "environment", "type": "string", "allowed": ["dev", "prod"]},
        {"key": "log.level", "type": "string", "allowed": ["debug", "info", "warning", "error"], "default": "info"}
    ]
}
```

Start configMan:

```
const configMan = require('config-man');
configMan.init([options])
    .then(startApp);

function startApp() {
    if (configMan.get('log.level') === 'debug') {
        console.debug('App started');
    }
}
```

ConfigMan can also be started syncronously, but no asyncronous config types will be available.

```
configMan.initSync([options]);
startApp();
```
