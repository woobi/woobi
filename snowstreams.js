var debug = require('debug')('snowstreams:main');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Adapter = require('./lib/core/adapter');

// sockets
//var sockets =  require('./lib/core/socket')();

var moduleRoot = (function(_rootPath) {
	var parts = _rootPath.split(path.sep);
	parts.pop(); //get rid of /node_modules from the end of the path
	return parts.join(path.sep);
})(module.paths[0]);

var snowstreams = function() {
	this._options = {
		'name': 'snowstreams',
		'module root': moduleRoot,
	}
	this.channels = {};
	this.servers = {};
	this.proxies = [];
	this.lib = false;
}
 
 snowstreams.prototype.init = function(opts, callback) {
	if(!_.isArray(opts.adapters)) {
		console.log('No adapter configs found!  Exiting now.');
		process.exit();
		return false;
	}
	
	this.channelPort = opts.channelPort || 13000;
	
	if(opts.proxy) {
		if(opts.proxy === true)  {
			opts.proxy = {};
		}
		this.Stream.sourceProxy(opts.proxy, (err, result) => {
			if(err) console.log('ERROR', err);
			if(result) console.log(result);
		});
	}
	
	// set the correct library adapter
	async.map(opts.adapters,
		(v, next) => {
			Adapter(this, v, (err, adapted) => {
				debug(v.type, 'Adapter configured');
				next(null, adapted);
			});
		},
		(err, all) => {
			debug('Init finished');
			this.libs = all;
			if(_.isFunction(callback)) {
				callback();
			}	
		}
	);
	
}

// options and utils
_.extend(snowstreams.prototype, require('./lib/core/options')());
// standalone server
_.extend(snowstreams.prototype, require('./lib/core/createServer')());


snowstreams.prototype.addChannel = function(channel, opts) {
	this.channels[channel] = new this.Channel(channel, opts);
	return this.channels[channel];
}

var Broadcast = new snowstreams();

/**
 * Channel management
 * 
 * -- var myChannel = new ss.Channel('8', properties);
 * 
 * */
Broadcast.Channel = require('./lib/channel.js')(Broadcast);

// source classes
var Sources = function() {};
_.extend(Sources.prototype, Broadcast.import('lib/source'));
Broadcast.Source = new Sources();

// stream classes
var Streams = function() {};
_.extend(Streams.prototype, Broadcast.import('lib/stream'));
Broadcast.Stream = new Streams();

// listener functions for sockets and routes
/*
var socketListeners = function() {};
_.extend(socketListeners.prototype, sockets.listeners.call(Broadcast));
Broadcast.Listen = new socketListeners();
*/
Broadcast.version = require('./package.json').version;

/**
 * The exports object is an instance of snowstreams.
 *
 * @api public
 */

module.exports = Broadcast;
