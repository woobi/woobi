

/**
 * 
 * ffmpeg -i 'udp://localhost:1234?fifo_size=1000000&overrun_nonfatal=1' -crf 30 -preset ultrafast -acodec aac -strict experimental -ar 44100 -ac 2 -b:a 96k -vcodec libx264 -r 25 -b:v 1500k -f segment -segment_time 10 -segment_list_flags +live -segment_list_size 5 -segment_list_type m3u8 -segment_list test.m3u8 -segment_format mpegts stream%05d.ts
 * 
 * */
var debuger = require('debug')('woobi:lib:stream:hls');
var debug = debuger;
var _ = require('lodash');
// node streams
var fs = require('fs-extra');  
var path = require('path');
var findRemoveSync = require('find-remove');
var ffmpeg = require('fluent-ffmpeg');
/**
 * Creates a source stream from a udp stream
 *
 * ####Example:
 *
 *     Broadcast.Source.HLS({}, callback)
 *
 * @module    
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */
module.exports = function(Broadcast) {

	return function HLS(opts, callback) {
		
		if (!(this instanceof HLS)) return new HLS(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;

		this.name = opts.name || Broadcast.camelCaseSanitize(Broadcast.randomName());
		
		this.channel = opts.channel || this.name;
		
		this.id = opts.id || this.name;

		if(opts.useSource) {
			var sour = Broadcast.streams[opts.useSource];
			if(Broadcast.isReadableStream(sour)) {
				debug(this.channel + ' - use alternate source');
				this.source = sour;
			} else {
				callback('useSource must be the name of a useable source');
				return false; 
			}
		} else {
			this.source = opts.source;
		}
		
		if(!this.source) {
			callback('source must be included');
			return false;
		}
		this.mediaPath = 
		this.path = opts.path || path.join(Broadcast.wobblePath, this.id);
		
		this.urlPath = opts.urlPath || path.join('/', Broadcast.get('proxy api'), 'play', 'hls',  this.id);
		this.channel = opts.channel || 'Floater';
				
		if(!_.isFunction(callback)) {
			callback = function(){}
		}
		
		if(!_.isFunction(opts.crash)) {
			opts.crash = function(){}
		}

		if(!_.isString(this.name)) {
			callback('name must be a String');
			return false;
		}
		
		debug(this.path + ' - ' +' HLS ' + opts.id);
		
		this.options = opts	
		
		// make sure we have a dir and clean any files older than 3 hours
		//fs.emptyDirSync(this.path);
		//if(opts.removeFiles) {
		findRemoveSync(this.path, {extensions: '.ts'});
		//}
		
		// set up and interval to clean the dir
		let cleanRate = (opts.cleanRate);
		this.interval = setInterval(() => {
			debug('HLS clean ts files');
			try {
				findRemoveSync(this.path, {age: {seconds: cleanRate || 1200}, extensions: '.ts'});
			} catch(e) {
				debug(e);
			}
		}, cleanRate * 1000 || 1200000); //3600000
		
		//this.stream = Broadcast.Stream.bridge();	
		
		this.segmentFile = path.join(this.path, '_' + this.id + '.m3u8');
		
		this.crash = () => {
			if(_.isFunction(opts.crash)) {
				opts.crash();
			}
		}
		
		this.end = (callback) => {
			debug(opts.id + ' - ' +'HLS ' + this.name + ' is being terminated.');
			if (this.program) {
				this.crash = ()=>{debug('callback');callback()};
				this.program.kill();
				return;
			} else if (callback) {
				callback();
			}
		}
		
		debug('process HLS ' + this.name);
		this.program = ffmpeg(this.source)
		// use custom options if available
		if (opts.inputOptions) {
			this.program.inputOptions(opts.inputOptions);
		}
		if (opts.outputOptions) {
			this.program.addOptions(opts.outputOptions);
		}
		if (opts.videoFilters) {
			this.program.videoFilters(opts.videoFilters);
		}
		if (opts.onlyOptions) {
			// user supplied options
			this.program.addOptions(opts.onlyOptions);
		} else if (opts.passthrough) {
			debug('HLS media passthrough');
			// copy the current stream codecs
			this.program.addOption("-c", "copy")
			.addOption("-bsf:v h264_mp4toannexb");
		} else {
			if(opts.muxVideo) {
				debug('HLS encode video');
				// set video bitrate
				this.program.videoBitrate(opts.videoBitrate || 2000)
				// set h264 preset
				.addOption('-preset ultrafast')
				.addOption('-sn')
				// set target codec
				.videoCodec(opts.videoCodec || 'libx264')
			} else {
				debug('HLS passthrough video');
				// copy the current stream codecs
				this.program.addOption("-c:v", "copy")
				.addOption("-bsf:v h264_mp4toannexb");
			}
			if(opts.muxAudio) {
				debug('HLS encode audio');
				// set audio bitrate
				this.program.audioBitrate(opts.audioBitrate || '128k')
				// set audio codec
				.audioCodec(opts.audioCodec || 'aac')
				// audio freq
				.audioFrequency(opts.audioFrequency || 44100)
				// set number of audio channels
				.audioChannels(opts.audioChannels || 2)
			} else {
				debug('HLS passthrough audio');
				this.program.addOption("-c:a", "copy")
				.addOption("-bsf:v h264_mp4toannexb");
			}
		}
			
		if(opts.format) {
			this.program.format(opts.format);
		} else {
			this.program.format('hls');
		}
		if(opts.hlsOptions) {
			this.program.addOptions(opts.hlsOptions);
		} else {
			// hls
			this.program
			.addOption('-hls_time', 4)
			//.addOption('-hls_flags', 'discont_start+split_by_time+append_list+omit_endlist+program_date_time+delete_segments')
			.addOption('-hls_flags', 'split_by_time ')
			.addOption('-hls_flags', 'append_list')
			.addOption('-hls_flags', 'omit_endlist')
			.addOption('-hls_flags', 'program_date_time')
			//.addOption('-hls_flags', 'delete_segments')
			//.addOption('-hls_flags', 'single_file')
			//.addOption('-hls_flags', 'discont_start')
			// include all(0) or num of segments in the list
			.addOption('-hls_list_size', 0)
			//.addOption('-hls_delete_threshold', 30)
			// setup event handlers
		}
			
		this.program.on('start', (commandLine) => {
				debug('Spawned Ffmpeg with command: ' + commandLine);
				callback(null, this);
			})
			.on('end', function() {
				debug('file has been converted succesfully');
			})
			.on('error', (err) => {
				debug('an error happened in hls: ' + err.message);
				this.crash();
			});
		if(opts.progress) {
			// progress reports
			var debounced = _.throttle((progress) => {
					Broadcast.lodge.emit('progress report', {
						channel: this.channel,
						progress: progress
					});
				}, 
				opts.progressTime || 1000, 
				{ 'trailing': false, 'leading': true }
			);
			
			this.program.on('progress', (progress) => {
				this.progress = progress;
				if(opts.channel) {
					debounced(progress);
				}
			})
		}
		// save to file
		this.program.save(this.segmentFile);
		
		return this;
		
	}
}
