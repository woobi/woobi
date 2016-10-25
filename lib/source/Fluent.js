/**
 * Creates a source stream from a udp stream
 *
 * ####Example:
 *
 *     ss.source.udp({port:10000,host:'224.0.0.251'}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debuger = require('debug')('snowstreams:lib:source:file');
var debug = debuger;
var _ = require('lodash');
// node streams
var fs = require('fs');  
// include the custom buffer duplex stream
var bufferStream = require('../node-streams/leaky');
var Transform = require('stream').Transform;
var ratelimit = require('ratelimit');
var ffmpeg = require('fluent-ffmpeg');
//ffmpeg.setFfmpegPath('avconv');
//ffmpeg.setFfprobePath('avprobe');

module.exports = function(Broadcast) {

	return function Fluent(opts, callback) {
		
		if (!(this instanceof Fluent)) return new Fluent(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		var name = this.name = opts.name || opts.title || Broadcast.randomName();
		
		opts.channel = opts.channel || name;
		
		debug(opts.channel + ' - ' +'process file ' + name);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}

		if(!_.isString(name)) {
			callback('name must be a String');
			return false;
		}
		
		if(!_.isString(opts.file) && !Broadcast.isReadableStream(opts.stream)) {
			callback('Valid file or stream required');
			return false;
		}
		
		this.source = Broadcast.isReadableStream(opts.stream) ? opts.stream : opts.file;
		
		_.defaults(this, opts);
		
		/*
		var ret = fs.lstat(this.file, (err, stats) => {
			if (!err && stats.isFile()) {
				// Yes it is
			} else {
				debug(opts.channel + ' - ' + 'file check failed.  Might not be a local file', this.file);
				//callback('file check failed.  Might be local');
			}
		});
		*/
		
		this.stream = Broadcast.Stream.bridge();
	
		ffmpeg.ffprobe(this.source, (err, metadata) => {
			
			if(!metadata) {
				metatdata = {}
			}
			
			this.metadata = metadata;
			this.bitRate = metadata.format.bit_rate;
			this.duration = metadata.format.duration;
			this.start = metadata.format.start_time;
			this.end = metadata.format.end;
			this.size = metadata.format.size;
			//this.modified = stat.mtime;
			this.rangeRequest = false;
			
			// make sure you set the correct path to your video file
		    this.ffmpeg = ffmpeg(opts.file);
			if(opts.seek) {
				this.ffmpeg.seekInput(opts.seek);
			}
			
			var nOpt = [
				"-c copy",
				"-bsf h264_mp4toannexb",
				//"-c:v libx264",
				//"-c:a copy",
				//"-crf 23",
				//"-preset ultrafast",
				//"-ar 44100",
				//"-ac 2",
				//"-b:a 96k",
				//"-r 25",
				//"-vcodec mpeg4",
				"-tune zerolatency",
				"-map 0",
				"-movflags faststart",
				"-strict experimental",
				//"+genpts",
				//"-fflags"
			]
		
			this.ffmpeg.inputOptions(['-re']);
			this.ffmpeg.addOptions(nOpt);
			this.ffmpeg.format("mpegts");
			// end event
			this.ffmpeg.on('end', () => {
				debug( name + ' has finished streaming');
					
				if(_.isFunction(opts.end)) {
					opts.end(name);
				}
			})
			// error event
			this.ffmpeg.on('error', function(err) {
				debug( name + ' message: ' + err.message);
				
				if(_.isFunction(opts.end)) {
					opts.end(name);
				}
			})
			
			this.ffmpeg.stream(this.stream, {end: false}); 
		});	
		
		this.end = (callback) => {
			debug(opts.channel + ' - ' +'file ' + name + ' is being terminated.');
			this.stream = false;
			if(this.ffmpeg) {
				opts.end = callback;
				this.ffmpeg.kill();
			} else if(callback) {
				callback();
			}
		}
		
		this._log =  [];
		this.log = (entry) => {
			return this._log.push(entry)
		};
		
		debug(opts.channel + ' - ' +'Created new stream', Broadcast.isReadableStream(this.stream));
		
		Broadcast.streams[this.name] = this.stream;

		callback(null, this);
		return this;
	}
}

