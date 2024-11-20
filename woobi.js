require('dotenv').config()
var debug = require('debug')('woobi:main');
//debug.log = debug.bind(console);
var _ = require('lodash');
var path = require('path');
var async = require('async');
var Adapter = require('./lib/core/adapter');
var fs = require('fs-extra');
var sanitize = require('sanitize-filename');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Woobi;

process.setMaxListeners(125);

var moduleRoot = (function(_rootPath) {
	var parts = _rootPath.split(path.sep);
	parts.pop(); //get rid of /node_modules from the end of the path
	return parts.join(path.sep);
})(module.paths[0]);
/**
 * @class
 * 
 */
var Broadcast = function() {
	
	EventEmitter.call(this);
	
	/**
	 * @contructor
	 */
	//debug = debug;

	this._options = {
		name: 'Broadcast',
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
		loadSaved: false,
		loadSavedExclude: [],
		savedConfigs: [],
		adapters:[]
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
	//debug('Import methods')
	this.Source = this.import('lib/source');
	this.Stream = this.import('lib/stream', this);
	/**
	 * Channel management
	 * var myChannel = new ss.Channel('8', properties);
	 * */
	this.Channel =  require('./lib/channel.js')(this);
	this.Presets =  require('./lib/presets.js')(this);
	
	debug('## ## ## ## ## ## ## ## ## ## ## ## ## ## ');
	debug('##');
	debug('## ##');
	debug('## ## ## Woobie Created');
	debug('## ## ## ## ## ## ## ## ## ##       ## ## ');
	debug('## ## ## ## ## ## ## ## ## ## ## ## ## ## ');
	//debug(this.get('host'))
	return this;
}

// attach the event emitter
util.inherits(Broadcast, EventEmitter);

// options and utils
_.extend(Broadcast.prototype, require('./lib/core/options')());
/**
 *  @method
 * @param {*} opts 
 * @param {*} callback 
 */
Broadcast.prototype.init = function (options, callback) {
	
	return new Promise ((resolve, reject) => {
		
		debug('## ', 'Start Woobi', '## ', );
		var opts = {
			...this._options,
			...options
		}
		
		this._options = opts;
				
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
		this.wobbles = this._options.channels //whatever channels will be called
		this.wobble = this._options.channel // same but for single
		this.wobblePath = path.join(this.mediaPath, this.wobbles) // place to store the hls files for streaming and the json config files for channels
		
		// create the filler settings for transitions
		fs.ensureDir(this.wobblePath, (err) => {
			if(err) debug('Error creating mediaPath dir for wobbles', err);
			
			this.fillers = [{
				name: 'Waiting for a source', 
				_default: false,
				debug: false,
				overlay: false,
				videoFilters1: {
					filter: 'drawtext',
					options: {
						//fontfile: '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
						text: 'woobi will continue streaming soon',
						fontfile: path.join(this.get('module root'), 'lib','assets','Chalkboy.ttf'), 
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
				metadata:{},
				file: opts.filler ? opts.filler : path.join(this.get('module root'), 'lib','assets','river.mp4'),
				/*stream: this.Source.Fluent({
					name: 'fillerStream',
					loop: true,
					file: fillfile,
					metadata: {},
					encode: true,
					//progress: true
				}).stream,
				*/
				
			}];
			
			// filler vid used to go between programs
			// text can be changed to the program name
			this.filler = this.fillers[0];
			// create a test video to push immediately to the broadcaster on end
			/*this.quickFill = this.Source.Fluent({
				name: 'fillerStream',
				loop: true,
				file: opts.quickFillFIle ? opts.quickFillFIle : path.join(this.get('module root'), 'lib','assets','river.mp4'),
				metadata: {},
				encode: true,
				//progress: true
			})*/
			// a simple audio file to overlay any videos without an audio stream.
			this.apad = path.join(this.get('module root'), 'lib','assets','bg1.mp3')

			if ( opts.proxy ) {
				//debug('got opts.proxy', opts.proxy)
				if ( opts.proxy === true )  {
					opts.proxy = {};
				}
				// serve our webpages via our server or through a supplied express app
				this.Stream.proxy.server(opts.proxy, (err, result) => {
					if(err) console.log('ERROR', err);
					this.set( 'keep open', true );
					if(!err) {
						debug('####   Server Started  ####');
						debug('##   ' + this.host + ':' + this.port + '/status');
						debug('## ## ## ## ## ## ## ## ## ## ## ## ## ## ');
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
			debug('Loop through adapters and add new libraries to the object');
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
					/* load saved configs if requested */
					let filenames = fs.readdirSync(this.wobblePath);				
					//debug('get saved channels configs');
					filenames.filter(r => path.extname(r) == '.json' ).forEach(file => { 
						let channel = fs.readJsonSync(path.join( this.wobblePath, file), { throws: false })
						//debug(channel)
						if(channel) {
							if (opts.loadSaved === true && !opts.loadSavedExclude.includes(path.basename(file, '.json'))) {
								debug('load saved channels config', channel.id);
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
							}
							debug('save config file for later', channel.channel)
							this._options.savedConfigs.push(channel);
						}
							
					}); 
					
					if(_.isFunction(callback)) {
						callback();
					}
										
					
					debug('## Initialized  ');
					
					return resolve(); 
					
				} 
			);
		}
	}); //end promise
}

/**
 * @method
 * @param {*} str 
 */
// use camelCase for ids and filenames
Broadcast.prototype.camelCaseSanitize = function camelCase(str) { 
	return sanitize(str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) 
	{ 
		return index == 0 ? word.toLowerCase() : word.toUpperCase(); 
	}).replace(/\s+/g, '')); 
} 

/**
 * notify
 * @method
 * @param {*} emitter 
 * @param {*} data 
 */
// send socket notifications
Broadcast.prototype.notify = function(emitter, data) {
	//debug(emitter, data)
	if ( this.lodge ) {
		process.nextTick(() => {
			this.lodge.emit(emitter, data);
		});
	}
	this.emit( emitter, data );
}

// standalone server
_.extend(Broadcast.prototype, require('./lib/core/createServer')());

/**
 * addChannel
 * @method
 * @param {*} channel 
 * @param {*} opts 
 */
Broadcast.prototype.addChannel = function(channel, opts) {
	
	channel = this.camelCaseSanitize(channel);
	
	return new Promise((resolve, reject) => { 
		
		debug('Add Channel ' + channel);
		
		if (this.channels[channel]) {
			return reject('Channel exists');
		}
		this.channels[channel] = new this.Channel(channel, opts, (err, c) => {
			this.channels[channel] = c;
			
			if(err) return reject(err);
			
			//debug('Added Channel ' + channel); 
			if ( this._options.proxy ) {
				this.notify('channels', this.socketListeners.channels());
			}
			c.state.current = 'Stop';
			
			
			debug('## ## ## Channel Added  ## ## ## ## ## ##  ');
			debug('##');
			debug('##   ' + channel);
			debug('##   ' + this.host + ':' + this.port + '/' + c.id);
			debug('##');
			debug('## ## ## ## ## ## ## ## ## ## ## ## ## ## ');
			return resolve(this.channels[channel]);
		
		});
	});
}

/**
 * addProgram
 * @method
 * @param {*} program 
 * @param {*} opts 
 * @param {*} callback 
 */
Broadcast.prototype.addProgram = function(program, opts, callback) {
	opts.name = program;
	return this.programs[program] = new this.Source.Program(opts, (err, data) => {
		if(_.isFunction(callback)) {
			callback(err, data);
		}
		debug(this.programs)
		return data;
	});
	
}
/**
 * 
 * randomName
 * @method
 * @param {*} pre 
 */
Broadcast.prototype.randomName = function(pre) {
	return sanitize((pre || '') + (+new Date).toString(36).slice(-15)).replace(/\s/g, "");;
}


/** 
 * Manage broadcast channels
 * @module Broadcast 
 * 
 * */

module.exports = Broadcast;
