

var debug = require('debug')('woobi:stream:proxy:server');
var _ = require('lodash');
var hat = require('hat');

/**
 * Creates the server
 *
 * ####Example:
 *
 *     Broadcast.Stream.proxy.server('start', port, callback)
 *
 *     
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
module.exports = function(Broadcast) {
	
	return function proxy(opts, callback) {
				
		if(!_.isFunction(callback)) {
			var callback = function(){}
		}
		
		// check for supplied app
		debug('use app?', !!opts.app)
		if ( opts.app ) {
			Broadcast.Stream.proxy.routes( opts.app, callback );
			return this;
		}
		
		if(!_.isObject(opts)) {
			opts = {};
		}
		
		if(_.isNaN(parseFloat(opts.port))) {
			opts.port = Broadcast.get('port');
		} else {
			opts.port = parseFloat(opts.port);
		}
		
		var name = hat();
		
		var options = Object.assign(opts, {
			routes: opts.routes ? [ opts.routes, Broadcast.Stream.proxy.routes ] : [ Broadcast.Stream.proxy.routes ]
		});
		
		debug('create server', options);
		
		Broadcast.createServer(name, options, callback);

		return this;
	}

}
