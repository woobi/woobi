require('dotenv').config()
var debug = require('debug')('woobi:main');
//debug.log = console.info.bind(console);
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Adapter = require('./lib/core/adapter');
var fs = require('fs-extra');
var sanitize = require('sanitize-filename');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Broadcast;

process.setMaxListeners(125);

var moduleRoot = (function(_rootPath) {
	var parts = _rootPath.split(path.sep);
	parts.pop(); //get rid of /node_modules from the end of the path
	return parts.join(path.sep);
})(module.paths[0]);

var Woobi = function() {
	
	EventEmitter.call(this);
	
	
	//console.info = debug;

	this._options = {
		name: 'woobi',
		'module root': moduleRoot,
		moduleRoot: moduleRoot,
		'media passthrough route': '/media',
		'media passthrough path': '',
		'video passthrough route': '/direct',
		'video passthrough path': '',
		port: 8337,
		proxy: false,
		host: 'localhost',
		'proxy api': '/woobi',
		env: process.env.ENV || 'production',
		artStringReplace: function(art) {
			//console.log(art);
			if(!art) return '';

			art = art.replace('Z:', 'http://localhost:8337/woobi/media');
			return art.replace(/\\/g, '/');
		},
		videoStringReplace: function(art) {
			if(!art) return '';
			art = art.replace('Z:', 'http://localhost:8337/woobi/direct');
			return art.replace(/\\/g, '/');
		},
		'keep open': false,
		'session secret': 'asdfnu8e73q2fh9q8wegf7qawfe',
		channels: 'channels',
		channel: 'channel',
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
	debug('IMport methods')
	this.Source = this.import('lib/source');
	this.Stream = this.import('lib/stream', this);
	/**
	 * Channel management
	 * var myChannel = new ss.Channel('8', properties);
	 * */
	this.Channel =  require('./lib/channel.js')(this);
	this.Presets =  require('./lib/presets.js')(this);
	
	Broadcast = this;
	console.info('#### Woobie Created ##########################################');
	console.info('##');
	console.info('##');
	
	return this;
}

// attach the event emitter
util.inherits(Woobi, EventEmitter);

// options and utils
_.extend(Woobi.prototype, require('./lib/core/options')());

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
		this.proxyRoot = this._options['proxy api'];
		this.wobbles = this._options.channels
		this.wobble = this._options.channel
		this.wobblePath = path.join(this.mediaPath, this.wobbles)
		
		fs.ensureDir(this.wobblePath, (err) => {
			if(err) debug('Error creating mediaPath dir for wobbles', err);
		
			this.fillers = [{
				name: 'filler', 
				_default: true,
				debug: false,
				encode: true,
				videoFilters: {
					filter: 'drawtext',
					options: {
						//fontfile: '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
						text: 'woobi will continue streaming soon',
						fontfile: path.join(Broadcast.get('module root'), 'lib','assets','Chalkboy.ttf'), 
						fontcolor: 'white',
						fontsize: 50,
						box: 1,
						boxcolor: 'black',
						boxborderw: 25,
						//w: 'w',
						//h: 200,
						x: '(w-text_w)/2',
						y: '(h-text_h)-10'
					}
				},
				file: path.join(Broadcast.get('module root'), 'lib','assets','river.mp4'),
			}];
			// filler vid used to go between programs
			// text can be changed to the program name
			this.filler = this.fillers[0];
			// a simple audio file to overlay any videos without an audio stream.
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
					if(!err) {
						console.info('#### Server Started ');
						console.info('##');
						console.info('##   ' + this.host + ':' + this.port + '/status');
						console.info('##');
					}
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
					//debug('Init finished');
					if (opts.loadSaved === true) {
						debug('start saved channels');
						let filenames = fs.readdirSync(Broadcast.wobblePath);
						filenames.filter(r => path.extname(r) == '.json').forEach(file => { 
							let channel = fs.readJsonSync(path.join( Broadcast.wobblePath, file), { throws: false })
							//debug(channel)
							let clone = { ...channel };
							delete clone.files;
							delete clone.currentSources;
							delete clone.currentHistory;
							this.addChannel(channel.channel, {
								...clone,
								files: channel.currentSources || channel.files
							})
							.catch(e => {
								debug('error starting', e);
							}); 
						}); 
						
						if(_.isFunction(callback)) {
							callback();
						}
						return resolve();
						
					} else {
						if (_.isFunction(callback)) {
							callback();
						}
						console.info('##');
						console.info('#### Initialized  ');
						console.info('##');
						resolve();
						return; 
					}
				} 
			);
		}
	}); //end promise
}

// use camelCase for ids and filenames
Woobi.prototype.camelCaseSanitize = function camelCase(str) { 
	return sanitize(str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) 
	{ 
		return index == 0 ? word.toLowerCase() : word.toUpperCase(); 
	}).replace(/\s+/g, '')); 
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

// standalone server
_.extend(Woobi.prototype, require('./lib/core/createServer')());

Woobi.prototype.addChannel = function(channel, opts) {
	
	channel = this.camelCaseSanitize(channel);
	
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
			console.info('##');
			console.info('#### Channel Added ');
			console.info('##');
			console.info('##   ' + channel);
			console.info('##   ' + this.host + ':' + this.port + '/' + c.id);
			console.info('##');
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
