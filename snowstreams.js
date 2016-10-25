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
	this.programs = {};
	this.proxies = [];
	this.lib = false;
	
	
	this.Source = this.import('lib/source');
	this.Stream = this.import('lib/stream');
	/**
	 * Channel management
	 * var myChannel = new ss.Channel('8', properties);
	 * */
	this.Channel =  require('./lib/channel.js')(this);
	
	this.version = require('./package.json').version;
}
 
 snowstreams.prototype.init = function(opts, callback) {
	if(!_.isArray(opts.adapters)) {
		console.log('No adapter configs found!  Exiting now.');
		process.exit();
		return false;
	}
	
	this.channelPort = opts.channelPort || 13000;
	this.host =opts.host ||  opts.proxy.host || 'localhost';
	this.port = opts.proxy.port || 7001;
	
	this.uri = this.host + ':' + this.port;
	
	if(opts.proxy) {
		if(opts.proxy === true)  {
			opts.proxy = {};
		}
		this.Stream.sourceProxy(opts.proxy, (err, result) => {
			if(err) console.log('ERROR', err);
		});
	}
	
	// set the correct library adapters
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
	this.filler2 = {
		name: 'River', 
		file: path.join(this.get('module root'), 'lib/assets/river.mp4'),
		loop: false,
	};

	this.filler = {
		name: 'Waterfall', 
		file: path.join(this.get('module root'), 'lib/assets/waterfall.mp4'),
		loop: false
	};
	
}

// options and utils
_.extend(snowstreams.prototype, require('./lib/core/options')());
// standalone server
_.extend(snowstreams.prototype, require('./lib/core/createServer')());

snowstreams.prototype.addChannel = function(channel, opts) {
	this.channels[channel] = new this.Channel(channel, opts);
	return this.channels[channel];
}

snowstreams.prototype.addProgram = function(program, opts, callback) {
	opts.name = program;
	this.programs[program] = new this.Source.Program(opts, callback);
	return this.programs[program];
}

var Broadcast = new snowstreams();

/**
 * The exports object is an instance of snowstreams.
 *
 * @api public
 */

module.exports = Broadcast;
