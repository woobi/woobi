/**
 * Creates a upd broadcast from a source stream
 *
 * ####Example:
 *
 *     Broadcast.stream.udp({ host, channel }, callback)
 *
 *     
 * @param {String} stream name
 * @param {String} source name
 * @param {String} host
 * @param {Int} port
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('snowstreams:stream:udp');
var _ = require('lodash');
var dgram = require('dgram');
var chunkingStreams = require('chunking-streams');
var SizeChunker = chunkingStreams.SizeChunker;


module.exports = function(Broadcast) {
	
	return function UDP(opts, callback) {
		
		if (!(this instanceof UDP)) return new UDP(opts, callback);
		
		var _this = this;
		var channel = this.channel = opts.channel;
		var port = this.port = opts.port;
		var host = this.host = opts.host || '0.0.0.0';
		
		_this.paused = false;
		
		if(!_.isFunction(callback)) {
			var callback = function(){}
		}
		
		if(!_.isString(host) ) {
			callback('host must be a String');
			return _this;
		}
		if(_.isNaN(parseFloat(port))) {
			callback('port must be a Number');
			return _this;
		} else {
			port = parseFloat(port);
		}
			
		function createUDP(optrions) {
			_this.udp = dgram.createSocket('udp4');
			//_this.udp.bind();
			if(optrions.multicast) {
				_this.udp.setBroadcast(true)
				_this.udp.setMulticastTTL(optrions.multicastTTL || 2);
				_this.udp.addMembership(optrions.host); 
			}
			// Listen for messages from client
			_this.udp.on('message', function (message) {
				debug("Client: " + message.toString());
			});
		}
		
		this.udp = false;
		createUDP(opts);
				
		// set the final pipe with chunking-streams
		// splits the stream into 7 TSP instead of 16 TSP
		this.chunker = new SizeChunker({
			chunkSize: 188 * 7,
			flushTail: true
		});

		this.chunker.on('chunkStart', function(id, done) {
			// Create the client
			if(_this.paused) debug('chunker start ... PAUSED');
			done();
		});
		 
		this.chunker.on('chunkEnd', function(id, done) {
			if(_this.paused) debug('chunker end ... PAUSED');
			done();
		});
		 
		this.chunker.on('data', function(chunk) {
			_this.udp.send(chunk.data, 0, chunk.data.length, port, host);
		});
		
		this.play = function(stream, callback) {
			debug('push to upd stream', Broadcast.isReadableStream(stream));
			
			if(Broadcast.isReadableStream(stream)) {
				stream.pipe(this.chunker)
				callback(null);
			} else {
				callback('error reading stream for channel ' + channel);
			}
		};
		
		this.stop = function(pass, cb) {
			
			debug('check for upd stream');
			if(Broadcast.isReadableStream(this.client) && _.isFunction(this.client.end)) {
				debug('stop upd stream', this);
				_this.client.end();
			}
			if(_.isFunction(cb)) {
				cb(null, pass);
			}
			
		};
		
		debug('done with new udp channel on  ' + port + '... ready for play action');
		
		callback(null, this);
		
		return this;
	}

}
