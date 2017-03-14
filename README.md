obd-parser-bluetooth-connection
============================

Connection module for use with _odb-parser_.

## Install

```
npm install obd-parser-bluetooth-connection
```

## Usage

The typical usage scenario is described in the _obd-parser_ module docs, but
if you want to use this module to get a plain OBD connection you can use the
example code below as a start.

```
var getConnector = require('obd-parser-bluetooth-connection');

// Returns a function that will allow us to connect to the serial port
var connect = getConnector({
  name: 'obd'
});

connect(configureFunction)
  .then(function () {
    console.log('connected to bluetooth obd adapter!')
  })
  .catch(function (err) {
    console.error('oh noes');
  });


function configureFunction (connection) {
  return new Promise(function (resolve, reject) {
    // Set up the obd connection etc.
    conn.write('ATZ');
    conn.write('ATE0');
  });
}
```
