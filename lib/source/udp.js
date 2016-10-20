/**
 * Creates a source stream from a udp stream
 *
 * ####Example:
 *
 *     ss.source.udp({port:10000,host:'224.0.0.251'}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('snowstreams:source:udp');
var _ = require('lodash');
// node streams
var dgram = require('dgram');
var Transform = require('stream').Transform;


module.exports = function(ss) {
	
	return function udp(opts, callback) {
		
		var _this = this;
		
		
		if(!_.isFunction(callback)) {
			debug('no callback');
			var callback = function(){}
		}
		if(!_.isString(opts.name)) {
			callback('name must be a String');
			return _this;
		}
		if(ss.asset[opts.doc._id]) {
			callback('asset exists');
			return _this;
		}
		if(!_.isString(opts.host) ) {
			callback('host must be a String');
			return _this;
		}
		if(_.isNaN(parseFloat(opts.port))) {
			callback('port must be a Number');
			return _this;
		} else {
			opts.port = parseFloat(opts.port);
		}
		
		var Asset = new ss.Asset(opts.name, {
			doc: opts.doc,
			host: opts.host,
			port: opts.port,
			stream: false,
			log: [],
			type: 'udp',
		});
		
		// create the new stream
		var transform = Asset.stream = Transform();
		transform._transform = function (data, encoding, callback) {
			if(data !== null) {
				this.push(data);
			}
			callback();
		};
		
		var server = dgram.createSocket('udp4');
		
		server.on('listening', function () {
			var address = server.address();
			debug('UDP Server listening on ' + address.address + ":" + address.port);
		});

		server.on('message', function (message, remote) {
			transform.write(message);
		});

		server.bind(opts.port, opts.host);
		
		// register the emitter
		ss.emitterReg('source.' + opts.name);
		ss.talk('source.' + opts.name, { action: 'start'});
		
		callback(null, tsource);
		return this;
	}

}
