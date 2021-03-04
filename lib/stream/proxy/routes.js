

var debug = require('debug')('woobi:stream:proxy:routes');
/**
 * runs the proxy routes.  Can be over written bu end user
 *
 * ####Example:
 *
 *     Broadcast.Stream.proxy.routes(app)
 *
 * @module    
 * @param {Object} app - express app object
 * @param {Object} opts - options
 * @api public
 */
module.exports = function(Broadcast) {
	return function proxy(app, opts, cb) {
		// add the channel routes
		Broadcast.Stream.proxy._routes(app, (err, App) => {});
	}
}
