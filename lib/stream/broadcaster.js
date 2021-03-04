

const debug = require('debug')('woobi:stream:broadcaster');
const Transform = require('stream').Transform;
const util = require('util');
/**
 * Sends a stream when clients are connected
 *
 * ####Example:
 *
 *     Broadcast.Stream.broadcaster(options)
 *   
 * @api public
 */
module.exports = function(Broadcast) {
	return function Broadcaster (options) {
		return new Transform({
			transform: function (chunk, encoding, done) {
				//debug('connected pipes: ', this._readableState.pipesCount );
				if(chunk !== null && this._readableState.pipesCount > 0 ) {
					//debug('push chunk')
					this._cache = chunk
					this.push(chunk);
					done();
				} else {
					//this.push(this._cache);
					debug('no data or receivers.  push_cache');
					done();
				}
			}
		});
	}
}
/*
module.exports = function(Broadcast) {
	
	return function Broadcaster (options) {
		if (!(this instanceof Broadcaster)) {
			return new Broadcaster(options);
		}
		Transform.call(this, options);
		debug('broadcaster stream');
	}
	
	util.inherits(Broadcaster, Transform);

	Broadcaster.prototype._transform (chunk, encoding, done) {
			debug('connected pipes: ', this);
			if(chunk !== null && this._readableState.pipesCount > 0 ) {
				this.push(chunk);
			} else {
				debug('no data or receivers.  Dismiss data');
				done();
			}
		}
	}
}
*/
