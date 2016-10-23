/**
 * Throttles a stream stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.throttle()
 *
 *    
 * @api public
 */

var debug = require('debug')('snowstreams:stream:throttle');
var Throttle = require('throttle');
var PassThrough = require('stream').PassThrough;
var _ = require('lodash');

module.exports = function(Broadcast) {
	
	return function throttle(source, rate, onEnd) {
		
		if (!(this instanceof throttle)) return new throttle(source, rate, onEnd);
		
		// throttle the final stream for real time transmission
		// sources should provide a bitRate from ffprobe.
		// send the throttle as (bitRate / 1000)
		if(!rate) {
			rate = 1000;
			debug('rate not set');
		}
		
		rate = Math.round(rate);
		
		debug(source.name + ' - stream via throttle at ' + rate + ' bytes/sec');
		
		var stream = new PassThrough();
				
		var sourceStream = source.stream.pipe(new Throttle(rate));
		
		var throtled = _.throttle(() => {
				debug(source.name + ' - throttle pushing data');
			}, 10000, { 'trailing': false });
		sourceStream.on('data', (chunk) => {
			// echo sometimes
			//debug(source.name + ' - throttle pushing data');
			throtled();
			stream.write(chunk);
		});
		sourceStream.on('end', () => {
			debug(source.name + ' - throttle has finished streaming');
			if (typeof onEnd === 'function') {
				onEnd();
			}
		})
		sourceStream.on('error', (err) => {
			debug(source.name + ' -  throttle message: ' + err.message);
			if (typeof onEnd === 'function') {
				onEnd();
			}
		})
			
		return stream;
	}
}
