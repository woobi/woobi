/**
 * Creates an open broadcast  stream 
 * Source streams will be pushed into this final stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.broadcast()
 *
 * @api public
 */

var debug = require('debug')('snowstreams:source:broadcast');
var _ = require('lodash');
var stream = require('stream');

module.exports = function(Broadcast) {
	
	return function broadcast(opts,  callback) {
		debug('broadcast');
	
		// this broadcast write stream should only end with explicit instructions
		this.transform = new stream.Transform();
		this.transform._transform = function (data,  encoding,  callback) {
			this.cb = callback;
			if(data !== null) {
				this.push(data);
				this.data = data;
				callback();
			} else {
				debug('no data');
				this.push(this.data);
			}
		};
		// send back the broadcast info		
		return this.transform;
	}
}
