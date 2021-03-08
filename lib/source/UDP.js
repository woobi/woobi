var debug = require('debug')('woobi:source:udp');
var _ = require('lodash');
// node streams
var dgram = require('dgram');

/** 
 * Manage broadcast channels
 * @module Broadcat/Source
 * 
 * */
module.exports = function(Broadcast) {
/**
 * Creates a upd socket connection to receive data 
 * ####Example:
 *
 *     Broadcast.Source.UPD({port:10000,host:'224.0.0.251'}, callback)
 *
 * @param {Object} opts
 * @param {Function} callback
 *
 *     
 */	
	function UDP(opts, callback) {
		
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
		
		Asset.link = 'udp://' + opts.host  + ':' + opts.port;
				
		// create the new stream
		Asset.stream = Broadcast.Stream.bridge();
		Asset.stream.on('pipe', (src) => {
			debug(Asset.name + ' - ' +'something is piping into the updSink bridge');
			Broadcast.emit('UPD ' + Asset.name, { status: 'stream pipe' });
		})
		.on('unpipe', (src) => {
			debug(Asset.name + ' - ' +'something unpiped from the updSink bridge', src);
			Broadcast.emit('UPD ' + Asset.name, { status: 'stream unpipe' });
		})
		.on('drain', (src) => {
			
		})
		.on('error', (err) => {
			debug(Asset.name + ' - ' +'err from the updSink bridge');
			Broadcast.emit('UPD ' + Asset.name, { status: 'stream error', error: err });
		})
		.on('close', () => {
			debug(Asset.name + ' - ' +'updSink bridge closed');
			Broadcast.emit('UPD ' + Asset.name, { status: 'stream close' });
		})
		.on('end', () => {
			debug(Asset.name + ' - ' +'updSink bridge end');
			Broadcast.emit('UPD ' + Asset.name, { status: 'stream end' });
		})
		.on('finish', () => {
			debug(Asset.name + ' - ' +' updSink bridge finished' );
			Broadcast.emit('UPD ' + Asset.name, { status: 'stream finish' });
		})
		
		var server = Asset.server = dgram.createSocket('udp4');
		
		var end = (err, data) => {
			Broadcast.streams[Asset.name] = Asset.stream;
			callback(err, data)
		}
		
		server.on('listening', function () {
			Asset.address = server.address();
			debug('udpSink listening on ' + Asset.address.address + ":" + Asset.address.port);
			Broadcast.emit('UPD ' + Asset.name, { status: 'listening' });
			Asset.end = ( callback ) => { 
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
			Broadcast.emit('UPD ' + Asset.name, { status: 'end' });
		});
		server.on('close', function (message, remote) {
			debug('udpSink ended on ' + Asset.address.address + ":" + Asset.address.port);
			Broadcast.emit('UPD ' + Asset.name, { status: 'close' });
		});
		
		server.on('message', function (message, remote) {
			Asset.stream.write(message);
		});

		server.bind(opts.port, opts.host);
		
		
		
		return Asset;
		
	}

}
