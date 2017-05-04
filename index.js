'use strict';

var Promise = require('bluebird'),
	VError = require('verror'),
	conn = null,
	bluetooth = new(require('bluetooth-serial-port')).BluetoothSerialPort(),
	assert = require('assert'),
	debug = require('debug')(require('./package.json').name);


// Keep track of connection requests
var connQ = [];

var _write = bluetooth.write;
bluetooth.write = function(msg, cb) {
	msg = new Buffer(msg, 'utf-8');
	return _write(msg, cb);
};
/**
 * Factory function that can be used to get connections.
 *
 * It's not possible to have more than one connection so this will ensure
 * that all callers share the same connection.
 *
 * @param  {Object}   opts
 * @return {Promise | Socket}
 */
module.exports = function(opts) {

	assert.equal(
		typeof opts,
		'object',
		'an options object must be provided to obd-serial-connection'
	);

	assert.equal(
		typeof opts.name,
		'string',
		'opts.name should be a string provided to obd-bluetooth-connection'
	);

	return function _obdBluetoothConnectorFn(configureFn) {
		assert.equal(
			typeof configureFn,
			'function',
			'you must provide a configureFn that returns a promise'
		);

		return new Promise(function(resolve, reject) {
			debug('creating bluetooth connection');

			if (conn && conn.ready) {
				debug('returning existing connection instance');
				resolve(conn);
			} else {
				debug('opening a bluetooth connection');

				// Keep track of the promise(s) we're returning
				connQ.push({
					resolve: resolve,
					reject: reject
				});

				// create bluetooth device instance
				bluetooth.on('found', function(address, name) {
					debug(name);
					if (name.toLowerCase().indexOf(opts.name) !== -1) {
						debug('matzch')
							// make bluetooth connect to remote device
						bluetooth.findSerialPortChannel(address, function(channel) {
							bluetooth.connect(address, channel, function() {
									debug('Connected!');
									conn = bluetooth;
									onConnectionOpened(configureFn);
								},
								function(err) {
									debug('Connection Error!', err);
									onConnectionOpened(configureFn, err);
								});
						});
					}
				}, function() {
					debug('Bluetooth Device not found!');
					onConnectionOpened(configureFn, 'Could not find Bluetooth Device!');
				});

				bluetooth.inquire();
			}
		});
	};
};

/**
 * Parses serial data and emits and event related to the PID of the data.
 * Pollers will listen for events related to their PID
 * @param {String} str
 */
function onData(str) {
	debug('received obd data %s', str);
}

/**
 * Resolves/rejects any pending connection requests, depending on Error passed
 * @param  {Error} err
 */
function respondToConnectionRequests(err) {
	connQ.forEach(function(req) {
		if (err) {
			req.reject(err);
		} else {
			req.resolve(conn);
		}
	});
}

/**
 * General callback for the "error" event on the connection to ensure
 * all errors are cpatured and logged.
 * @param  {Erorr} err
 */
function onError(err) {
	debug('bluetooth emitted an error %s', err.toString());
	debug(err.stack);
}

/**
 * Handler for the "open" event for connections.
 *
 * This performs error handling if the connection fails, or sets up the
 * connection with useful defaults if the connection is successful.
 *
 * @param  {Error} err
 */
function onConnectionOpened(configureFn, err) {
	if (err) {
		err = new VError(err, 'failed to connect to ecu');

		debug('error establishing a bluetooth connection: %s', err);

		respondToConnectionRequests(err);
	} else {
		debug('bluetooth connection established, running configuration function');

		return configureFn(conn)
			.then(function onConfigurationComplete() {
				debug('finished running configuration function, returning connection');

				conn.ready = true;

				respondToConnectionRequests();
			});
	}
}
