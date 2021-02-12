/**
 * Creates a http connection to receive data 
 *
 * ####Example:
 *
 *     Broadcast.Source.Request({port:10000,host:'224.0.0.251'}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('woobi:source:Request');
var _ = require('lodash');
// node streams
var dgram = require('dgram');
var request = require('request');

module.exports = function(Broadcast) {
	
	return function Request(opts, callback) {
		
		if (!(this instanceof Request)) return new Request(opts, callback);
		
		var _this = this;
		
		if(!_.isFunction(callback)) {
			//debug('no callback');
			var callback = function(){}
		}
		
		if ( typeof opts === 'string' ) {
			opts = {
				uri: opts
			}
		}
		
		debug('Request', opts);
		
		if(!opts.uri) {
			callback('Request uri must be a String');
			return _this;
		}
		
		
		var Asset = this;
		
		Asset.name = Broadcast.randomName('Request');
		
		_.defaults(Asset, opts);
						
		// create the new stream
		Asset.stream = Broadcast.Stream.bridge();
		Asset.stream.on('pipe', (src) => {
			debug(Asset.name + ' - ' +'something is piping into the Request bridge');
			Broadcast.emit('Request ' + Asset.name, { status: 'stream pipe' });
		})
		.on('unpipe', (src) => {
			debug(Asset.name + ' - ' +'something unpiped from the Request bridge', src);
			Broadcast.emit('Request ' + Asset.name, { status: 'stream unpipe' });
		})
		.on('drain', (src) => {
			
		})
		.on('error', (err) => {
			debug(Asset.name + ' - ' +'err from the Request bridge');
			Broadcast.emit('Request ' + Asset.name, { status: 'stream error', error: err });
		})
		.on('close', () => {
			debug(Asset.name + ' - ' +'Request bridge closed');
			Broadcast.emit('Request ' + Asset.name, { status: 'stream close' });
		})
		.on('end', () => {
			debug(Asset.name + ' - ' +'Request bridge end');
			Broadcast.emit('Request ' + Asset.name, { status: 'stream end' });
		})
		.on('finish', () => {
			debug(Asset.name + ' - ' +' Request bridge finished' );
			Broadcast.emit('Request ' + Asset.name, { status: 'stream finish' });
		});	
		
		Broadcast.streams[Asset.name] = Asset.stream;
				
		this._request = request(opts.uri)
		.on('error', function(err) {
			callback( err );
			debug( 'Error', err );
		})
		.on('response', function(response) {
			//debug(response.statusCode, response.headers['content-type']) // 200
			callback( null, Asset )
			Broadcast.emit('Stream ' + Asset.name, { status: 'listening' });
			Asset.end = ( cb ) => { 
				if( typeof cb === 'function' ) {
					cb();
				}
				debug(' End Request Asset');
				Asset.stream.end();
				this._request.end();
			}
			
		})
		.pipe(Asset.stream);

		return Asset;
		
	}

}
