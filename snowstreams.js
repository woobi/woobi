var debug = require('debug')('snowstreams:main');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Adapter = require('./lib/core/adapter');
var fs = require('fs-extra');
var sanitize = require("sanitize-filename");

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
		'media passthrough route': '/media',
		'media passthrough path': '/media',
		'video passthrough route': '/direct',
		'video passthrough path': '/media',
		'port': 7001,
		'host': 'localhost'
	}
	
	this.version = require('./package.json').version;
	
	this.channels = {};
	this.servers = {};
	this.programs = {};
	this.proxies = [];
	this.streams = {};
	this.lib = false;
	
	// source and stream libs
	this.Source = this.import('lib/source');
	this.Stream = this.import('lib/stream');
	/**
	 * Channel management
	 * var myChannel = new ss.Channel('8', properties);
	 * */
	this.Channel =  require('./lib/channel.js')(this);
	this.Presets =  require('./lib/presets.js')(this);
	
}
 
 snowstreams.prototype.init = function(opts, callback) {
	if(!_.isArray(opts.adapters)) {
		console.log('No adapter configs found! ');
		//process.exit();
		//return false;
		opts.adapters = [];
	}
	debug('init! ');
	this.channelPort = opts.channelPort || 13000;
	this.host = opts.host ? this.set('host', opts.host || 'localhost').get('host') : this.get('host');
	this.port = opts.proxy.port? this.set('port', opts.proxy.port || 7001).get('port') : this.get('port');
	
	this.uri = this.host + ':' + this.port;
	
	this.mediaPath = opts.mediaPath || path.join(this.get('module root'), 'media');
	fs.emptyDir(path.join(this.mediaPath,'channels'), (err) => {
		if(err) debug('Error emptuing / creating mediaPath dir for channels', err);
	
		this.fillers = [
			/*{name: 'River', 
			file: path.join(Broadcast.get('module root'), 'lib/assets/waterfall.mp4'),
			videoFilters: {
				filter: 'drawtext',
				options: {
					fontfile: '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
					text: 'TestText',
					fontcolor: 'white',
					fontsize: 24,
					box: 1,
					boxcolor: 'black@0.75',
					boxborderw: 5,
					x: '(w-text_w)/2',
					y: '(h-text_h)/2'
				}
			},
			onlyOptions: []
		},*/
		{
			name: 'River', 
			file: path.join(Broadcast.get('module root'), 'lib','assets','river.mp4'),
		}];
		
		if(opts.proxy) {
			if(opts.proxy === true)  {
				opts.proxy = {};
			}
			this.Stream.proxy(opts.proxy, (err, result) => {
				if(err) console.log('ERROR', err);
				finish.call(this);
			});
		} else {
			 finish.call(this);
		}
		
	});
	
	function finish() {
		
		if(opts.adapters.length === 0) {
			if(_.isFunction(callback)) {
				callback();
			}	
			return;
		}
		debug('adapters! ');
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
	};
	
}

// send socket notifications
snowstreams.prototype.notify = function(emitter, data) {
	process.nextTick(() => {
		this.lodge.emit(emitter, data);
	});
}

// options and utils
_.extend(snowstreams.prototype, require('./lib/core/options')());
// standalone server
_.extend(snowstreams.prototype, require('./lib/core/createServer')());
// keystone server
_.extend(snowstreams.prototype, require('./lib/core/keystone')());

snowstreams.prototype.addChannel = function(channel, opts) {
	delete this.channels[channel];
	return new Promise((resolve, reject) => { 
		this.channels[channel] = new this.Channel(channel, opts, (err, c) => {
			this.channels[channel] = c;
			if(err) return reject(err);
			
			Broadcast.notify('channels', Broadcast.socketListeners.channels());
			return resolve(this.channels[channel]);
		});
	});
}

snowstreams.prototype.addProgram = function(program, opts, callback) {
	opts.name = program;
	return this.programs[program] = new this.Source.Program(opts, (err, data) => {
		if(_.isFunction(callback)) {
			callback(err, data);
		}
		debug(this.programs)
		return data;
	});
	
}

snowstreams.prototype.randomName = function(pre) {
	return sanitize((pre || '') + (+new Date).toString(36).slice(-15)).replace(/\s/g, "");;
}

var Broadcast = new snowstreams();

Object.defineProperty(Broadcast, 'filler', {
    get: () => { 
		let num = Date.now();
		return Broadcast.fillers[0];
	}
});

/**
 * The exports object is an instance of snowstreams.
 *
 * @api public
 */

module.exports = Broadcast;
