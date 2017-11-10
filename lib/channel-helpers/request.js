var Promise = require('bluebird');

module.exports = function(Broadcast) {
	return function (opts) {
		return new Promise( ( resolve, reject ) => {
			this.requests.push(Broadcast.Source.Request( opts, ( err, stream ) => {
				if( err ) {
					reject( err );
				}
				// add the source if not explicitly told not to
				if( opts.playSource !== false ) {
					this.debug( this.channel + ' - ' + 'Add Request Sink to Sources');
					this.addSource(stream, () => {});
				}
				this.end.push( { name: stream.name, end: stream.end } );
				//console.log( ' resolve stream ');
				resolve( stream );
			}));
		});
	}
}
