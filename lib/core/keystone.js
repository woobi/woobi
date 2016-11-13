var keystone = require('keystone');
var	_ = require('lodash');
var	debug = require('debug')('woobi:lib:core:keystone');
var async = require('async');
var Socket = require('./socket');
var Live = require('keystone-live');

function key() {
	
	var exports = {};
	/**
	 * This file contains methods specific to dealing with Keystone's options.
	 * All exports are added to the Keystone.prototype
	 */
	
	exports.keystoneServer = function(opts, callback) {
		
		var Broadcast = this;
		
		Broadcast.keystone = keystone;
		
		var moduleRoot = Broadcast.get('module root');
		if(!_.isObject(opts)) {
			opts = {};
		}

		keystone.init({
			'name': opts.name || 'snowstreams',
			'brand': 'snowstreams',
			'auth': opts.auth === false ? false : true,
			'user model': 'User',
			'mongo': opts.mongo || process.env.MONGO_URI || 'mongodb://localhost/snowstreams',
			'host': opts.host || Broadcast.get('host'),
			'port': Broadcast.get('port'),
			'ssl': opts.ssl || false,
			'ssl port': opts.sslPort ,
			'ssl key': opts.sslKey,
			'ssl cert': opts.sslCert,
			'session': true,
			'session store':'mongo',
			'module root': moduleRoot,
			'session options': {
				key: opts.name + '.sid' || 'snowstreams.sid',
			},
			'cookie secret': opts.COOKIE_SECRET || process.env.COOKIE_SECRET || 'uy97w3qqhTI9jYHT54Tgf3E3huuiINBGHhyui8hyYDTd(765ft976fov',
			'trust proxy':true,
			'file limit': '50mb'
			
		});
		
		keystone.import('models');
		let routes = Array.isArray(opts.routes) ? opts.routes : [opts.routes];
		
		keystone.set('routes', function(app) {			
			Live.init(keystone).apiRoutes(null, opts);
			_.each(routes, function(route) {
				route(app, opts);
			});
		});
				
		// save the server
		this.servers['keystone'] = {
			sockets: {},
			proxies: [],
			name: opts.name,
			host: Broadcast.get('host'),
			port: Broadcast.get('port')
		}
		_.extend(this.servers['keystone'], opts)
		
		keystone.start({
			onMount: function() {
				// clear any streaming bits
				//keystone.lists.Channel.model.update( {}, { streaming: false } , { multi: true }).exec();
				//keystone.lists.Source.model.update( {}, { streaming: false } , { multi: true }).exec();
				Broadcast.libs._mongo = keystone.lists;
			},
			onStart: () => {
				
				
				Broadcast.keystone.httpServer.on('connection',  (socket) => {
					// Add a newly connected server
					var socketId = Broadcast.nextSocketId++;
					Broadcast.servers.keystone.sockets[socketId] = socket

					// Remove the socket when it closes
					socket.on('close',  () => {
						//debug('socket', socketId, 'closed');
						delete Broadcast.servers.keystone.sockets[socketId];
					});

				});
				
				Live.apiSockets(opts); //.listEvents();
				Broadcast.io = Live.io
				Socket.socketRoutes.call(Broadcast);
				
				if(keystone.app.get('env') == 'development') {
					var Watcher = require('chokidar-socket-emitter')({ io: Broadcast.io });
				}
				
				callback(null, ' server started on port ' + Broadcast.get('port'))	
			}
		});
	} 
	
	return exports;
	
}

module.exports = key;


function selectFields(user, main) {
	
	function inex(str, val) {
		var obj = {};
		_.each(str.split(','), function(v) {
			obj[v] = val;
		});
		return obj;
	}
	if(_.isString(user.exclude)) {
		var select = inex(user.exclude, 0);
	} else if(_.isString(user.include)) {
		var select = inex(user.include, 1);			
	} else if(_.isString(main.exclude)) {
		var select = inex(main.exclude, 0);
	} else if(_.isString(main.include)) {
		var select = inex(main.include, 1);			
	}
	
	return select;
}


