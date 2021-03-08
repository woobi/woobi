
var stream = require('stream');
var util = require('util');
var Transform = stream.Transform;
var fs = require('fs');
var debug = require('debug')('woobi:streams:continuous');

util.inherits(Broadcast, Transform);
/** 
 * Continuos Streaming
 * meant to mimic a broadcast channel that does not lose connection during video loss/switch
 * */
function Broadcast(options) {
	// allow use without new
	if (!(this instanceof Broadcast)) {
		return new Broadcast(options);
	}

	// init Transform
	Transform.call(this, options);
}

Broadcast.prototype._transform = function (chunk, enc, cb) {
	
	if(chunk != null) {
		this.push(chunk, enc);
		cb();
	} else {
		debug("add filler data");
		// filler stream data
		var readableStream = fs.createReadStream('../content/filler.mp4');
		readableStream.on('readable', function() {
			this.push(readableStream.read());
			cb();
		});
		readableStream.on('end', function() {
			//create a new stream
			var readableStream = fs.createReadStream('../content/filler.mp4');
			var readFiller = '';
		});
	}
	
};
/** 
 * Manage broadcast channels
 * @module Continous 
 * 
 * */
module.exports = Broadcast;
