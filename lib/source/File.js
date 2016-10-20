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

var debug = require('debug')('snowstreams:lib:source:file');
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

	return function File(opts, callback) {
		
		if (!(this instanceof File)) return new File(opts, callback);
		
		var _this = this;
				
		var name = opts.name || opts.title;
		
		debug('process file ' + name);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}

		if(!_.isString(name)) {
			callback('name must be a String');
			return false;
		}
		
		if(!_.isString(opts.file)) {
			callback('path must be a String');
			return false;
		}
		
		this.fluent = opts.fluent !== false;
		
		_.defaults(this, opts);
		
		/*
		var ret = fs.lstat(this.file, (err, stats) => {
			if (!err && stats.isFile()) {
				// Yes it is
			} else {
				debug( 'file check failed.  Might not be a local file', this.file);
				//callback('file check failed.  Might be local');
			}
		});
		*/
		
		this.stream = Broadcast.Stream.bridge();
		
		// video or not
		if (this.fluent) {
			
			// make sure you set the correct path to your video file
		   this.ffmpeg = ffmpeg(opts.file);
			if(opts.seek) {
				this.ffmpeg.seekInput(opts.seek);
			}
			this.ffmpeg
				.inputOptions('-re')
				.format("mpegts")
				.addOptions([
					"-c copy",
					"-bsf h264_mp4toannexb",
					"-tune zerolatency",
					"-map 0",
					"-movflags faststart",
					"-strict experimental"
				])
				// setup event handlers
				.on('end', () => {
					debug('file ' + name + ' has finished streaming');
					
					// remove the remove event from Asset				
					if(_.isFunction(opts.end)) {
						opts.end(name);
					}
				})
				.on('error', function(err) {
					debug('file ' + name + ' message: ' + err.message);
					
					if(_.isFunction(opts.end)) {
						opts.end(name);
					}
				})
				.pipe(this.stream, {end: false}); 
		} else {
			// non-video or non fluent-ffmpeg stream
			// create a new stream
			readable(opts, this.stream);
		}
		
		this.end = (callback) => {
			debug('file ' + name + ' is being terminated.');
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
		
		debug('Created new stream', Broadcast.isReadableStream(this.stream));
		callback(null, this);
		return this;
	}
}


function readable (opts, stream) {
	var r  = fs.createReadStream(opts.file, { autoClose: false });
	ratelimit(r, 250 * 1024); //7 * 188   7200 * 8
	//r.pipe(transform);
	r.on('data', function(data) {
		//debug("send chunk");
		chunkit(data, stream);
	});
	r.on('end', function() {
		if(opts.loop) {
			//debug('readable looping');
			return readable(opts, stream);
		}
		if(_.isFunction(opts.end)) {
			opts.end();
		}
		debug('file done streaming');
	});
}
function chunkit (chunk, stream) {
	var ok = stream.write(chunk);
	if(!ok) {
		//transform.once('drain', write);
	}
}
