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

var debug = require('debug')('woobi:stream:proxy:routes');
var Routes = require('../../core/routes'); 

module.exports = function(Broadcast) {
	
	return function proxy(app, opts, cb) {
		// add the channel routes
		Broadcast.Stream.proxy._routes(app, (err, App) => {
			// add the web app
			if ( Broadcast._options.proxy.webApp === true ) {
				Routes(app, Broadcast, opts, cb);
			}
		});
		
	}
}
