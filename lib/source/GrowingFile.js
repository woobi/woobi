/**
 * Creates a stream from a growing file
 *
 * ####Example:
 *
 *     Broadcast.Source.GrowingFile()
 *
 *    
 * @api public
 */

var debug = require('debug')('woobi:source:GrowingFile');
var _ = require('lodash');
var Readable = require("stream").Readable
var inherits = require("util").inherits
var fs = require('fs-extra');
var EventEmitter = require('events').EventEmitter;
var Leaky = require('../node-streams/leaky');

module.exports = function(Broadcast) {
	
	var GrowingFile = function ( options ) {
		debug('GrowingFile passthrough stream');		
		
		if ( !( this instanceof GrowingFile ) ) {
			return new GrowingFile( );
		}
		
		EventEmitter.call( this );
		
		this.name = options.name || Broadcast.randomName( );
				
		this.stream = new Leaky( );
		
		this.endMe = 0;
		
		this._offset = options.start || 0;
		
		var readableStream;
		
		var create = ( options ) => {
			if ( this.endMe > 50 ) {
				return;
			}
			options.start = this._offset;
			//debug(options);
			readableStream = fs.createReadStream( options.file, options );
			readableStream.on('readable', ( ) => {
				this.emit("open", {});
				var data = readableStream.read();
				if ( data === null ) {
					//debug('null data')
					// no more data... restart the stream after 500
					//setTimeout( create, 500, options );
				} else {
					//debug('write data')
					this.endMe = 0;
					this._offset += data.length;
					this.stream.write( data );
				}
			});
			readableStream.on('end', ( ) => {
				//debug('readable end', this.endMe)
				this.endMe++;
				debug(' restart stream');
				//create a new stream
				if( this.endMe < 50 ) {
					setTimeout( create, 2000, options );
				}
			});
		}
		
		create( options );
		
		
		
		this.end = () => {
			this.endMe = 51;
			if ( typeof readableStream == 'object' && readableStream.destroy ) {
				readableStream.destroy();
			}
		}
				
		return this;
		
	}
	
	inherits( GrowingFile, EventEmitter );
	
	return GrowingFile;
}

