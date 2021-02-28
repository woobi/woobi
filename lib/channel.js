var	_ = require('lodash');
var	debuger = require('debug')('woobi:lib:channel');
var async = require("async");
var hat = require('hat');
var path = require('path');
var moment = require('moment');
var fs = require('fs-extra');
var findRemoveSync = require('find-remove');
var Transform = require('stream').Transform;
var GrowingFile = require('growing-file');
var ffprobe = require('fluent-ffmpeg').ffprobe;
var jsonfile = require('jsonfile');
var rif = require('replace-in-file');

/** 
 * Manage broadcast channels
 * @module Channels 
 * 
 * */


module.exports = function(Broadcast) {
	/**
	 * Create a new channel
	 * @param {string} channel - channel name
	 * @param {object} options - options for channel
	 * @param {array} [options.files] - array of files
	 * @param {string} options.name - name it
	 * @param {boolean} [options.loop] - loop the channel
	 * @param {object} [options.hls]
	 * @param {array} [options.assets]
	 * @param {(err, this)} callback
	 * 
	 */
	function Channel(channel, options, callback) { 
		
		if (!(this instanceof Channel)) return new Channel(channel, options, callback);
		
		if(!_.isObject(options)) {
			options = {};
		}
		if(!_.isFunction(callback)) {
			callback = () => {};
		}
		var _this = this;
		
		this.debug = options.noDebug ? function(){} : debuger;
		
		options.channel = channel;
		if(!options.id) {
			this.debug('no id so create one for this channel');
			this.debug('## Channel ID #######################');
			this.debug('##                                   ##');
			this.debug('## ' + Broadcast.camelCaseSanitize(channel));
			this.debug('##                                   ##');
			this.debug('#######################################');
			options.id = Broadcast.camelCaseSanitize(channel);
		}
		
		this.options = _.cloneDeep(options);
		this._options =  _.cloneDeep(options);
		
		this.debug(channel + ' - ' +'new Channel ' );	
		
		this.FIRSTRUN = true;
		
		this.channel = channel;
		this.name = channel;
		this.id = options.id;
		var id = this.id;
		this.state = {
			current: 'construct'
		}	
		
		// an open stream to add our content
		// this broadcaster stream should only end with explicit instructions
		this.streamRestart = [];
		this.broadcaster = this.stream = new Broadcast.Stream.bridge();
		this.broadcaster.on('pipe', (src) => {
			this.debug(this.id + ' - ' +'something is piping into the broadcaster');
		})
		.on('unpipe', (src) => {
			this.debug(this.id + ' - ' +'something unpiped from the broadcaster');
		})
		.on('drain', (src) => {
			//this.debug(channel + ' - ' +'broadcaster emitted a drain', src);
		})
		.on('error', (err) => {
			this.debug(this.id + ' - ' +'err from the broadcaster');
			this.stream = this.broadcaster = Broadcast.Stream.bridge();
			this.streamRestart.forEach((s) => {
				if(_.isFunction(s)) {
					s(this.stream);
				}
			});
		})
		.on('close', () => {
			this.debug(this.id + ' - ' +'broadcaster closed');
			this.stream = this.broadcaster = Broadcast.Stream.bridge();
			this.streamRestart.forEach((s) => {
				if(_.isFunction(s)) {
					s(this.stream);
				}
			});
		})
		.on('end', () => {
			this.debug(id + ' - ' +'broadcaster end');
		})
		.on('finish', () => {
			this.debug(id + ' - ' +' broadcaster finished, starting over' );
			this.stream = this.broadcaster = Broadcast.Stream.bridge();
			this.streamRestart.forEach((s) => {
				if(_.isFunction(s)) {
					s(this.stream);
				}
			});
		})
		
		this.sources = []; 
		this._sources = []; //this.sources.map(r=>r);
		this.history = [];
		
		if(this.options.file) {
			this.addSource.call(this, this.options.file);
		}
		
		if(Array.isArray(this.options.files)) {
			this.options.files.forEach(this.addSource.bind(this));
		}
		
		this.noTransition = this.options.noTransition === true ? true : false;
		this.filler = this.options.filler || Broadcast.filler;	
		
		this.transition = this.noTransition ? false : true;
		this.currentSource = {};
		this.loop = this.options.loop;
		
		this.end = [];
		
		// helper add functions
		this.helpers = {};
		_.each(Broadcast.import('lib/channel-helpers'), (v, k) => { this.helpers[k] = v.bind(this); });
		
		// asset banks
		this.programs = [];
		this.udpStreams = [];
		this.streams = {};
		this.requests = [];
		this.udpSinks = [];
		this.hls = false;
		
		// our assets
		var assets = Array.isArray(this.options.assets) ? this.options.assets : [this.options.assets]
		
		var apiLink = Broadcast.get('proxy api');
		// master link
		this.link = 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', apiLink, Broadcast.wobble, this.id).replace(/\\/g,'/');
		this.path = path.join(Broadcast._options.moduleRoot, apiLink, Broadcast.wobble, this.id);
		// other links
		this.links = {
			local: this.path,
			unicast: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', apiLink, 'unicast', this.id).replace(/\\/g,'/'),
			http: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', apiLink, Broadcast.wobble, this.id).replace(/\\/g,'/'),
			ondemand: 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', apiLink, 'ondemand', this.id).replace(/\\/g,'/'),
			hls: false,
			udpSink: [],
			udpStream: []
		};

		if(this.options.nostream) {
			delete this.links.local;
			delete this.links.unicast;
		}
		this.commands = {
			sockets: this.options.socketCommands || [],
			request: this.options.requestCommands || [],
			link: this.options.linkCommands || []
		};
		
		this.mediaPath = path.join( Broadcast.mediaPath, Broadcast.wobbles, this.id);
		this.dvrPath = options.dvrPath || path.join( Broadcast.mediaPath, 'dvr');
		this.hlsFile = path.join( this.mediaPath, this.id + '.m3u8');
		this.hlsFile1 = path.join( this.mediaPath, this.id + 'BB.m3u8');
		this.jsonPath = path.join( Broadcast.mediaPath, Broadcast.wobbles, this.id + '.json');
		
		// add config options to hls
		if(this.options.hls) {
			this.options.hls.name = id;
			this.options.hls.id = id;
			this.options.hls.path = this.mediaPath;
		}
		// remove the old files
		this.debug('Media path: ', this.mediaPath);
		fs.emptyDirSync(this.mediaPath);
		fs.ensureDirSync(this.dvrPath);	
		//findRemoveSync(this.mediaPath, {extensions: '.ts'});
		
		this.debug('Write JSON config file: ', this.jsonPath);
		
		jsonfile.writeFile(this.jsonPath, this._options, { spaces: 2 }, (err) => {
			if(err) {
				this.debug('##### Error ####################################');
				this.debug('##  ' + err +'   ##');
				this.debug('## ' + id + '                               ##');
				this.debug('##################################################');
			} else {
				this.debug('##### Success ####################################');
				this.debug('##  Wrote json configutation file               ##');
				this.debug('## ' + this.jsonPath + ' ##');
				this.debug('##################################################');
			}
		});
		
		this.hls = false;
		// run through the this.options ;			
		async.forEachSeries( assets, (asset, next) => {
			
			if(!asset) return next();
			
			if(!_.isFunction(this.helpers[asset.type])) {
				this.debug(this.id + ' - ' + ' No helper found for ' + asset.name, asset.type, asset);
				return next();
			}
						
			this.helpers[asset.type](asset).then(() => {
				this.debug(this.id + ' - ' + 'Done with ' + asset.name + '. Moving to next');
				next() 
			}).catch(e => {
					this.debug(this.id + ' - ' + 'Error from asset', asset.type, e);
					next();
			});
			
		}, (er) => {
			this.debug(this.id + ' - ' + ' Channel Ready!!');
			callback(null, this);
		}); 
			
	}
	
	/**
	 * play the channel
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.start = function(callback) {	
		var options = this.options;
		this.debug(this.id + ' - ' + ' Done loading assets. Playing the channel');			
		this.firstPlay(HLS.bind(this));
		
		function done(err, hls) {
			// add an output if available
			this.debug(this.id + ' - ' + 'Start second output?', !!options.out);
			if (options.out) {
				//let out = path.join( this.dvrPath, options.out );
				this.links.dvrPath = options.out.file;
				this.debug('OUT:', options.out);
				fs.remove( options.out.file, ( e ) => {
					if ( e ) this.debug;
					this.out = new Broadcast.Stream.File({
						stream: this.broadcaster,
						name: this.channel + ':out',
						...options.out,
					}, ( err, file ) => {
						if ( err ) {
							this.debug(this.id + ' - ' + ' Error', err);
						}
						
						this.debug(this.id + ' - ' + ' second output started');
						this.debug(this.id + ' - ' + ' Channel Ready!!');
						if(_.isFunction(callback)) callback(null, this);
					});
				
				});
					
				
			} else {
				this.debug(this.id + ' - ' + ' Channel Ready!!');
				if(_.isFunction(callback)) callback(null, this);
			}
			
		}
		
		function HLS() {	
			this.debug(this.id + ' - ' + ' Use HLS? ', options.hls);
			if(options.hls) {
				this.debug(this.id + ' - ' + ' creating HLS stream for ' + options.hls.name);
				this._createHLS(options.hls, done.bind(this));
			} else {
				done.call(this)
			}
			
		}
	}


	/**
	 * get an asset from a collection
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.getAsset = function( collection, name ) {	
		if ( this[collection] ) {
			return _.find( this[collection], [ 'name', name ] );
		}
	}
	
	/**
	 * get all assets by name
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.getAssets = function( name ) {	
		let assets = [];
		assets.push(_.find( this.programs, [ 'name', name ] ) );
		assets.push(_.find( this.requests, [ 'name', name ] ) );
		assets.push(_.find( this.streams, [ 'name', name ] ) );
		assets.push(_.find( this.udpStreams, [ 'name', name ] ) );
		assets.push(_.find( this.udpSinks, [ 'name', name ] ) );
		_.remove( assets, null );
		return assets;
	}
	
	this.programs = [];
	this.udpStreams = [];
	this.streams = {};
	this.requests = [];
	this.udpSinks = [];
	
	/**
	 * set channel state
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.setState = function(state, callback) {	
		
		//this.debug(this.id + ' - ' +'set State', this.state);
		
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
	 * Add Source to the channel
	 * @param {*} source 
	 * @param {function} callback 
	 */

	Channel.prototype.addSource = function(source, callback) {	
		
		this.debug(this.id + ' - ' + source.name, 'Add Source to Channel ');
		source.failed = false;
		this.sources.push(source);		
		this.sources = _.uniqBy(this.sources, 'name');
		this._sources.push(_.clone(source));

		if(!source.metadata.totalTimeInSeconds && !source.skipCheck) {
			ffprobe( source.file, ( err, metadata ) => {
				if(err) this.debug('ERR', err);
				if(metadata) {
					source.metadata.bitRate = metadata.format.bit_rate;
					source.metadata.duration = metadata.format.duration;
					source.metadata.start = metadata.format.start_time;
					source.metadata.end = metadata.format.end;
					source.metadata.size = metadata.format.size;
					//this.debug( 'got metadata', metadata.format, duration > this.truncate );
					source.metadata.totalTimeInSeconds = source.metadata.duration
					//Broadcast.notify( this.name, this._info);
				} 
			});
		}
			

		if(!_.isFunction(callback)) {
			return this;
		} else {
			return callback();
		}
		
	}
	Channel.prototype.push = Channel.prototype.addSource;

	Channel.prototype.unshiftSource = function(source, callback) {	
		
		this.debug(this.id + ' - ' +'Add Source to beginning', source.name);
		
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
	 * Create the hls stream
	 * 
	 * @api private
	 * 
	 * */
	Channel.prototype._createHLS = function _createHLS(opts, done) {
		
		/**
		 * this is named weird now.  it used to create a mirror hls file that we could write to
		 * now it jsut starts the hls and sets a restart
		 * I left the name cause im lazy today
		 */

		if(!_.isFunction(done)) {
			this.debug(this.id + ' - ' + ' _createHLS no callback ');
			done = () => {};
		}
		
		if(this.hls) {	
			if(_.isFunction(this.hls.end)) {	
				// we have a previous stream running so end it
				this.debug(this.id + ' - ' + 'end previous hls', this.hls.name );
				return this.hls.end(() => {
					finish.call(this);
				});
			} 
		}
		
		finish.call(this);
		
		function finish() {
			
			this.debug(this.id + ' - ' + ' run hls helper for ' +  opts.name);
			//this._writeToHLS('#EXT-X-DISCONTINUITY\n#EXT-X-STREAM-INF:PROGRAM-ID=' + source.name + '\n' + hls.name + '.m3u8\n');
			
			this.helpers.hls(opts).then((hls) => {
				if(!hls) {
					var e = this.channel + ' - ' + 'Error loading HLS stream ' + opts.name
					this.debug('##### ERROR ###################################');
					this.debug(e);
					return done(e);
				}
				this.debug(this.id + ' - ' + 'Done loading HLS stream ' + hls.name);
				this.hls = hls;
				// we used to mirror the hls list
				// now we will just add discontinuity to the main file
				//this._writeMainHLS();
				done(null, hls);
			}).catch((e) => {
				this.debug('##### ERROR ###################################');
				this.debug(this.id + ' - ' + 'Error loading HLS stream ' + opts.name, e);
				done(e);
			});
		}
	}
	
	/**
	 * Mirror the hls output from ffmpeg and add discontinuity
	 * 
	 * Id like to split each source into its own hls stream
	 * then offer a m3u8 that has each stream with name
	 * #EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=64000,CODECS="mp4a.40.5"
	 * 
	 * @api private
	 * 
	 * */
	Channel.prototype._writeMainHLS = function writeToMainHLS() {
			
		var uppercase = this.transformHLS = new Transform({decodeStrings: false, end: false,  objectMode: true});
		let a = 1;
		uppercase._transform = (chunk, encoding, done) => {
			var string = chunk.toString();
			if(a === 1) {
				//string = string.replace('#EXTM3U', '#EXTM3U\n\n#EXT-X-PLAYLIST-TYPE:VOD\n');
				a=2;
			}
			if(this.DISCONTINUITY) {
				//string += '\n#EXT-X-DISCONTINUITY\n\n';
				this.DISCONTINUITY = false;
			}
			
			done(null, string);
		};
		var target = this.hlsFileTarget = fs.createWriteStream(this.hlsFile);
		target.on('end', (e) => {
			this.debug(this.id + ' - ' + e, 'Write m3u8 ended');
		});
		var interval;
		var source = this.grabHLS = GrowingFile.open(this.hlsFile1,{
			timeout: 150000,
			interval: 1000,
			startFromEnd: false
		});
		source.on('error', (e) => {
			this.debug(this.id + ' - ' + e, 'Read m3u8 failed');
			this.FIRSTRUN = false;
		});
		source.once('data', (e) => {
			this.debug(this.id + ' - ' + 'Got data from m3u8 original file');
			if ( Broadcast._options.proxy ) {
				Broadcast.notify(this.channel + ':hls', { ready: true, link: this.link });
			}
			this.FIRSTRUN = false;
		});
		source.on('end', (e) => {
			this.debug(this.id + ' - ' + e, 'Read m3u8 ended');
		});
		
		source.pipe(uppercase, { end: false}).pipe(target, { end: false});

		
	}
	
	/**
	 * Wrtie to the hls m3u8 file
	 * 
	 * @api private
	 * 
	 * */
	Channel.prototype._writeToHLS = function writeToHLS (data, done) {
		this.debug(this.id + ' - ' + 'Write data', data);
		fs.appendFile(this.hlsFile, data,  (err) => {
			this.debug(this.id + ' - ' + 'write to m3u8', data, err);
			if(done) done(err);
		});	
	}
	
	/**
	 * Update the #EXT-X-MEDIA-SEQUENCE: for a live experience
	 * increments by three using the _sequence var. 
	 * @param {( err )} callback - callback
	 */
	Channel.prototype._updateSequenceInHLS = function _updateSequenceInHLS (callback) {
		this.debug(this.id , '-' , this._sequence, 'Update #EXT-X-MEDIA-SEQUENCE to ', this._sequence + 3, this.hlsFile);
		rif({
			files: this.hlsFile,
			from: '#EXT-X-MEDIA-SEQUENCE:' + this._sequence,
			to: '#EXT-X-MEDIA-SEQUENCE:' + (this._sequence + 3),
		},(e, r) => {
			if(e) {
				this.debug('## ERROR ##', 'could not write to hls file for', this.name, e);
			}
			this._sequence = this._sequence + 3;
			if (callback) callback(e)
		})
	}

	/**
	 * Actioners
	 * 
	 * */
	Channel.prototype.throttle = function throttle (source, rate, onEnd) {
		this.debug(this.id + ' - ' + 'Start Throttle for ' + source.name);
		var trottle = Broadcast.Stream.broadcast(source, rate, onEnd).pipe(this.stream, { end: false});
	}
	 
	// crash
	Channel.prototype.crash = function(Asset, forced) {
		this.currentSource = {};
		this.setState('Crashed');
	}
	
	// Stop
	Channel.prototype.stop = function(callback) {
		this.debug(this.id + ' - ' + this.channel + ' - ' +'run stop');
		this.setState('Stop');
		if(_.isFunction(this.currentSource.end)) {
			this.currentSource.end();
		}
	}
	
	// prevSource
	Channel.prototype.prevSource = function( source ) {
		
		if ( this.state.current === 'Stop' ) return;
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
		
		this.debug(this.id + ' - ' + this.channel + ' - ' +'run prevSource');
		
		if(_.isFunction(this.currentSource.end)) { 
			this.debug(this.id + ' - ' +' Try and stop the current stream ', this.currentSource.name);
			this.currentSource.end(play.bind(this));
		} else {
			this.debug(this.id + ' - ' +' The was not an end function. ');
			play();
		}	
	}
	
	// _nextSource
	Channel.prototype._nextSource = function() {
		this.debug(this.id + ' - ' +'run _nextSource');		
		/* 
		 * _nextSource should only be called internally from a source end function
		 *  use next to move to the next stream while a program is in progress
		 * */
		if(this.state.current === 'Stop') {
			this.debug('Stop was set when using _nextSource', this.state.current)
			return;
		}
		this.setState('Next Source');
		
		
		
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
			this.debug(this.id + ' - ' +' Try and stop the current stream ');
			this.currentSource.end(play.bind(this));
		} else {
			this.debug(this.id + ' - ' +' The was not an end function. ');
			play(false, done);
		}
		
	}
	Channel.prototype.nextSource = Channel.prototype.next;
	
	// jumpTo
	Channel.prototype.jumpTo = function(to) {
						
		var play = () => {
			let loop = [];
			// goto the selected source
			this.sources = this.sources.filter((s, i) => {
				if (i < (to - 1)) {
					this.debug(this.id + ' - ' + 'Add ' + s.name + '  to history');
					if (i === 'fuck') {
						this.history.unshift(s);
					}
					if(this.loop) {
						loop.push(s);
						this.debug(this.id + ' - ' + 'Move ' + s.name + ' to bottom of list');
					}
					return false;
				} 
				return true;
			});
			
			this.sources = this.sources.concat(loop);
			
			this.playTransition();
		}
		
		if(_.isFunction(this.currentSource.end)) { 
			this.debug(this.id + ' - ' +' Try and stop the current stream ');
			this.currentSource.end(play.bind(this));
		} else {
			this.debug(this.id + ' - ' +' The was not an end function. ');
			play();
		}
		
	}
	
	// First Play
	Channel.prototype.firstPlay = function(done) {
		this.play(false, done);
	}
	
	// playTransition
	Channel.prototype.playTransition = function() {
		if( !this.noTransition && this.transition) {
			
			var file = _.clone(this.filler);
			file.name = 'Transition with ' + this.filler.name;
			let name =  this.sources[1] ?  this.sources[1].name : ''
			this.transition = false;
			
			if( this.hlsFileTarget && !this.FIRSTRUN ) {  // 
				this.debug(this.id + ' - ' + 'Write discontinuity', this.channel);
				this._writeToHLS('\n#EXT-X-DISCONTINUITY\n')
				//this.DISCONTINUITY = true;
			}
			
			this.play(file);
		
		} else {
			
			this.transition = true;
			var shift = this.sources.shift();
			
			if( shift && !shift.bot ) {
				this.debug(this.id + ' - ' + 'Add ' + shift.name + '  to history');
				this.history.unshift(shift);
				if(this.loop && !shift.failed) {
					this.sources.push(shift);
					this.debug(this.id + ' - ' + 'Move ' + shift.name + ' to bottom of list');
				} else {
					this.debug(this.id + ' - ' + 'Moved ' + shift.name + ' to history as failed');
				}
			}
			
			// check if this source has failed before
			if(this.sources[0]){
				if( this.sources[0].failed ) {
					this.debug('Failed source, skipping...', this.sources[0].name);
					return this._nextSource();
				}
			}		
			if(this.hlsFileTarget  && !this.FIRSTRUN) {
				this._writeToHLS('\n#EXT-X-DISCONTINUITY\n')
				//this.DISCONTINUITY = true;
			}
			
			this.play();
			
		}
					
	}
	
	// Play
	Channel.prototype.play = function(playThis, done) {
		
		if(this.state.current === 'Stop') return;
		this.setState('Play');
		
		if (!_.isFunction(done)) {
			done = () => {}
		}
		
		this.debug(this.id + ' - ' + 'Play', 'user source?', !!playThis);
		var source = playThis || this.sources[0];
		this.debug(this.id + ' - ' + 'Got Source?', !!source, this.links);
		if(!source) {
			if(this.loop) {
				this.sources = this._sources.map(r => r);
				if(this.sources.length > 0) {
					source = this.sources[0];
				} 
			}
		}
		if ( !source && !this.options.noTransition ) {
			source = this.filler;
			this.transition = false;
		} else if ( !source ) {
			/*
			this.debug(this.id + ' - ' + 'Run an interval waiting for a new source');
			const checkInterval = () => {
				if ( this.sources.length > 0 ) {
					this.debug(this.id + ' - ' + 'clearInterval and play new source');
					clearInterval(this.checkInterval);
					this.play(this.sources[0]);
				}
			}
			this.checkInterval = setInterval(checkInterval, 1000);
			* */
			this.debug(' No source so just wait for a new one');
			done();
			return ;
		}
		source.channel = this.channel;
		
		if(!source.noDebug) {
			// respect channel debug
			source.noDebug = this.options.noDebug;
		}
		
		// push the next source on end
		source.end = (name, failed) => {
			if(failed == true) source.failed = failed;
			this.debug(name, 'move to next file', failed)
			this._nextSource.call(this);
		}
		// we can accept a program to pipe a stream through
		if(source.program) {
			// create the source stream from a File
			this.currentSource = new Broadcast.Source.Program(source, (err, program) => {
				if(err) {
					this.debug(this.id + ' - ' + err);
					this.debug(this.id + ' - ' +'Program failed to deliver a usable stream. Moving to next n queue...');
					source.failed = true;
					return this._nextSource.call(this);
				}
				if(!Broadcast.isReadableStream(program.stream)) {
					this.debug(this.id + ' - ' +'Program failed to deliver a usable stream. Moving to next n queue...');
					source.failed = true;
					return this._nextSource.call(this);
				}
				
				this.debug(this.id + ' - ' +'Playing ' + program.name);
				
				// alert the channel update
				if ( Broadcast._options.proxy ) {
					Broadcast.notify('channels', Broadcast.socketListeners.channels());
					Broadcast.notify(this.channel, Broadcast.socketListeners.channel({ channel: this.channel }));
				}
				//program.stream.on('data', data => this.broadcaster.write(data));
				program.stream.pipe(this.broadcaster, { end: false});
				// set the time the stream will start for epgs
				this.setEpgTimes(source);
				
				this.debug(this.id + ' - ' +'Run done');
				done();
				
				this.end.push({name: program.name, end: program.end});

			});

			return;
		}	
		
		// we can accept a ready stream
		if(Broadcast.isReadableStream(source.stream) && !source.fluent) {
			
			this.debug(this.id + '  -  ' +' Playing stream for ' + source.name);
			
			this.currentSource = source;
			
			// alert the channel update
			if ( Broadcast._options.proxy ) {
				Broadcast.notify('channels', Broadcast.socketListeners.channels());
				Broadcast.notify(this.channel, Broadcast.socketListeners.channel({ channel: this.channel }));
			}
			// play stream
			//source.stream.on('data', data => this.broadcaster.write(data));
			source.stream.on('end', source.end);
			source.stream.pipe(this.broadcaster, { end: false});
			// set the time the stream will start for epgs
			this.setEpgTimes(source);
			
			this.debug(this.id + '  -  ' +' Is broadcaster paused and stacking memory?' + this.broadcaster.isPaused());
			if( this.broadcaster.isPaused()) {
				this.broadcaster.resume();
			}
			
			this.debug(this.id + '  -  ' +' Is sourced paused and stacking memory?' + source.stream.isPaused());
			if( source.stream.isPaused()) {
				source.stream.resume();
			}
			
			// push the end function for a kill event or change of source
			this.end.push({name: source.name, end: source.close})
			
			return done();
			
		}
		
		if(!source.file) {
			this.debug(this.id + ' - ' + ' No File or Stream found. Moving to next in queue... ', this.channel);
			return this._nextSource(done);
		}
		
		// create the source stream from a File
		new Broadcast.Source.Fluent(source, (err, fluent) => {
			if(err) {
				this.debug(this.id + ' - ' +' File failed to deliver a usable stream. Moving to next n queue...');
				source.failed = true;
				this.debug('Source Failed to Stream and was marked failed')
				return this._nextSource.call(this);
			}
			if(!Broadcast.isReadableStream(fluent.stream)) {
				this.debug(this.id + ' - ' +' File failed to deliver a usable stream. Moving to next n queue...');
				source.failed = true;
				this.debug('Source Failed to Stream and was marked failed')
				return this._nextSource.call(this);
			}
			
			this.currentSource = fluent;
			
			this.debug(this.id + ' - ' +'Playing ' + this.currentSource.name);
			
			this.end.push({name: this.currentSource.name, end: this.currentSource.end});
			
			// alert the channel update
			if ( Broadcast._options.proxy ) {
				Broadcast.notify('channels', Broadcast.socketListeners.channels());
				Broadcast.notify(this.channel, Broadcast.socketListeners.channel({ channel: this.channel }));
			}
			fluent.stream.pipe(this.broadcaster, { end: false});
			//fluent.stream.on('data', data => this.broadcaster.write(data));
			// throttle takes care of pushing our stream to broadcaster
			//this.throttle(source, source.bitRate / 8, this._nextSource.bind(this));

			// set the time the stream will start for epgs
			this.setEpgTimes(source);

			this.debug(this.id + ' - ' +'Run done');
			done();
			
		});
		
		
	}
	//Channel.prototype.start = Channel.prototype.play;
	
	// set source play times for eps
	Channel.prototype.setEpgTimes = function(source, time) {
		var useTime = moment(time) || moment();
		source.startTime = this.epgTime(useTime);
		source.endTime = this.epgEndTime(useTime, source.totalTimeInSeconds);
		this.currentSource.startTime = useTime.valueOf();
		
	}

	// set time of source start
	Channel.prototype.epgTime = function(time) {
		return moment(time).format("YYYYMMDDHHmmss ZZ");
		//return moment(time).format("YYYYMMDDHHmmss") + ' -0000';
	}

	// set time of source end
	Channel.prototype.epgEndTime = function(begin, time) {
		return moment(begin).add(time, 'seconds').format("YYYYMMDDHHmmss ZZ");
	}
	
	// Pause
	Channel.prototype.pause = function(callback) {
		this.setState('Pause');
	}
	
	// Force a source now
	Channel.prototype.force = function( source, keep = false ) {
		this.setState({
			current: 'Forcing Source',
			source: source,
		});
		this.debug(this.id + ' - ' +'Try and Force  source ' + source.name, source.file);
		if ( source ) {
			if ( keep ) {
				// push a dummy source
				this.sources.unshift( { name: 'Queue Management Bot', bot: true } );
				this.prevSource( source );
			} else {
				this.nextSource( source );
			}
			
		}
		
	}
	
	// KILL
	Channel.prototype.KILL = function(callback) {
		return new Promise((resolve, reject) => {
			this.debug(this.id + ' - ' +'run KILL');
			this.setState('Stop');
			if(!_.isFunction(callback)) {
				callback = () => {};
			}
			this.stop();
			this.debug(this.id + ' - ' + this.end.length)
			async.forEach(this.end, (fn, finish) => {
				if(_.isFunction(fn.end)) {
					this.debug(this.id + ' - ' + 'STOP ' + fn.name);
					fn.end(finish);
				} else {
					finish();
				}
			}, () => {
				this.debug(this.id + ' - ' + ' End All');
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
				setTimeout(() => {
					this.debug(this.id + ' - ' + ' Done waiting for 2.5 seconds');
					callback();	
					resolve();		
				}, 2500);
			});
		});
	}
	
	// RESTART
	Channel.prototype.RESTART = function(merge) {
		var save = this.CONFIG();
		if(!_.isObject(merge)) {
			merge = {};
		}
		return this.KILL()	
			.then(r => {
				this.debug(this.id + ' - ' + 'promise after kill');
				return r;
			})
			.then(r => {
				this.debug(this.id + ' - ' + 'add new channel');
				return Broadcast.addChannel(save.channel, Object.assign(save, merge))
			})
			.then(r => {
				this.debug(this.id + ' - ' + ' done adding channel', 'resolve');
				return r;
			})
			.catch(e => {
				this.debug(this.id + ' - ' + ' done adding channel', 'reject');
			});	
		
	}
	
	// CONFIG
	Channel.prototype.CONFIG = function() {
		this.debug(this.id + ' - ' +'get config');
		return _.cloneDeep(this._options);
	}
	
	return Channel;
}
