var debuger = require('debug')('woobi:lib:source:Fluent');
var _ = require('lodash');
// node streams
var fs = require('fs');  
var path = require('path');
// include the custom buffer duplex stream
var ratelimit = require('ratelimit');
var ffmpeg = require('fluent-ffmpeg');

/** 
 * Manage broadcast channels
 * @module Broadcat/Source 
 * 
 * */
module.exports = function(Broadcast) {

	return Fluent;

	/**
	 * Creates a source stream using Fluent \n\n   
	 *
	 * ####Example: \n\n   
	 *
	 *     Broadcast.source.Fluent(config, callback)\r\n\r\n
	 * @class
	 * @param {Object} config 
	 * @param {Function} callback
	 * @api public
	 */
	//ffmpeg.setFfmpegPath(path.join(Broadcast.get('module root'), 'bin'));
	function Fluent(opts, callback) {
		
		if (!(this instanceof Fluent)) return new Fluent(opts, callback);
		
		var config = Object.assign({
			progress: true,
			metadata: {}
		}, opts)

		
		var debug = config.noDebug ? function(){} : debuger;
		//debug('Fluent config', config)
		var _this = this;
				
		var name = this.name = config.name || config.title || Broadcast.randomName();
		
		this.channel = config.channel || name;
		
		debug(this.channel + ' - ' +' Fluent FFmpeg process file ' + name);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}

		if(!_.isString(name)) {
			callback('name must be a String');
			return false;
		}
		
		if(!_.isString(config.file) && !Broadcast.isReadableStream(config.stream)) {
			callback('Valid file or stream required');
			return false;
		}
		
		this.source = Broadcast.isReadableStream(config.stream) ? config.stream : config.file;
		
		_.defaults(this, config);
		
		this.stream = Broadcast.Stream.bridge();
		
		//check for a codec
		var hevc = false;
		
		if(_.isObject(config.metadata.fileinfo)) {
			var codec = config.metadata.fileinfo.streamdetails.video.codec.toLowerCase() || '';
			var lookin = ['hevc', 'x265', 'h265'];
			hevc = lookin.includes(codec)
			debug('codec', config.metadata.fileinfo.streamdetails.video.codec)
		}
		
		//debug('start ffprobe');
		if ( Broadcast.isReadableStream(config.stream) ) {
			finish.call(this);
		} else if(config.skipCheck) {
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
			if(config.seekInput) {
				this.ffmpeg.seekInput(config.seekInput);
			}
			if(config.progress) {
				if(config.progress.timemark) this.ffmpeg.seekInput(config.progress.timemark);
			}	
			if(config.seekByBytes) {
				this.ffmpeg.seekInput((config.seekByBytes / this.bitRate) * 8);
			}			
			// use custom options if available
			if(config.inputFormat) {
				this.ffmpeg.inputFormat(config.inputFormat);
			}	
			if (config.inputOptions) {
				this.ffmpeg.inputOptions(config.inputOptions);
			} else {
				this.ffmpeg.inputOptions(['-re']);
			}
			if (config.outputOptions) {
				this.ffmpeg.addOptions(config.outputOptions);
			} 
			if (config.videoFilters) {
				this.ffmpeg.videoFilters(config.videoFilters);
			}
			if (config.loop) {
				this.ffmpeg.inputOptions('-stream_loop', '-1')
			}
			//debug('start options');
			
			if (config.onlyOptions) {
				this.ffmpeg.addOptions(config.onlyOptions);
			} else if (config.image) {
				this.ffmpeg.loop(10).fps(29);
			} else if (config.encode || hevc ) {
				this.ffmpeg
				.videoBitrate(2500)
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
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if (config.overlay) {
				this.ffmpeg
				.addOption("-c:a copy")
				.addOption("-c:v libx264")
				.addOption('-preset', 'ultrafast')
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:a:0")
				.addOption("-map 0:v:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if ( config.streamable ) {
				this.ffmpeg
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-tune zerolatency")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-movflags faststart")
				.addOption("-strict experimental");
			} else if ( config.mpegts) {
				this.ffmpeg
				
				.addOption("-c:v", "libx264")
				.addOption("-bsf:v h264_mp4toannexb")
				.addOption("-map 0:v:0")
				.addOption("-map 0:a:0")
				.addOption("-vf", "yadif=1")
				.addOption('-preset', 'ultrafast')
				.addOption('-profile:v', 'high')
				.addOption('-crf', '27')
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
				if(!config.skipVideoCopy) {
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

			} else if ( config.muxAudio ) {
				//this.ffmpeg
				// copy video
				if(!config.skipVideoCopy) {
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
				if(!config.skipVideoCopy) {
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

			//this.ffmpeg.addOptions('-threads 12')

			if(config.format) {
				this.ffmpeg.format(config.format);
			} else if(!config.skipFormat) {
				this.ffmpeg.format('mpegts');
			}
			
			this.ffmpeg.on('start', (cmd) => {
				debug('Start Fluent stream', this.channel, name, cmd);
			})
			// end event
			this.ffmpeg.on('end', () => {
				debug( name + ' has finished streaming from Fluent');
				this.end = false;	
				if(_.isFunction(config.end)) {
					config.end(name);
				}
				
			})
			// error event
			this.ffmpeg.on('error', function(err) {
				debug( 'Error event fron fluent', name + ' message: ' + err.message, err);
				
				if(_.isFunction(config.end)) {
					config.end(name, true); // (name, true if error)
				}
			})
			this.ffmpeg.on('stderr', function(err) {
				if(config.debug) debug(err);		
			})
			// progress reports
			var debounced = _.throttle((progress) => {
				Broadcast.notify('progress report', {
					channel: config.channel,
					progress: progress
				});
				
			}, config.progressTime || 1000, { 'trailing': false, 'leading': true });
			if(config.progress) {
				this.ffmpeg.on('progress', (progress) => {
					this.progress = progress;
					if(Broadcast.channels[this.channel]) {
						if (Broadcast.channels[this.channel].currentSource) {
							Broadcast.channels[this.channel].currentSource.progress = progress;
						}
						
					}
					if(Broadcast.channels[this.channel]){
						if (Broadcast.channels[this.channel].sources[0]) {
							Broadcast.channels[this.channel].sources[0].progress = progress;
						} 
					}
					if(config.channel) {
						//debug( 'notify progress');
						debounced(progress);
					}
				});
			}
			if (config.output) {
				debug('config.output', config.output);
				this.ffmpeg.output(config.output).run();
			} else {
				this.ffmpeg.stream(this.stream, {end: false}); 
			}
			
			this.end = (callback) => {
				debug(config.channel + ' - ' +'file ' + name + ' is being terminated.');
				this.stream = false;
				this.norestart = true;
				if(this.ffmpeg) {
					// callback is called from the kill event
					config.end = callback;
					this.ffmpeg.kill();
				} else if(callback) {
					callback();
				}
			}
			
			this._log =  [];
			this.log = (entry) => {
				return this._log.push(entry)
			};
			
			debug(config.channel, config.name + ' - ' +'Created new stream', Broadcast.isReadableStream(this.stream));
			
			Broadcast.streams[this.name] = this.stream;

			callback(null, this);
		
		};	

		return this;
	}
}

