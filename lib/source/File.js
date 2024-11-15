

var debuger = require('debug')('woobi:lib:source:file');
var debug = debuger;
var _ = require('lodash');
var fs = require('fs');  
var ffprobe = require('fluent-ffmpeg').ffprobe;

/**
 * @module Broadcat/Source
 * @param {*} Broadcast 
 */
module.exports = function(Broadcast) {
	return File;
	/**
 * Creates a source stream from a File
 *
 * ####Example:
 *
 *     Broadcast.source.File({port:10000,host:'224.0.0.251'}, callback)
 *
 * @class    
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */
	 function File(opts, callback) {
		
		if (!(this instanceof File)) return new File(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		this.name = opts.name || opts.title || Broadcast.randomName();
		this.file = opts.file;
		this.channel = opts.channel || this.name;
		this.throttle = opts.throttle || 10 * 1024;
		
		debug(this.channel + ' - ' +'process file ' + this.name);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}

		if(!_.isString(this.name)) {
			callback('name must be a String');
			return false;
		}
		
		if(!_.isString(this.file)) {
			callback('path must be a String');
			return false;
		}
		
		this.options = opts;
		
		try {
			stat = fs.statSync(this.file);

			if (!stat.isFile()) {
				debug(opts.channel + ' - ' + 'file check failed.  Might not be a local file', this.file);
				callback('file check failed.  Might not be local: ' + this.file);
				return false;
			}
		} catch (e) {
			debug(opts.channel + ' - ' + 'file check failed.  Might not be a local file', this.file);
			callback('file check failed.  Might not be local: ' + this.file);
			return false;
		}
		
		this.end = (callback) => {
			debug(opts.channel + ' - ' +'file ' + name + ' is being terminated.');
			this.stream.close();
			if(callback) {
				callback();
			}
		}
		
		this._log =  [];
		this.log = (entry) => {
			return this._log.push(entry)
		};
		
		
		/** 
		 * pulled from 
		 * https://github.com/meloncholy/vid-streamer
		 * 
		 * */
		
		ffprobe(this.file, (err, metadata) => {
			
			console.dir(metadata);
			this.bitRate = metadata.format.bit_rate;
			this.duration = metadata.format.duration;
			this.format = metadata.format ;
			this.start = metadata.format.start_time;
			this.end = metadata.format.end;
			this.size = metadata.format.size;
			this.modified = stat.mtime;
			this.rangeRequest = false;

			if (opts.start || opts.end) {
				// This is a range request, but doesn't get range headers. So there.
				this.start = _.isNumber(opts.start) && opts.start >= 0 && opts.start < this.end ? opts.start - 0 : this.start;
				this.end = _.isNumber(opts.end) && opts.end > this.start && opts.end <= this.end ? opts.end - 0 : this.end;
			}

			this.length = this.size;
			
			this.stream = new Broadcast.Stream.bridge();
			
			var stream = fs.createReadStream(this.file, { flags: "r", start: this.start, end: this.end });
			//stream = stream.pipe(new Throttle(this.bitRate / 1000));
			
			stream.on("open", () => {
				// get the bitrate for throttle
				debug('bitrate', this.bitRate / 1000);
				debug(this.channel + ' - ' + this.name + ' - ' +'Created stream', Broadcast.isReadableStream(this.stream));
				
				Broadcast.streams[this.name] = this.stream;

				stream.pipe(this.stream);
				callback(null, this);
			});
			
			stream.on('end', () => {
				debug( this.name + ' has finished streaming');
						
				if(_.isFunction(opts.end)) {
					opts.end(this.name);
				}
			})
			
			// error event
			stream.on('error', (err) => {
				debug( this.name + ' message: ' + err.message);
				
				if(_.isFunction(opts.end)) {
					opts.end(this.name);
				}
			})
			
			return;		
		});
		
		return this;
		
	}
}
