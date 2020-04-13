// var getConnector = require('obd-parser-bluetooth-connection');
var getConnector = require('./index');
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