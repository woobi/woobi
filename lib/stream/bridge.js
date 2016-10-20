/**
 * Creates a passthrough stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.bridge()
 *
 *    
 * @api public
 */

var debug = require('debug')('snowstreams:stream:bridge');
var _ = require('lodash');
var stream = require('stream');

module.exports = function(Broadcast) {
	
	return function bridge() {
		debug('bridge passthrough stream');		
		return new stream.PassThrough();
	}
}
