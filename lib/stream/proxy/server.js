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

var debug = require('debug')('woobi:stream:proxy:server');
var _ = require('lodash');

module.exports = function(Broadcast) {
	
	return function proxy(opts, callback) {
		
		var _this = this;
		
		if(!_.isFunction(callback)) {
			var callback = function(){}
		}
		if(!_.isObject(opts)) {
			opts = {};
		}
		if(_.isNaN(parseFloat(opts.port))) {
			opts.port = Broadcast.get('port');
		} else {
			opts.port = parseFloat(opts.port);
		}
		
		var name = 'ChannelServer';
		
		debug(Broadcast.Stream.proxy.routes)
		
		var options = Object.assign(opts, {
			routes: Broadcast.Stream.proxy.routes
		});
		
		debug('create server', options);
		
		Broadcast.createServer(name, options, callback);

		return this;
	}

}
