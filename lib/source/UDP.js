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

var debug = require('debug')('woobi:source:udp');
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
		
		var channel = this.channel || this.name;
		
		// create the new stream
		var transform = Asset.stream = Broadcast.Stream.bridge();
		transform.on('pipe', (src) => {
			debug(channel + ' - ' +'something is piping into the updSink bridge');
		})
		.on('unpipe', (src) => {
			debug(channel + ' - ' +'something unpiped from the updSink bridge', src);
		})
		.on('drain', (src) => {
			
		})
		.on('error', (err) => {
			debug(channel + ' - ' +'err from the updSink bridge');
		})
		.on('close', () => {
			debug(channel + ' - ' +'updSink bridge closed');
		})
		.on('end', () => {
			debug(channel + ' - ' +'updSink bridge end');
		})
		.on('finish', () => {
			debug(channel + ' - ' +' updSink bridge finished' );
		})
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
