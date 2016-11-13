/**
 * Creates an open broadcast  stream 
 * Source streams will be pushed into this final stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.transform()
 *
 * @api public
 */

var debug = require('debug')('woobi:source:transform');
var Transform = require('stream').Transform;

module.exports = function(Broadcast) {
	
	return function Transformer(opts,  callback) {
		
		if (!(this instanceof Transformer)) return new Transformer(opts, callback);
		
		debug('transform');
		// this broadcast write stream should only end with explicit instructions
		this.transform = new Transform();
		transform._transform = function (data,  encoding,  callback) {
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
