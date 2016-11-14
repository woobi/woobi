/**
 * Creates a source stream from a udp stream
 *
 * ####Example:
 *
 *     Broadcast.Source.HLS({}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

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

module.exports = function(Broadcast) {

	return function HLS(opts, callback) {
		
		if (!(this instanceof HLS)) return new HLS(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;

		this.name = opts.name || Broadcast.randomName();
		
		this.channel = opts.channel || this.name;
			
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
		this.path = opts.path || path.join(Broadcast.mediaPath, 'channels', this.channel);
		
		this.urlPath = opts.urlPath || path.join('/', 'alvin', 'play', 'hls',  this.channel);
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
		
		debug(this.path + ' - ' +' HLS ' + this.name);
		
		this.options = opts	
		
		// make sure we have a dir and clean any files older than 3 hours
		fs.emptyDirSync(this.path);
		if(opts.removeFiles) {
			findRemoveSync(path.join(Broadcast.mediaPath, 'channels', this.channel), {extensions: '.ts'});
		}
		
		// set up and interval to clean the dir
		this.interval = setInterval(() => {
			debug('HLS clean ts files');
			findRemoveSync(this.path, {age: {seconds: 3600}, extensions: '.ts'});
		}, 600000); //3600000
		
		//this.stream = Broadcast.Stream.bridge();	
		
		this.segmentFile = path.join(this.path, this.channel + 'BB.m3u8');
		
		this.crash = () => {
			if(_.isFunction(opts.crash)) {
				opts.crash();
			}
		}
		
		this.link = 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', this.urlPath, this.channel + '.m3u8');
		
		this.end = (callback) => {
			debug(opts.channel + ' - ' +'HLS ' + this.name + ' is being terminated.');
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
		if (opts.onlyOptions) {
			// user supplied options
			this.program.addOptions(opts.onlyOptions);
		} else if (opts.passthrough) {
			// copy the current stream codecs
			this.program.addOption("-c", "copy")
			.addOption("-bsf h264_mp4toannexb");
		} else {
			// set video bitrate
			this.program.videoBitrate(2000)
			// set h264 preset
			.addOption('-preset ultrafast')
			.addOption('-sn')
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
			.addOption('-hls_time', 10)
			//.addOption('-hls_wrap', parseFloat(opts.wrap) || 180)
			.addOption('-hls_flags', 'discont_starts')
			.addOption('-hls_flags', 'append_list')
			.addOption('-hls_flags', 'omit_endlist')
			.addOption('-hls_flags', 'program_date_time')
			.addOption('-hls_flags', 'delete_segments')
			// include all the segments in the list
			.addOption('-hls_list_size', 0)
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
				debug('an error happened in hls: ' + err.message, opts.arg);
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
