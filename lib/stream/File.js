/**
 * Save a source stream to file
 *
 * ####Example:
 *
 *     Broadcast.Stream.File({}, callback)
 *
 *     
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debuger = require('debug')('woobi:lib:stream:file');
var debug = debuger;
var _ = require('lodash');
// node streams
var fs = require('fs-extra');  
var path = require('path');
var moment = require('moment');
var ffmpeg = require('fluent-ffmpeg');

module.exports = function(Broadcast) {

	return function File(opts, callback) {
		
		if (!(this instanceof File)) return new File(opts, callback);
		
		var debug = opts.noDebug ? function(){} : debuger;
		
		var _this = this;
				
		this.name = opts.name;
		this.source = opts.stream || Broadcast.broadcaster;
		this.file = opts.file;
		this.start = moment().unix();
		this.maxLength = opts.maxLength || false;	
			
		debug(this.file + ' - ' +'process File ' + this.name);
		
		if(!_.isFunction(callback)) {
			callback = function(){}
		}

		if(!_.isString(this.name)) {
			callback('name must be a String');
			return false;
		}
		
		if(!_.isString(this.file)) {
			callback('file must be a String');
			return false;
		}
				
		this.options = opts;
		
		// start with a zero file size
		this.size = 0;
		
		// our file descriptor stream
		this.output = fs.createWriteStream( this.file );
		
		// create a bridge we can pause to truncate the file
		this.bridge = Broadcast.Stream.bridge();
		
		// pipe the incoming source into the bridge
		this.source.pipe( this.bridge );
		
		// pipe the bridge to the output to start
		this.bridge.pipe( this.output );
		
		this.link = this.file;
				
		this._info;
		
		this.info = () => {
			return new Promise( ( resolve, reject ) => {
				ffmpeg.ffprobe( this.file, ( err, metadata ) => {
					if ( err ) resolve( {} );
					let info;
					if ( metadata ) {
						const bitRate = metadata.format.bit_rate;
						const duration = metadata.format.duration;
						const start = metadata.format.start_time;
						const end = metadata.format.end;
						const size = metadata.format.size;
						//debug( 'got metadata', metadata.format, duration > this.truncate );
						this._info = {
							file: this.file,
							...metadata.format
						}
						//Broadcast.notify( this.name, this._info);
					} else {
						this._info = { };
					}
					resolve( this._info );
				});
			});
		};		
		
		this.sizeInterval = setInterval( () => {
			this.size = this.output.bytesWritten;
			if ( this.size > 500000 ) {  // 0.5MB file
				// debug('something is piping into the writer', this.name + '-writing');
				Broadcast.notify( this.name, {
					writing: true,
					info: this._info,
					written: this.size
				} );
			}
		}, 1000);
		
		if ( this.maxLength ) {
			// create an interval to check the length every 5 minutes and shorten it when needed
			this.truncateInterval = setInterval( () => {
				//if( this.output.bytesWritten > 0 ) debug( this.output )
				if( this.output._writableState.writing === true ) {
					this.info()
					.then( info => {
						// the maxLength is in seconds
						debug( info.duration, this.maxLength );
						if ( info.duration > this.maxLength + 30 ) {  
							debug('maxLength reached', info.duration);
							// pause the bridge so we can truncate the file
							this.bridge.pause();
							
							const truncate = info.size - ( ( info.bit_rate / 8 ) * this.maxLength );
							debug( 'truncate to: ', truncate );
							
							// end the out stream
							this.output.end();
							
							const newfile = this.file + '.woobi';
							return fs.stat( this.file)
							.then( file => {
								// restream it a new file losing the first bits
								return new Promise( resolve => {
									const bak = fs.createWriteStream( newfile );
									const prev = fs.createReadStream( this.file, { start: truncate } );
									prev.pipe(bak);
									prev.on('end', () => {
										bak.end();
										resolve( newfile )
									}) 
								})
							}) 
							.then( () => fs.unlink( this.file ) )// delete the old file
							.then( () => fs.rename( newfile, this.file ) )
							.then( () => {
								// create a new stream
								this.output = fs.createWriteStream( this.file, { flags: 'a' } );
								// resume the bridge 
								this.bridge.pipe( this.output );
								Broadcast.notify( this.name, {
									trucated: true,
									oldInfo: info
								} );
							});
								
						} else {
							return ''
						}
					}).catch(debug);
				}	
			}, 30000);
		}
		
		debug('Created new File Stream', this.name );
		
		callback(null, this);
		
		return this;
	}
}
