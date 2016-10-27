var	_ = require('lodash');
var	debuger = require('debug')('snowstreams:lib:channel');
var async = require("async");
var hat = require('hat');
var path = require('path');
var fs = require('fs-extra');

module.exports = function(Broadcast) {
	
	function Channel(channel, options) { 
		
		if (!(this instanceof Channel)) return new Channel(channel, options);
		
		if(!_.isObject(options)) {
			options = {};
		}
		var _this = this;
		
		this.debug = options.noDebug ? function(){} : debuger;
		
		this.options = _.clone(options);
		
		this.debug(channel + ' - ' +'new Channel ', channel);	
		
		//_.defaults(this, options);
		
		this.channel = channel;
		this.name = channel;
		this.state = {
			current: 'construct'
		}	
		
		// our sources are pulled from here and removed from the array
		// after initializing our sources we set a _loop copy to use if loop is requested
		this.sources = [];
		this._loop = [];
		
		if(options.file) {
			this.addSource.call(this, options.file);
		}
		
		if(Array.isArray(options.files)) {
			options.files.forEach(this.addSource.bind(this));
		}
		
		this.noTransition = options.noTransition === true ? true : false;
		this.filler = options.filler || Broadcast.filler;	
		this.transition = false;
		this.currentSource = false;
		this.loop = options.loop;
		
		this.end = [];
		
		// helper add functions
		this.helpers = {};
		_.each(Broadcast.import('lib/channel-helpers'), (v, k) => { this.helpers[k] = v.bind(this); });
		
		// asset banks
		this.programs = [];
		this.udpStreams = [];
		this.udpSinks = [];
		this.hls = [];
		
		// an open stream to add our content
		// this broadcast stream should only end with explicit instructions
		this.stream = this.broadcast = Broadcast.Stream.bridge();
		this.streamRestart = [];
		setInterval(() => {
			if(!Broadcast.isReadableStream(this.stream)) {
				debug('Broadcast Stream Died. Run restart routines');
				this.stream = this.broadcast = Broadcast.Stream.bridge();
				debug(' isReadableStream', Broadcast.isReadableStream(this.stream));
				this.streamRestart.forEach((s) => {
					if(_.isFunction(s)) {
						s(this.stream);
					}
				});
			}
		}, 500);
		
		// master link
		this.link = 'http://' + Broadcast.host + ':' + Broadcast.port + '/alvin/channel/' + this.channel;
		this.url = '/alvin/channel/' + this.channel;
		// other links
		this.links = {
			local: '/alvin/channel/' + this.channel,
			unicast: 'http://' + Broadcast.host + ':' + Broadcast.port + '/alvin/channel/' + this.channel,
			hls: [],
			udpSink: [],
			udpStream: []
		};
		this.commands = {
			sockets: options.socketCommands || [],
			request: options.requestCommands || [],
			link: options.linkCommands || []
		};
		
		// run through the options
		var assets = Array.isArray(options.assets) ? options.assets : [options.assets];
		let hls = [];
		async.forEachSeries( assets, (asset, next) => {
			if(!_.isFunction(this.helpers[asset.type])) {
				this.debug('No helper found for ' + asset.name, asset.type, asset);
				return next();
			}
			if(asset.type === 'hls') {
				this.debug('HLS asset found.  Saving for last');
				hls.push(asset);
				return next();
			}
			
			this.helpers[asset.type](asset).then(() => {
				this.debug('Done with ' + asset.name + '. Moving to next');
				next() 
			}).catch(e => {
					this.debug('Error from asset', asset.type, e);
					next();
			});
			
		}, (er) => {
			this.debug('Done loading assets. Playing the channel and creating any  HLS streams', hls.length, options.assets.length);
			
			this.play();
			async.forEachSeries( hls, (asset, next) => {
				this.helpers.hls(asset).then(() => {
					this.debug('Done loading HLS stream ' + asset.name);
					next();
				}).catch((e) => {
					this.debug('Error loading HLS stream ' + asset.name, e);
					next();	
				});
			}, () => {
					this.debug('Channel Ready!!');
					Broadcast.notify('channels', Broadcast.socketListeners.channels());
			});
			
		}); 
			
	}
	
	
	/**
	 * Add a source
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.setState = function(state, callback) {	
		
		//this.debug(this.channel + ' - ' +'set State', this.state);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}
		if(_.isString(state)) {
			state = {
				current: state
			}
		}
		
		if(!state.current) {
			callback('current key required for object');
			return false;
		}	
		
		state.prev = this.state.current;
		
		this.state = state;
		callback(null, this.state);
		return this.state;		
	}
	
	/**
	 * Add a source
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.addSource = function(source, callback) {	
		
		this.debug(this.channel + ' - ' +'Add Source to Channel', source.name);
		
		this.sources.push(source);
		this._loop.push(source);
		
		if(!_.isFunction(callback)) {
			return this;
		} else {
			return callback();
		}
		
	}
	Channel.prototype.push = Channel.prototype.addSource;
	
	/**
	 * Remove a source or stream asset
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.removeSource = function(name, callback) {
		_.pullAllBy(this.sources, [{ name: name }], 'name');
		_.pullAllBy(this._loop, [{ name: name }], 'name');
		if(!_.isFunction(callback)) {
			return;
		} else {
			return callback();
		}
	}
	Channel.prototype.pull = Channel.prototype.removeSource;
	/**
	 * Get a source asset
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.getSource = function(name, callback) {
		
		var asset = _.find(this.sources, { name: name });
		
		if(!_.isFunction(callback)) {
			return asset;
		} else {
			return callback(null, asset);
		}
		
	}
	Channel.prototype.source = Channel.prototype.getSource;
	
	/**
	 * Actioners
	 * 
	 * */

	Channel.prototype.throttle = function(source, rate, onEnd) {
		this.debug('Start Throttle for ' + source.name);
		var trottle = Broadcast.Stream.broadcast(source, rate, onEnd).pipe(this.stream, { end: false});
	}
	 
	// crash
	Channel.prototype.crash = function(Asset, forced) {
		this.currentSource = false;
		this.setState('Crashed');
	}
	
	// Stop
	Channel.prototype.stop = function(callback) {
		this.debug(this.channel + ' - ' +'run stop');
		this.setState('Stop');
		if(_.isFunction(this.currentSource.end)) {
			this.currentSource.end();
		}
	}
	
	// nextSource
	Channel.prototype.nextSource = function() {
		
		if(this.state.current === 'Stop') return;
		this.setState('Next Source');
		
		this.debug(this.channel + ' - ' +'run nextSource');
		//this.currentSource = false;
		
		if(this.hls1) {
			this.debug(this.hls.segmentFile);
			if(this.hls.segmentFile) {
				fs.appendFile(this.hls.segmentFile, "\n#EXT-X-DISCONTINUITY", (err) => {
					if(err) this.debug('ERROR', err);
					this.debug('wrote block');
				});
			}
		}
		
		// play the next file after a transition
		if(this.transition || this.noTransition) {
			this.sources.shift();
			this.transition = false;
			this.play();
		} else {
			this.transition = true;
			var file = _.clone(this.filler);
			file.name = 'Transition with ' + this.filler.name
			this.play(file);
		}
	}
	
	// Play
	Channel.prototype.play = function(playThis) {
		
		if(this.state.current === 'Stop') return;
		this.setState('Play');
				
		var source = playThis || this.sources[0];
		
		if(!source) {
			if(this.loop) {
				this.sources = this._loop.map(r => r);
				return this.play();
			} else {
				source = this.filler;
			}
		}
		
		source.channel = this.channel;
		
		if(!source.noDebug) {
			// respect channel debug
			source.noDebug = this.options.noDebug;
		}
		// push the next source on end
		source.end = this.nextSource.bind(this);
		
		// we can accept a program to pipe a stream through
		if(source.program) {
			// create the source stream from a File
			this.currentSource = new Broadcast.Source.Program(source.program, (err, program) => {
				if(err) {
					this.debug(err);
					this.debug(this.channel + ' - ' +'Program failed to deliver a usable stream. Moving to next n queue...');
					return this.nextSource.call(this);
				}
				if(!Broadcast.isReadableStream(program.stream)) {
					this.debug(this.channel + ' - ' +'Program failed to deliver a usable stream. Moving to next n queue...');
					return this.nextSource.call(this);
				}
				
				this.debug(this.channel + ' - ' +'Playing ' + program.name);
				
				// alert the channel update
				Broadcast.notify('channels', Broadcast.socketListeners.channels());
				
				program.stream.on('data', data => this.broadcast.write(data));
				//program.stream.pipe(this.broadcast, { end: false});
				
				this.end.push({name: program.name, end: program.end});

			});

			return;
		}	
		
		// we can accept a ready stream
		if(Broadcast.isReadableStream(source.stream) && !source.fluent) {
			this.debug(this.channel + '  -  ' +' Playing stream for ' + source.name);
			this.currentSource = source;
			// alert the channel update
			Broadcast.lodge.emit('channels', Broadcast.socketListeners.channels());
			// play stream
			source.stream.on('data', data => this.broadcast.write(data));
			source.stream.on('end', source.end);
			
			this.end.push({name: source.name, end: source.close})

			return;
		}
		
		if(!source.file) {
			console.log('No File or Stream found. Moving to next in queue... ', this.channel);
			return this.nextSource();
		}
		
		// create the source stream from a File
		this.currentSource = new Broadcast.Source.Fluent(source, (err, fluent) => {
			if(err) {
				this.debug(this.channel + ' - ' +'File failed to deliver a usable stream. Moving to next n queue...');
				return this.nextSource.call(this);
			}
			if(!Broadcast.isReadableStream(fluent.stream)) {
				this.debug(this.channel + ' - ' +'File failed to deliver a usable stream. Moving to next n queue...');
				return this.nextSource.call(this);
			}
			
			this.debug(this.channel + ' - ' +'Playing ' + fluent.name);
			
			this.end.push({name: fluent.name, end: fluent.end});
			
			// alert the channel update
			Broadcast.notify('channels', Broadcast.socketListeners.channels());
			
			//source.stream.pipe(this.broadcast, { end: false});
			fluent.stream.on('data', data => this.broadcast.write(data));
			// throttle takes care of pushing our stream to broadcast
			//this.throttle(source, source.bitRate / 8, this.nextSource.bind(this));

		});
		
		
	}
	Channel.prototype.start = Channel.prototype.play;
	
	// Pause
	Channel.prototype.pause = function(callback) {
		this.setState('Pause');
	}
	
	// Force a source now
	Channel.prototype.force = function(source, keep = false) {
		this.setState({
			current: 'Forcing Source',
			source: source,
		});
		this.debug(this.channel + ' - ' +'Try and Force  source ' + source.name);

		this.sources.unshift(source);
		this._loop.unshift(source);
		if(_.isFunction(this.currentSource.end)) { 
			//this.currentSource.end();
		} else {
			//this.play();
		}
		
		
	}
	
	// KILL
	Channel.prototype.KILL = function(callback) {
		this.debug(this.channel + ' - ' +'run KILL');
		this.setState('Stop');
		if(!_.isFunction(callback)) {
			callback = () => {};
		}
		this.stop();
		this.debug(this.end.length)
		async.forEach(this.end, (fn, finish) => {
			if(_.isFunction(fn.end)) {
				this.debug('STOP ' + fn.name);
				fn.end(finish);
			} else {
				finish();
			}
		}, () => {
			delete this.sources;
			delete this.streams;
			delete this.programs;
			delete this._loop;
			callback();
		});
		return true
	}
	
	// RESTART
	Channel.prototype.RESTART = function() {
		this.debug(this.channel + ' - ' +'get RESTART config');
		this.setState('RESTART');
		return this.options;
	}
	
	return Channel;
}
