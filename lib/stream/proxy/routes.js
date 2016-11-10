/**
 * runs the proxy routes.  Can be over written bu end user
 *
 * ####Example:
 *
 *     Broadcast.Stream.proxy.routes(app)
 *
 *     
 * @param {Object} express app object
 * @api public
 */

var debug = require('debug')('snowstreams:stream:proxy:routes');
var Routes = require('../../core/routes'); 

module.exports = function(Broadcast) {
	
	return function proxy(app, opts) {
		// add the channel routes
		Broadcast.Stream.proxy._routes(app);
		// add the server routes
		return Routes(app, Broadcast, opts);
	}
}
