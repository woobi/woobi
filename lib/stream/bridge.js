var debug = require('debug')('woobi:stream:bridge');
var _ = require('lodash');
var stream = require('stream');

/**
 * Creates a passthrough stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.bridge()
 *
 * @return {Stream} passthrough stream
 *    
 * @api public
 */
module.exports = function(Broadcast) {
	
	return function Bridge() {
		//debug('bridge passthrough stream');		
		
		if (!(this instanceof Bridge)) return new Bridge();
		
		this.stream = new stream.PassThrough();
		
		return this.stream;
	}
}
