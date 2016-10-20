var	_ = require('lodash');
var	debug = require('debug')('snowstreams:lib:channel');
var async = require("async");
var hat = require('hat');
var path = require('path');

module.exports = function(Broadcast) {
	function Channel(channel, options) { 
		if (!(this instanceof Channel)) return new Channel(channel, options);
		if(!_.isObject(options)) {
			options = {};
		}
		debug('new Channel ', channel);	
		
		//_.defaults(this, options);
		
		this.channel = channel;
				
		this.sources = [];
		
		if(options.file) {
			this.sources.push(options.file);
		}
		
		if(Array.isArray(options.files)) {
			this.sources = options.files;
		}
		
		this.fillers = options.fillers;
		if(!Array.isArray(this.fillers)) {
			this.fillers = [
				{ name: 'River', file: path.join(Broadcast.get('module root'), 'lib/assets/river.mp4') },
				{ name: 'Waterfall', file: path.join(Broadcast.get('module root'), 'lib/assets/waterfall.mp4') }
			];
		}
		
		this.transition = false;
		this.file = false;
		
		// an open stream to add our content
		// this broadcast write stream should only end with explicit instructions
		this.stream = Broadcast.Stream.broadcast();
		
		this.udp = {};
		if(options.udp) {
			this.udp = new Broadcast.Stream.UDP(_.defaults({ channel: channel, port: Broadcast.channelPort + channel }, options.udp));
			if(_.isFunction(this.udp.play)) {
				this.udp.play(this.stream, (err) => {
					if(err) console.log(err);
				});
			}
		}
		
		this.play();
		
	}
	
	/**
	 * pick a filler video
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.filler = function() {	
		var fill = this.fillers[_.random(0, this.fillers.length-1)];
		// debug(this.fillers, fill, _.random(0, this.fillers.length) ,  this.fillers[_.random(0, this.fillers.length)]);
		return {
			file: fill.file,
			name: fill.name
		};
	}
	
	/**
	 * Add a source
	 * 
	 * @api public
	 * 
	 * */

	Channel.prototype.addSource = function(name, file, callback) {	
		
		debug('Add Source to Channel', name, file);
		
		var asset = {
			file: file,
			name: name
		}
		this.sources.push(asset);
		
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
	 
	// crash
	Channel.prototype.crash = function(Asset, forced) {
		this.file = false;
	}
	
	// Stop
	Channel.prototype.stop = function(callback) {
		debug('run stop');
		if(_.isFunction(this.file.end)) {
			this.file.end();
		}
	}
	
	// nextSource
	Channel.prototype.nextSource = function() {
		debug('run nextSource');
		this.file = false;
		if(this.transition) {
			this.sources.shift();
			this.transition = false;
			this.play();
		} else {
			this.transition = true;
			file = this.filler();
			file.name= 'Transition with ' + file.name
			this.play(file);
		}
	}
	
	// Play
	Channel.prototype.play = function(playThis, callback) {
		
		var _this = this;
		
		var file = playThis || this.sources[0];
		
		if(!file) {
			file = this.filler();
			//file.name= 'Filling with ' + file.name
		}
		
		if(!file.file) {
			console.log('No File Found to start stream');
			return _this.nextSource.call(_this);
		}
		
		file.end = _this.nextSource.bind(_this);
		
		// create the source stream
		this.file = new Broadcast.Source.File(file, function(err, source) {
			if(err) {
				debug('File failed to deliver a usable stream... moving to next one');
				return _this.nextSource.call(_this);
			}
			if(!Broadcast.isReadableStream(source.stream)) {
				debug('File failed to deliver a usable stream... moving to next one');
				return _this.nextSource.call(_this);
			}
			if(callback) {
				callback();
			}
			debug('Playing ' + file.name);
			source.stream.pipe(_this.stream, {end: false});//end = true, close output stream after writing

		});
	}
	Channel.prototype.start = Channel.prototype.play;
	
	// Pause
	Channel.prototype.pause = function(callback) {
		
	}
	
	// Force a source now
	Channel.prototype.force = function(source, keep = false) {
		debug('Try and Force  source ' + source.name);
		var play = () => {
			if(keep) {
				this.sources.unshift({dummy: true});
			}
			
			this.play(source, () => {
				debug('playing new source ' + source.name);
				if(_.isFunction(this.file.end)) {
					return this.file.end();
				}
			});
		}
		
		play();
		
	}

	return Channel;
}
