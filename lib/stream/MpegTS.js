/**
 * Creates a source stream from a udp stream
 *
 * ####Example:
 *
 *     Broadcast.Source.MpegTS({}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

/**
 * 
 * ffmpeg -i 'udp://localhost:1234?fifo_size=1000000&overrun_nonfatal=1' -crf 30 -preset ultrafast -acodec aac -strict experimental -ar 44100 -ac 2 -b:a 96k -vcodec libx264 -r 25 -b:v 500k -f segment -segment_time 10 -segment_list_flags +live -segment_list_size 5 -segment_list_type m3u8 -segment_list test.m3u8 -segment_format mpegts stream%05d.ts
 * 
 * */
var debuger = require('debug')('snowstreams:lib:source:mpegts');
var debug = debuger;
var _ = require('lodash');
// node streams
var fs = require('fs-extra');  
var path = require('path');
var findRemoveSync = require('find-remove');

module.exports = function(Broadcast) {

	return function MpegTS(opts, callback) {
		
		if (!(this instanceof MpegTS)) return new MpegTS(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		this.name = opts.name || (+new Date).toString(36).slice(-15);
		this.source = opts.source;
		this.path = opts.path || path.join(__dirname, '../', '../', 'video/', this.name);
		
		this.urlPath = opts.urlPath || path.join('/video/', this.name);
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
		
		// make sure we have a dire and clean any files older than 3 hours
		fs.ensureDirSync(this.path);
		fs.emptyDirSync(this.path);
		
		// set up and interval to clean the dir
		this.interval = setInterval(() => {
			var ts = findRemoveSync(this.path, {age: {seconds: 10800}, extensions: '.ts'});
		}, 300000);
		
		this.stream = Broadcast.Stream.bridge();	
			
		this.video = opts.video || ['-vcodec', 'libx264', '-r', '25', '-b:v', '1500k'];
		this.audio = opts.audio || ['-acodec', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '96k']
		this.other = opts.other || ['-crf', '25', '-preset', 'ultrafast', '-strict','experimental'];
		this.segmentFile = path.join(this.path, this.name + '.m3u8');
		this.segment = opts.segment || ['-f', 'segment', '-segment_time', '10', '-segment_list_flags', '+live', '-segment_list_size', '5', '-segment_list_type', 'm3u8', '-segment_list',  this.segmentFile, '-segment_format', 'mpegts'];
		this.filename = path.join(this.path, this.name+ '%05d.ts');
		
		var program = opts.program || 'ffmpeg'
		var arg = opts.args ? _.concat(["-i"], opts.args) : _.concat(["-i"], this.source, this.other, this.audio,  this.video,  this.segment,  [this.filename]);

		debug(program + arg.join(' '));
		
		this.program = Broadcast.addProgram(this.name + '-MpegTS', {
			respawn: true,
			program: program,
			arg: arg
		}, (err, program) => {
			program.stream.pipe(this.stream, { end: false })
			
		});
		
		this.link = path.join('/', this.urlPath, this.segmentFile);
		
		debug('Created new MpegTS', this.name, Broadcast.isReadableStream(this.stream));
		callback(null, this);
		return this;
	}
}
