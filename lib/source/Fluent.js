/**
 * Creates a source stream using Fluent
 *
 * ####Example:
 *
 *     ss.source.Fluent({port:10000,host:'224.0.0.251'}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debuger = require('debug')('woobi:lib:source:Fluent');
var debug = debuger;
var _ = require('lodash');
// node streams
var fs = require('fs');  
var path = require('path');
// include the custom buffer duplex stream
var bufferStream = require('../node-streams/leaky');
var Transform = require('stream').Transform;
var ratelimit = require('ratelimit');
var ffmpeg = require('fluent-ffmpeg');

//ffmpeg.setFfprobePath('avprobe');

module.exports = function(Broadcast) {
	//ffmpeg.setFfmpegPath(path.join(Broadcast.get('module root'), 'bin'));
	return function Fluent(opts, callback) {
		
		if (!(this instanceof Fluent)) return new Fluent(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		var name = this.name = opts.name || opts.title || Broadcast.randomName();
		
		this.channel = opts.channel || name;
		
		debug(this.channel + ' - ' +'process file ' + name);
		
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
		
		this.stream = Broadcast.Stream.bridge();
	
		ffmpeg.ffprobe(this.source, (err, metadata) => {
			
			if(!metadata) {
				metadata = { format: {}}
			}
			
			this.codecs = metadata;
			this.bitRate = metadata.format.bit_rate;
			this.duration = metadata.format.duration;
			this.start = metadata.format.start_time;
			this.end = metadata.format.end;
			this.size = metadata.format.size;
			//this.modified = stat.mtime;
			this.rangeRequest = false;
			
			// make sure you set the correct path to your video file
		    this.ffmpeg = ffmpeg(this.source);
			if(opts.seek) {
				this.ffmpeg.seekInput(opts.seek);
			}			
			// use custom options if available
			if(opts.inputFormat) {
				this.ffmpeg.inputFormat(opts.inputFormat);
			}	
			if (opts.inputOptions) {
				this.ffmpeg.inputOptions(opts.inputOptions);
			} else {
				this.ffmpeg.inputOptions(['-re']);
			}
			if (opts.outputOptions) {
				this.ffmpeg.addOptions(opts.outputOptions);
			} 
			if (opts.videoFilters) {
				this.ffmpeg.videoFilters(opts.videoFilters);
			} 
			
			if (opts.onlyOptions) {
				this.ffmpeg.addOptions(opts.onlyOptions);
			} else if (opts.encode) {
				this.ffmpeg.videoBitrate(2500)
				// set h264 preset
				.addOption('-preset ultrafast')
				// set target codec
				.videoCodec('libx264')
				// set audio bitrate
				.audioBitrate('128k')
				// set audio codec
				.audioCodec('aac')
				// audio freq
				.audioFrequency(44100)
				// set number of audio channels
				.audioChannels(2)
				.addOption("-bsf h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if (opts.streamable) {
				this.ffmpeg.addOption("-bsf h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else {
				// set video bitrate
				this.ffmpeg.addOption("-c", "copy")
				.addOption("-bsf h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			}
			
			if(opts.format) {
				this.ffmpeg.format(opts.format);
			} else {
				this.ffmpeg.format('mpegts');
			}
			
			this.ffmpeg.on('start', (cmd) => {
				debug( this.channel, name, cmd);
			})
			// end event
			this.ffmpeg.on('end', () => {
				debug( name + ' has finished streaming');
				this.end = false;	
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
			// progress reports
			var debounced = _.throttle((progress) => {
				Broadcast.notify('progress report', {
					channel: opts.channel,
					progress: progress
				});
			}, opts.progressTime || 1000, { 'trailing': false, 'leading': true });
			if(opts.progress) {
				this.ffmpeg.on('progress', (progress) => {
					this.progress = progress;
					
					if(opts.channel) {
						//debug( 'notify progress');
						debounced(progress);
					}
				});
			}
			if (opts.output) {
				this.ffmpeg.output(opts.output).run();
			} else {
				this.ffmpeg.stream(this.stream, {end: false}); 
			}
			
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
		
		});	

		return this;
	}
}

