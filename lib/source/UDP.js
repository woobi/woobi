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


module.exports = function(Broadcast) {
	
	return function UDP(opts, callback) {
		
		if (!(this instanceof UDP)) return new UDP(opts, callback);
		
		var _this = this;
		
		if(!_.isFunction(callback)) {
			//debug('no callback');
			var callback = function(){}
		}
		
		debug('udpSink', opts);
		
		if(!opts.host) {
			callback('udpSink host must be a String');
			return _this;
		}
		if(_.isNaN(parseFloat(opts.port))) {
			callback('udpSink port must be a Number');
			return _this;
		} else {
			opts.port = parseFloat(opts.port);
		}
		
		var Asset = this;
		
		Asset.name = opts.name || Broadcast.randomName('udpSink');
		
		_.defaults(Asset, opts);
		
		// create the new stream
		var transform = Asset.stream = Transform();
		transform._transform = function (data, encoding, callback) {
			//if(data !== null) {
				this.push(data);
			//}
			callback();
		};
		
		var server = Asset.server = dgram.createSocket('udp4');
		
		var end = (err, data) => {
			Broadcast.streams[Asset.name] = Asset.stream;
			callback(err, data)
		}
		
		server.on('listening', function () {
			Asset.address = server.address();
			debug('udpSink listening on ' + Asset.address.address + ":" + Asset.address.port);
			
			Asset.end = (callback) => { 
				if(callback) {
					callback();
				}
				server.close();
				Asset.stream.end();
			}
			end(null, Asset);
		});
		
		server.on('end', function (message, remote) {
			debug('udpSink ended on ' + Asset.address.address + ":" + Asset.address.port);
			Asset.end = (callback) => { 
				if(callback) {
					callback();
				}
				Asset.stream.end();
			}
		});
		server.on('close', function (message, remote) {
			debug('udpSink ended on ' + Asset.address.address + ":" + Asset.address.port);
			Asset.end = (callback) => { 
				if(callback) {
					callback();
				}
				Asset.stream.end();
			}
		});
		
		server.on('message', function (message, remote) {
			transform.write(message);
		});

		server.bind(opts.port, opts.host);
		
		
		
		return Asset;
		
	}

}
