/**
 * Throttles a stream stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.broadcast(stream, rate)
 *
 *    
 * @api public
 */

var debug = require('debug')('woobi:stream:broadcast');
var Throttle = require('throttle');
var _ = require('lodash');

module.exports = function(Broadcast) {
	
	return function Broadcaster(source, rate, onEnd) {
		
		if (!(this instanceof Broadcaster)) return new Broadcaster(source, rate, onEnd);
		
		// throttle the final stream for real time transmission
		// sources should provide a bitRate from ffprobe.
		// send the throttle as (bitRate / 8)
		if(!rate) {
			// rate = (100 * 1024);
			debug('rate not set');
		} else {
			rate = Math.round(rate);
		}
		this.name = source.name || Broadcast.randomName();
		
		debug(source.name + ' - stream via broadcast at ' + (rate ? rate + ' bytes/sec' : ''));
		
		this.stream = new Broadcast.Stream.bridge();
		
		Broadcast.streams[this.name] = this.stream;
		
		debug('is source a stream', Broadcast.isReadableStream(source.stream));
			
		this.sourceStream = !rate ? source.stream : source.stream.pipe(new Throttle(rate));
		
		var throtled = _.throttle(
			() => {
				debug(source.name + ' - broadcast pushing data');
			},
			10000,
			{ 'trailing': false }
		);
		
		this.sourceStream.on('data', (chunk) => {
			throtled();
			this.stream.write(chunk);
		});
		this.sourceStream.on('end', () => {
			debug(source.name + ' - broadcast has finished streaming');
			if (_.isFunction(onEnd)) {
				onEnd();
			}
		})
		this.sourceStream.on('error', (err) => {
			debug(source.name + ' -  broadcast message: ' + err.message);
			if (_.isFunction(onEnd)) {
				onEnd();
			}
		})
			
		return this.stream;
	}
}
