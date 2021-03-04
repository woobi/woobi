var debug = require('debug')('woobi:source:Stream');
var _ = require('lodash');
// node streams


/**
 * Creates a stream to receive data 
 *
 * ####Example:
 *
 *     Broadcast.Source.Stream({}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */


module.exports = function(Broadcast) {
	
	return function Stream(opts, callback) {
		
		if (!(this instanceof Stream)) return new Stream(opts, callback);
		
		var _this = this;
		
		if(!_.isFunction(callback)) {
			//debug('no callback');
			var callback = function(){}
		}
		
		if(!opts.stream) {
			callback('A stream must be supplied');
			return false;
		}
		if ( !Broadcast.isReadableStream(opts.stream) ) {
			callback('A stream must be supplied');
			return false;
		}
		
		debug('Stream', opts);
		
		var Asset = this;
		
		Asset.name = opts.name || Broadcast.randomName('Stream');
		Asset._stream = opts.stream;
		//_.defaults(Asset, opts);
		
		// create the new stream
		Asset.stream = Broadcast.Stream.bridge();
		Asset.stream.on('pipe', (src) => {
			debug(Asset.name + ' - ' +'something is piping into the Stream bridge');
			Broadcast.emit('Stream ' + Asset.name, { status: 'stream pipe' });
		})
		.on('unpipe', (src) => {
			debug(Asset.name + ' - ' +'something unpiped from the Stream bridge', src);
			Broadcast.emit('Stream ' + Asset.name, { status: 'stream unpipe' });
		})
		.on('drain', (src) => {
			
		})
		.on('error', (err) => {
			debug(Asset.name + ' - ' +'err from the Stream bridge');
			Broadcast.emit('Stream ' + Asset.name, { status: 'stream error', error: err });
		})
		.on('close', () => {
			debug(Asset.name + ' - ' +'Stream bridge closed');
			Broadcast.emit('Stream ' + Asset.name, { status: 'stream close' });
		})
		.on('end', () => {
			debug(Asset.name + ' - ' +'Stream bridge end');
			Broadcast.emit('Stream ' + Asset.name, { status: 'stream end' });
		})
		.on('finish', () => {
			debug(Asset.name + ' - ' +' Stream bridge finished' );
			Broadcast.emit('Stream ' + Asset.name, { status: 'stream finish' });
		})
		
		// pipe the user stream
		Asset.stream.pipe(opts.stream);
		
		Broadcast.emit('Stream ' + Asset.name, { status: 'streaming' });
		Asset.end = ( callback ) => { 
			if(callback) {
				callback();
			}
			Asset.stream.end();
		}
		
		Broadcast.streams[Asset.name] = Asset.stream;
		
		
		callback(err, Asset)
		
		return Asset;
		
	}

}
