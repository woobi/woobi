/**
 * serverwmc socket adapter
 *
 * ####Example:
 *
 *     Broadcast.adapter.TCPSocket({}, callback)
 *
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('woobi:core:adapter:tcpsocket');
var net = require('net');
var moment = require('moment');

module.exports = function ( Broadcast ) {
	var TCPSocket = function ( opts, callback ) {
		
		if ( !( this instanceof TCPSocket ) ) return new TCPSocket( opts, callback );
		
		debug('TCPSocket');
		
		var _this = this;
		
		// connection
		this.host = opts.host;
		this.port = opts.port;
		
		if ( typeof callback !== 'function' ) {
			callback = function () {};
		}
		
		if ( !this.port || !this.host ) {
			debug('Could not set up TCPSocket without a host and port');
			callback( 'Could not set up TCPSocket without a host and port' );
			return this;
		}
		
		// message protocol
		this.agent = opts.agent || 'Woobi';
		this.hostname = opts.hostname || 'studio';
		this.iden = opts.iden || '';
		
		this.pre = opts.pre || this.agent + '^@' + this.hostname + '@' + this.iden + '|';
		this.post = opts.post || '<Client Quit>';

		callback()
		
		return this;
	}
	
	TCPSocket.prototype.socketConnect = function ( words ) {
		
		debug( 'message', words );
		
		return new Promise((resolve, reject) => {
			
			var client = new net.Socket();
			var msg = this.pre + words + this.post;
			
			var ret;
			
			client.setEncoding('utf8');
			
			client.connect(this.port, this.host, function() {
				debug('Connected to TCPSocket');
				client.write(msg);
				debug('Sent: ', msg);
			});
			
			client.on('data', function(data) {
				debug('Received data ', typeof data);
				ret += data;
				if ( data.search( '<EOF>' ) > -1 ) {
					resolve(ret);
					client.destroy(); // kill client after server's response
				}
				
			});

			client.on('error', function(error) {
				debug('TCPSocket Connection error');
				reject(error);
			});
			
			client.on('close', function() {
				// debug('TCPSocket Connection closed');
				
			});

		});
		
	}
	
	return TCPSocket;
	
}

	
