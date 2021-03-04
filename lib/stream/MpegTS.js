/**
 * 
 * ffmpeg -i 'udp://localhost:1234?fifo_size=1000000&overrun_nonfatal=1' -crf 30 -preset ultrafast -acodec aac -strict experimental -ar 44100 -ac 2 -b:a 96k -vcodec libx264 -r 25 -b:v 500k -f segment -segment_time 10 -segment_list_flags +live -segment_list_size 5 -segment_list_type m3u8 -segment_list test.m3u8 -segment_format mpegts stream%05d.ts
 * 
 * */
var debuger = require('debug')('woobi:lib:source:mpegts');
var _ = require('lodash');
// node streams
var fs = require('fs');  
var path = require('path');


/**
 * Creates a source stream from a udp stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.MpegTS({}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

module.exports = function(Broadcast) {

	return function MpegTS(opts, callback) {
		
		if (!(this instanceof MpegTS)) return new MpegTS(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		this.name = opts.name || Broadcast.randomName();
		this.source = opts.source;
		this.path = opts.path || path.join(__dirname, '../', '../', 'video/');
		this.urlPath = opts.urlPath || '/video/';
		this.channel = opts.channel || 'Floater';
		
		debug(this.path + ' - ' +'process MpegTS ' + this.name);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}

		if(!_.isString(this.name)) {
			callback('name must be a String');
			return false;
		}
		
		if(!_.isString(this.source)) {
			callback('source must be a String');
			return false;
		}
		
		this.options = opts	
		
		this.stream = Broadcast.Stream.bridge();	
			
		this.video = opts.video || ['-vcodec', 'libx264', '-r', '25', '-b:v', '2500k'];
		this.audio = [];//opts.audio || ['-acodec', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '96k']
		this.other = opts.other || ['-crf', '25', '-preset', 'ultrafast', '-strict','experimental'];
		this.segmentFile = path.join(this.path, this.name + '.m3u8');
		this.segment = opts.segment || ['-f', 'segment', '-segment_time', '10', '-segment_list_flags', '+live', '-segment_list_size', '5', '-segment_list_type', 'm3u8', '-segment_list',  this.segmentFile, '-segment_format', 'mpegts'];
		this.filename = path.join(this.path, this.name+ '%05d.ts');
		
		var program = opts.program || 'ffmpeg'
		var arg = _.concat(["-i"], this.source, this.other, this.audio,  this.video,  this.segment,  [this.filename]);
		// hls for fluent-ffmpeg
		//.format('ssegment')
		//.addOption('-segment_time 10')
		//.addOption('-segment_list_flags +live')
		//.addOption('-segment_list_size 0')
		//.addOption('-segment_format mpegts')
		//.addOption('-segment_list_type m3u8')
		//.addOption('-segment_list ' + this.segmentFile)
		debug(program + arg.join(' '));
		
		this.program = Broadcast.addProgram(this.name + '-MpegTS', {
			respawn: true,
			program: program,
			arg: arg
		}, (err, program) => {
			program.stream.pipe(this.stream, { end: false });
			Broadcast.streams[this.name] = program.stream;
		});
		
		this.link = path.join('/', this.urlPath, this.segmentFile);
		
		debug('Created new MpegTS', this.name, Broadcast.isReadableStream(this.stream));
		callback(null, this);
		return this;
	}
}
