/** Transform stream into smaller sizes
 * 
 * */
var stream = require('stream');
var util = require('util');
var chunkingStreams = require('chunking-streams');

var Transform = stream.Transform;


util.inherits(Seven, Transform);

function Seven(options) {
	// allow use without new
	if (!(this instanceof Seven)) {
		return new Seven(options);
	}

	// init Transform
	Transform.call(this, options);
}

Seven.prototype._transform = function (chunk, enc, cb) {
	  
	var chunker = new SizeChunker({
		chunkSize: 188 * 7
	});
	 
	chunker.on('chunkEnd', function(id, done) {
		cb();
	});
	 
	chunker.on('data', function(chunk) {
		this.push(chunk.data, enc);
	});
};


/**
 *  try it out
 */
/* 
var upper = new Upper();
upper.pipe(process.stdout); // output to stdout
upper.write('hello world\n'); // input line 1
upper.write('another line');  // input line 2
upper.end();  // finish
}
*/
module.exports = Seven;
