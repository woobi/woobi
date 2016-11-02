var	_ = require('lodash');
var	debuger = require('debug')('snowstreams:lib:channel');
var async = require("async");
var hat = require('hat');
var path = require('path');
var fs = require('fs-extra');
var findRemoveSync = require('find-remove');
var Transform = require('stream').Transform;
var GrowingFile = require('growing-file');

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
		
		// an open stream to add our content
		// this broadcaster stream should only end with explicit instructions
		this.broadcaster = new Broadcast.Stream.bridge();
		this.stream =this.broadcaster;
		this.streamRestart = [];
		setInterval(() => {
			if(!Broadcast.isReadableStream(this.stream)) {
				this.debug('Broadcast Stream Died. Run restart routines', this.broadcaster);
				this.stream = this.broadcaster = Broadcast.Stream.bridge();
				this.debug(' isReadableStream', Broadcast.isReadableStream(this.stream));
				this.streamRestart.forEach((s) => {
					if(_.isFunction(s)) {
						s(this.stream);
					}
				});
			}
		}, 50000);
		
		this.sources = []; // the first source gets filtered
		this._sources = this.sources.map(r=>r);
		this.history = [];
		
		if(options.file) {
			this.addSource.call(this, options.file);
		}
		
		if(Array.isArray(options.files)) {
			options.files.forEach(this.addSource.bind(this));
		}
		
		this.noTransition = options.noTransition === true ? true : false;
		this.filler = options.filler || Broadcast.filler;	
		this.debug(Broadcast.filler);
		
		this.transition = this.noTransition ? false : true;
		this.currentSource = false;
		this.loop = options.loop;
		
		this.end = [];
		
		this.construct2(options);
		
	}
	 
	Channel.prototype.construct2 = function construct2(options) {	
		
		// helper add functions
		this.helpers = {};
		_.each(Broadcast.import('lib/channel-helpers'), (v, k) => { this.helpers[k] = v.bind(this); });
		
		// asset banks
		this.programs = [];
		this.udpStreams = [];
		this.streams = {};
		this.udpSinks = [];
		this._hls = [];
		this.hls = false; //bit set by hls type later
		
		// our assets
		var assets = Array.isArray(options.assets) ? options.assets : [options.assets]
		
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
		if(options.nostream) {
			delete this.links.local;
			delete this.links.unicast;
		}
		this.commands = {
			sockets: options.socketCommands || [],
			request: options.requestCommands || [],
			link: options.linkCommands || []
		};
		
		this.mediaPath = path.join(Broadcast.mediaPath, 'channels', this.channel);
		this.hlsFile = path.join(this.mediaPath, this.channel + '.m3u8');
		this.hlsFile1 = path.join(this.mediaPath, this.channel + 'BB.m3u8');
		
		// remove the old files
		fs.emptyDirSync(this.mediaPath);
		
		this.writeToHLS = (data, done) => {
			fs.appendFile(this.hlsFile, data,  (err) => {
				this.debug('write to m3u8', data, err);
				if(done) done(err);
			});
		}		
		
		// run through the options;
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
			// play if nostream === false
			
			if(!options.nostream) {
				//HKS.call(this);
			} else {
				//HKS.call(this)
			}
			this.firstPlay(HKS.bind(this));
			function HKS() {	
				this.debug('loading HLS stream ' + hls);

					async.forEachSeries( hls, (asset, next) => {
						if(asset.hls !== true) {
							
							this.helpers.hls(asset).then(() => {
								this.debug('Done loading HLS stream ' + asset.name);
								next();
							}).catch((e) => {
								this.debug('Error loading HLS stream ' + asset.name, e);
								next();	
							});
						
						} else {
							this.debug('main HLS stream ');
							// main hls file. uses the channel stream
							this.hls = true;
							this.hlsLink = 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', 'alvin', 'play', 'hls',  this.channel, this.channel + '.m3u8');
							this.links.hls.push(this.hlsLink);
							// start the hls file
							//this.writeToHLS('#EXTM3U\n#EXT-X-VERSION:4\n\n');
							this.playHLS();
							next();
						
						}
					}, () => {
							this.debug('Channel Ready!!', this.hls);
							//this.playTransition();
							Broadcast.notify('channels', Broadcast.socketListeners.channels());
					});
				
			}
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
	
	Channel.prototype.writeToMainHLS = function writeToMainHLS() {
			
		var uppercase = this.transformHLS = new Transform({decodeStrings: false, end: false, highWaterMark: 2, objectMode: true});
		let a = 1;
		uppercase._transform = (chunk, encoding, done) => {
			var string = chunk.toString();
			if(a === 1) {
				//string = string.replace('#EXTM3U', '#EXTM3U\n\n#EXT-X-PLAYLIST-TYPE:VOD\n');
				a=2;
			}
			if(this.DISCONTINUITY) {
				string += '\n#EXT-X-DISCONTINUITY\n\n';
				this.DISCONTINUITY = false;
			}
			
			done(null, string);
		};
		var target = this.hlsFileTarget = fs.createWriteStream(this.hlsFile);
		target.on('end', (e) => {
			this.debug(e, 'Write m3u8 ended');
		});
		
		var source = this.grabHLS = GrowingFile.open(this.hlsFile1,{
			timeout: 150000,
			interval: 1000,
			startFromEnd: false
		});
		source.on('error', (e) => {
			this.debug(e, 'Read m3u8 failed');
			
		});
		source.on('end', (e) => {
			this.debug(e, 'Read m3u8 ended');
		});
		
		source.pipe(uppercase, { end: false}).pipe(target, { end: false});

		
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
		this.sources = _.uniqBy(this.sources, 'name');
		this._sources.push(_.clone(source));
		
		if(!_.isFunction(callback)) {
			return this;
		} else {
			return callback();
		}
		
	}
	Channel.prototype.push = Channel.prototype.addSource;
	Channel.prototype.unshiftSource = function(source, callback) {	
		
		this.debug(this.channel + ' - ' +'Add Source to beginning', source.name);
		
		this.sources.unshift(source);
		
		if(!_.isFunction(callback)) {
			return this;
		} else {
			return callback();
		}
		
	}
	/**
	 * Remove a source or stream asset
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.removeSource = function(name, callback) {
		_.pullAllBy(this.sources, [{ name: name }], 'name');
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
	
	// playTransition
	Channel.prototype.playTransition = function() {
		if(this.transition || this.noTransition) {
			var shift = this.sources.shift();
			if(shift) {
				this.debug('Add ' + shift.name + '  to history');
				if (shift.bot !== true) this.history.unshift(shift);
				if(this.loop) {
					if (shift.bot !== true) this.sources.push(shift);
					this.debug('Move ' + shift.name + ' to bottom of list');
				}
			}			
			this.transition = false;
			if(this.hlsFileTarget) {
				this.hlsFileTarget.write('\n#EXT-X-DISCONTINUITY\n\n')
				//this.DISCONTINUITY = true;
			}
			this.play();
		} else {
			var file = _.clone(this.filler);
			file.name = 'Transition with ' + this.filler.name;
			let name =  this.sources[1] ?  this.sources[1].name : ''
			this.transition = true;
			if(this.hlsFileTarget) {
				this.hlsFileTarget.write('\n#EXT-X-DISCONTINUITY\n\n')
				//this.DISCONTINUITY = true;
			}
			this.play(file);
		}
					
	}
	
	// playHLS
	Channel.prototype.playHLS = function playHLS(file) {
		
		if(this._RUNNING_HLS) {	
			if(_.isFunction(this._RUNNING_HLS.end)) {	
				this.debug('end previous hls', this._RUNNING_HLS.name );
				return this._RUNNING_HLS.end(() => {
					finish.call(this, file)
				})
			} 
		}
		
		finish.call(this, file);
		
		function finish(file) {
			
			let source = file ? { metadata: { totalTimeInSeconds: 30 }, name: file.name, file: file.file } : this.sources[0] ? this.sources[0] : { metadata: { totalTimeInSeconds: 30 }, name: 'ua' };
			name = source.name || '';
			
			this.debug(' run hls helper for ' +  source.name);
			
			this.helpers.hls({ name: Broadcast.randomName(source.name), source: this.broadcaster, channel: this.channel }).then((hls) => {
				
				this.debug('Done loading HLS stream ' + hls.name);
				this._RUNNING_HLS = hls
				setTimeout(() => {
					this.writeToMainHLS();
				}, 100);
				//this.writeToHLS('#EXT-X-DISCONTINUITY\n#EXT-X-STREAM-INF:PROGRAM-ID=' + source.name + '\n' + hls.name + '.m3u8\n');
			
			}).catch((e) => {
				this.debug('Error loading HLS stream ' + name, e);
			});
		}
	}
	
	// prevSource
	Channel.prototype.prevSource = function(source) {
		
		if(this.state.current === 'Stop') return;
		this.setState('Previous Source');
		
		if(!source) {
			source = this.history[0];
		}
		
		var play = () => {
			// push the previous program to number 2.  
			// After the transition number 1 is removed and added to history.
			this.sources.splice(1, 0, source);
			this.playTransition();
		}
		
		this.debug(this.channel + ' - ' +'run prevSource');
		
		if(_.isFunction(this.currentSource.end)) { 
			this.debug(this.channel + ' - ' +' Try and stop the current stream ');
			this.currentSource.end(play.bind(this));
		} else {
			this.debug(this.channel + ' - ' +' The was not an end function. ');
			play();
		}	
	}
	
	// _nextSource
	Channel.prototype._nextSource = function() {
				
		/* 
		 * _nextSource should only be called internally from a source end function
		 *  use next to move to the next stream while a program is in progress
		 * */
		if(this.state.current === 'Stop') return;
		this.setState('Next Source');
		
		this.debug(this.channel + ' - ' +'run _nextSource');
		
		this.playTransition();
	}
	
	// next
	Channel.prototype.next = function(done) {
				
		if(this.state.current === 'Stop') return;
		
		var play = () => {
			this._nextSource();
		}
		//this.transition = true;
		if(_.isFunction(this.currentSource.end)) { 
			this.debug(this.channel + ' - ' +' Try and stop the current stream ');
			this.currentSource.end(play.bind(this));
		} else {
			this.debug(this.channel + ' - ' +' The was not an end function. ');
			play(false, done);
		}
		
	}
	Channel.prototype.nextSource = Channel.prototype.next;
	
	// First Play
	Channel.prototype.firstPlay = function(done) {
		this.play(false, done);
	}
	
	// Play
	Channel.prototype.play = function(playThis, done) {
		
		if(this.state.current === 'Stop') return;
		this.setState('Play');
		
		if(!done) {
			done = ()=>{};
		}
				
		var source = playThis || this.sources[0];
		
		if(!source) {
			if(this.loop) {
				this.sources = this._sources.map(r => r);
				if(this.sources.length > 0) {
					source = this.sources[0];
				} else{
					source = this.filler;
				}
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
		source.end = this._nextSource.bind(this);
		
		// we can accept a program to pipe a stream through
		if(source.program) {
			// create the source stream from a File
			this.currentSource = new Broadcast.Source.Program(source, (err, program) => {
				if(err) {
					this.debug(err);
					this.debug(this.channel + ' - ' +'Program failed to deliver a usable stream. Moving to next n queue...');
					return this._nextSource.call(this);
				}
				if(!Broadcast.isReadableStream(program.stream)) {
					this.debug(this.channel + ' - ' +'Program failed to deliver a usable stream. Moving to next n queue...');
					return this._nextSource.call(this);
				}
				
				this.debug(this.channel + ' - ' +'Playing ' + program.name);
				
				// alert the channel update
				Broadcast.notify('channels', Broadcast.socketListeners.channels());
				
				//program.stream.on('data', data => this.broadcaster.write(data));
				program.stream.pipe(this.broadcaster, { end: false});
				
				done();
				
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
			//source.stream.on('data', data => this.broadcaster.write(data));
			source.stream.on('end', source.end);
			source.stream.pipe(this.broadcaster, { end: false});
			
			this.end.push({name: source.name, end: source.close})
			
			return done();
			
		}
		
		if(!source.file) {
			console.log('No File or Stream found. Moving to next in queue... ', this.channel);
			return this._nextSource(done);
		}
		
		// create the source stream from a File
		new Broadcast.Source.Fluent(source, (err, fluent) => {
			if(err) {
				this.debug(this.channel + ' - ' +'File failed to deliver a usable stream. Moving to next n queue...');
				return this._nextSource.call(this);
			}
			if(!Broadcast.isReadableStream(fluent.stream)) {
				this.debug(this.channel + ' - ' +'File failed to deliver a usable stream. Moving to next n queue...');
				return this._nextSource.call(this);
			}
			
			this.currentSource = fluent;
			
			this.debug(this.channel + ' - ' +'Playing ' + fluent.name);
			
			this.end.push({name: fluent.name, end: fluent.end});
			
			// alert the channel update
			Broadcast.notify('channels', Broadcast.socketListeners.channels());
			
			fluent.stream.pipe(this.broadcaster, { end: false});
			//fluent.stream.on('data', data => this.broadcaster.write(data));
			// throttle takes care of pushing our stream to broadcaster
			//this.throttle(source, source.bitRate / 8, this._nextSource.bind(this));
			
			done();
			
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
		if(source) {
			// prevSource can do this
			if(keep) {
				// push a dummy source
				this.sources.unshift({ name: 'Queue Management Bot', bot: true });
			}
			this.prevSource(source);
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

			this.udpSinks.forEach(r => { if(_.isFunction(r.end)) r.end()});
			delete this.udpSinks;
			_.forEach(this.streams, r => { if(_.isFunction(r.end)) r.end()});
			delete this.streams;
			this.programs.forEach(r => { if(_.isFunction(r.end)) r.end()});
			delete this.programs;
			delete this.history;
			delete this._hls;
			delete Broadcast.channels[this.channel];
			delete this;
			callback();	
					
		});
		return true
	}
	
	// RESTART
	Channel.prototype.RESTART = function() {
		this.debug(this.channel + ' - ' +'RESTART');
		this.setState('RESTART');
		return _.clone(this.options);
	}
	
	// CONFIG
	Channel.prototype.CONFIG = function() {
		this.debug(this.channel + ' - ' +'get config');
		return _.clone(this.options);
	}
	
	return Channel;
}
