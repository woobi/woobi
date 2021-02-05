var debug = require('debug')('woobi:main');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Adapter = require('./lib/core/adapter');
var fs = require('fs-extra');
var sanitize = require('sanitize-filename');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Broadcast;

var moduleRoot = (function(_rootPath) {
	var parts = _rootPath.split(path.sep);
	parts.pop(); //get rid of /node_modules from the end of the path
	return parts.join(path.sep);
})(module.paths[0]);

var Woobi = function() {
	
	EventEmitter.call(this);
	
	this._options = {
		name: 'woobi',
		'module root': moduleRoot,
		moduleRoot: moduleRoot,
		'media passthrough route': '/media',
		'media passthrough path': '/media',
		'video passthrough route': '/direct',
		'video passthrough path': '/direct',
		port: 8337,
		proxy: false,
		host: 'localhost',
		'proxy api': '/woobi',
		env: process.env.ENV || 'production',
		artStringReplace: function(art) {
			//console.log(art);
			art = art.replace('Z:', 'http://localhost:8337/woobi/media');
			return art.replace(/\\/g, '/');
		},
		videoStringReplace: function(art) {
			art = art.replace('Z:', 'http://localhost:8337/woobi/direct');
			return art.replace(/\\/g, '/');
		},
		'keep open': false,
		'session secret': 'asdfnu8e73q2fh9q8wegf7qawfe'
	}
	
	this.version = require('./package.json').version;
	
	this.channels = {};
	this.servers = {};
	this.programs = {};
	this.proxies = [];
	this.streams = {};
	this.libs = {};
	this.nextSocketId = 0;
	
	// source and stream libs
	this.Source = this.import('lib/source');
	this.Stream = this.import('lib/stream');
	/**
	 * Channel management
	 * var myChannel = new ss.Channel('8', properties);
	 * */
	this.Channel =  require('./lib/channel.js')(this);
	this.Presets =  require('./lib/presets.js')(this);
	
	Broadcast = this;
	
	return this;
}

// attach the event emitter
util.inherits(Woobi, EventEmitter);

Woobi.prototype.init = function (opts, callback) {
	
	return new Promise ((resolve, reject) => {
		if(!_.isArray(opts.adapters)) {
			debug('No adapter configs found!');
			opts.adapters = [];
		}
		debug('init! ');
		
		Object.assign(this._options, opts);
		
		debug('init! ', opts);
		
		this.channelPort = opts.channelPort || 13000;
		this.host = opts.host ? this.set('host', opts.host || 'localhost').get('host') : this.get('host');
		
		if ( typeof opts.proxy === 'object' ) {
			this.port = opts.proxy.port? this.set('port', opts.proxy.port || 7001).get('port') : this.get('port');
		} else {
			this.port = this.get('port');
		}
		
		this.uri = this.host + ':' + this.port;
		// where to save files
		this.mediaPath = opts.mediaPath || path.join(this.get('module root'), 'media');
		this.dvrPath = opts.dvrPath || path.join(this.mediaPath, 'dvr');
		
		fs.ensureDir(path.join(this.mediaPath,'channels'), (err) => {
			if(err) debug('Error creating mediaPath dir for channels', err);
		
			this.fillers = [{
				name: 'woobi', 
				image: true,
				inputOptions: '',
				videoFilters: {
					filter: 'drawtext',
					options: {
						//fontfile: '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
						text: 'woobi will continue streaming soon',
						fontcolor: 'white',
						fontsize: 100,
						box: 1,
						boxcolor: 'black@0.25',
						boxborderw: 25,
						x: '(w-text_w)',
						y: '(h-text_h)/2'
					}
				},
				file: path.join(Broadcast.get('module root'), 'lib','assets','fill.jpg'),
			}];
			
			this.filler = this.fillers[0];
			this.apad = path.join(Broadcast.get('module root'), 'lib','assets','bg1.mp3')
			if ( opts.proxy ) {
				debug('got opts.proxy', opts.proxy)
				if ( opts.proxy === true )  {
					opts.proxy = {};
				}
				// serve our webpages via our server or through a supplied express app
				this.Stream.proxy.server(opts.proxy, (err, result) => {
					if(err) console.log('ERROR', err);
					this.set( 'keep open', true );
					finish.call( this );
				});
			} else {
				 finish.call( this );
			}
			
		});
	
		function finish ( ) {
			
			if(opts.adapters.length === 0) {
				opts.adapters = [];
			}
			debug('adapters! ');
			// set the correct library adapters
			async.forEach(opts.adapters,
				(v, next) => {
					debug(v);
					if(v.name) {
						this.libs[v.name] = Adapter(this, v, (err, adapted) => {
							debug(v.name + ' Adapter configured');
							next(null, adapted);
						});
					} else next();
				},
				(err) => {
					debug('Init finished');
					if (opts.loadSaved === true) {
						this.libs._mongo.ChannelConfig.model.find({ autostart: true }).lean().exec((err, docs) => {
							debug('start saved channels', err);
							if (docs) {
								docs.forEach(c => {
									let channel = JSON.parse(c.config);
									this.addChannel(c.name, channel)
									.catch(e => {
										debug('error starting', e);
									});
								});
							} 
							if(_.isFunction(callback)) {
								callback();
							}
							resolve();
						});
					} else {
						if (_.isFunction(callback)) {
							callback();
						}
						resolve();
						return; 
					}
				} 
			);
		}
	}); //end promise
}

// send socket notifications
Woobi.prototype.notify = function(emitter, data) {
	//debug(emitter, data)
	if ( this.lodge ) {
		process.nextTick(() => {
			this.lodge.emit(emitter, data);
		});
	}
	this.emit( emitter, data );
}

// options and utils
_.extend(Woobi.prototype, require('./lib/core/options')());
// standalone server
_.extend(Woobi.prototype, require('./lib/core/createServer')());

Woobi.prototype.addChannel = function(channel, opts) {
		
	return new Promise((resolve, reject) => { 
		
		debug('Add Channel ' + channel);
		
		if (this.channels[channel]) {
			return reject('Channel exists');
		}
		this.channels[channel] = new this.Channel(channel, opts, (err, c) => {
			this.channels[channel] = c;
			
			if(err) return reject(err);
			
			debug('Added Channel ' + channel); 
			if ( Broadcast._options.proxy ) {
				Broadcast.notify('channels', Broadcast.socketListeners.channels());
			}
			
			return resolve(this.channels[channel]);
		
		});
	});
}

Woobi.prototype.addProgram = function(program, opts, callback) {
	opts.name = program;
	return this.programs[program] = new this.Source.Program(opts, (err, data) => {
		if(_.isFunction(callback)) {
			callback(err, data);
		}
		debug(this.programs)
		return data;
	});
	
}

Woobi.prototype.randomName = function(pre) {
	return sanitize((pre || '') + (+new Date).toString(36).slice(-15)).replace(/\s/g, "");;
}




/**
 * The exports object is an instance of Woobi.
 *
 * @api public
 */

module.exports = Woobi;
