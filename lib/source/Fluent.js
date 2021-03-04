var debuger = require('debug')('woobi:lib:source:Fluent');
var _ = require('lodash');
// node streams
var fs = require('fs');  
var path = require('path');
// include the custom buffer duplex stream
var ratelimit = require('ratelimit');
var ffmpeg = require('fluent-ffmpeg');

//ffmpeg.setFfprobePath('avprobe');
/**
 * Creates a source stream using Fluent
 *
 * ####Example:
 *
 *     ss.source.Fluent({port:10000,host:'224.0.0.251'}, callback)
 *
 * @module     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */
module.exports = function(Broadcast) {
	//ffmpeg.setFfmpegPath(path.join(Broadcast.get('module root'), 'bin'));
	return function Fluent(opts, callback) {
		
		if (!(this instanceof Fluent)) return new Fluent(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		var name = this.name = opts.name || opts.title || Broadcast.randomName();
		
		this.channel = opts.channel || name;
		
		debug(this.channel + ' - ' +' Fluent FFmpeg process file ' + name);
		
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
		//debug('start ffprobe');
		if ( Broadcast.isReadableStream(opts.stream) ) {
			finish.call(this);
		} else if(opts.skipCheck) {
			finish.call(this)
		
		} else {
			ffmpeg.ffprobe(this.source, (err, metadata) => {
				if( err ) {
					debug(err);
					callback('ffprope Error' + err);
					return false;
				}
				
				finish.call(this, metadata);
			});
		}
		function finish ( metadata ) {
			if(!metadata) {
				metadata = { format: {}}
			}
			
			this.codecs = metadata;
			//debug(metadata);
			this.bitRate = metadata.format.bit_rate;
			this.duration = metadata.format.duration;
			this.start = metadata.format.start_time;
			this.end = metadata.format.end;
			this.size = metadata.format.size;
			//this.modified = stat.mtime;
			this.rangeRequest = false;
			//debug('start ffmpeg');
			// make sure you set the correct path to your video file
		    this.ffmpeg = ffmpeg(this.source, {
				stdoutLines: 0,
				logger: true
			});
			if(opts.seekInput) {
				this.ffmpeg.seekInput(opts.seekInput);
			}
			if(opts.progress) {
				this.ffmpeg.seekInput(opts.progress.timemark);
			}	
			if(opts.seekByBytes) {
				this.ffmpeg.seekInput((opts.seekByBytes / this.bitRate) * 8);
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

			//debug('start options');
			
			if (opts.onlyOptions) {
				this.ffmpeg.addOptions(opts.onlyOptions);
			} else if (opts.image) {
				this.ffmpeg.loop(10).fps(29);
			} else if (opts.encode) {
				this.ffmpeg
				.videoBitrate(2500)
				// set h264 preset
				.addOption('-preset fast')
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
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if (opts.overlay) {
				this.ffmpeg
				.addOption("-c:a copy")
				.addOption("-c:v libx264")
				.addOption('-preset', 'ultrafast')
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if ( opts.streamable ) {
				this.ffmpeg
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if ( opts.mpegts ) {
				this.ffmpeg
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-c:v", "libx264")
				.addOption("-vf", "yadif=1")
				.addOption('-preset', 'veryfast')
				.addOption('-profile:v', 'high')
				.addOption('-crf', '23')
				.addOption("-movflags")
				.addOption("+faststart")
				.addOption("-strict experimental");
				 
				//.videoBitrate(1800);

			} else if ( _.findIndex(metadata.streams, ['codec_type', 'audio']) < 0 ) {
				// we do not have an audio track so add a new one
				debug('#######################################');
				debug('Add audio track', _.findIndex(metadata.streams, ['codec_type', 'audio']))
				debug('#######################################');
				this.ffmpeg
				// copy video
				.addOption("-i", Broadcast.apad)
				.addOption("-t", this.duration);
				//  we need to skip copy sometimes like when adding text
				if(!opts.skipVideoCopy) {
					this.ffmpeg.addOption("-c:v", "copy");
				}
				this.ffmpeg
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				//.addOption("-map 0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental")
				
				.addOption("-acodec aac")
				.addOption("-ar 44100")
				.addOption("-ac 2")
				// set audio bitrate
				//.audioBitrate('128k')
				// set audio codec
				//.audioCodec('aac')
				// audio freq
				//.audioFrequency(44100)
				// set number of audio channels
				//.audioChannels(2)

			} else if ( opts.muxAudio ) {
				this.ffmpeg
				// copy video
				if(!opts.skipVideoCopy) {
					this.ffmpeg.addOption("-c:v", "copy");
				}
				this.ffmpeg.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental")
				// set audio bitrate
				.audioBitrate('128k')
				// set audio codec
				.audioCodec('aac')
				// audio freq
				.audioFrequency(44100)
				// set number of audio channels
				.audioChannels(2)	
								
			} else {
				// set video bitrate
				if(!opts.skipVideoCopy) {
					this.ffmpeg.addOption("-c:v", "copy");
				}
				this.ffmpeg.addOption("-c:a", "copy")
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} 

			this.ffmpeg.addOptions('-threads 12')

			if(opts.format) {
				this.ffmpeg.format(opts.format);
			} else if(!opts.skipFormat) {
				this.ffmpeg.format('mpegts');
			}
			
			this.ffmpeg.on('start', (cmd) => {
				debug('Start Fluent stream', this.channel, name, cmd);
			})
			// end event
			this.ffmpeg.on('end', () => {
				debug( name + ' has finished streaming from Fluent');
				this.end = false;	
				if(_.isFunction(opts.end)) {
					opts.end(name);
				}
			})
			// error event
			this.ffmpeg.on('error', function(err) {
				debug( name + ' message: ' + err.message, err);
				
				if(_.isFunction(opts.end)) {
					opts.end(name, true); // (name, true if error)
				}
			})
			this.ffmpeg.on('stderr', function(err) {
				if(opts.debug) debug(err);		
			})
			// progress reports
			var debounced = _.throttle((progress) => {
				Broadcast.notify('progress report', {
					channel: opts.channel,
					progress: progress
				});
				
			}, opts.progressTime || 1000, { 'trailing': false, 'leading': true });
			//if(opts.progress) {
				this.ffmpeg.on('progress', (progress) => {
					this.progress = progress;
					Broadcast.channels[this.channel].currentSource.progress = progress;
					Broadcast.channels[this.channel].sources[0].progress = progress;
					
					if(opts.channel) {
						//debug( 'notify progress');
						debounced(progress);
					}
				});
			//}
			if (opts.output) {
				debug('Opts.output', opts.output);
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
		
		};	

		return this;
	}
}

