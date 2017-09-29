/**
 * library adapter
 *
 * ####Example:
 *
 * @param {Instance} Broadcast
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('woobi:core:adapter');
var _ = require('lodash');

var Adapter = function ( Broadcast, opts, callback ) {
	if ( !( this instanceof Adapter ) ) return new Adapter( Broadcast, opts, callback );
	
	debug('Adapter');
	// adapter methods
	var Adapters = Broadcast.import('lib/core/adapters');
	
	if(_.isFunction(opts.adapter)) {
		var useAdapter = opts.adapter;
	} else if ( _.isString( opts.adapter ) && _.isFunction( Adapters[opts.adapter] ) ) {
		var useAdapter = Adapters[opts.adapter];
	} else if ( _.isFunction( opts.adapter ) ) {
		var useAdapter = opts.adapter;
	} else {
		var useAdapter = Adapters['media'];
	}
	
	this.adapter = useAdapter( opts.config, ( ) => {
			if ( _.isFunction( callback ) ) {
				callback( null, this );
			}
	});		
	return this;
}


/* Connection Agents */
/** socketConnect **/
Adapter.prototype.socketConnect = function ( obj = {} ) {
	if( _.isFunction( this.adapter.socketConnect ) ) {
		return this.adapter.socketConnect( obj );
	} else {
		console.log( 'socketConnect adapter function is missing!' );
		return false;
	}
}

/** connect **/
Adapter.prototype.connect = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.connect ) ) {
		return this.adapter.connect( obj );
	} else {
		console.log( 'connect adapter function is missing!' );
		return false;
	}
}

/* Start Live TV */
/** getTVChannels **/
Adapter.prototype.getTVChannels = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.getTVChannels ) ) {
		return this.adapter.getTVChannels( obj );
	} else {
		console.log( 'channels adapter function is missing!' );
		return false;
	}
}

/** getChannelGroups **/
Adapter.prototype.getChannelGroups = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.getChannelGroups ) ) {
		return this.adapter.getChannelGroups( obj );
	} else {
		console.log( 'getChannelGroups adapter function is missing!' );
		return false;
	}
}

/** getGuideData **/
Adapter.prototype.getGuideData = function ( channels, start, end ) {
	if ( _.isFunction( this.adapter.getGuideData ) ) {
		return this.adapter.getGuideData( channels, start, end );
	} else {
		console.log( 'getGuideData adapter function is missing!' );
		return false;
	}
}

/** getSeriesTimers **/
Adapter.prototype.getSeriesTimers = function ( obj = {} ) {
	if(_.isFunction(this.adapter.getSeriesTimers)) {
		return this.adapter.getSeriesTimers( obj );
	} else {
		console.log( 'getSeriesTimers adapter function is missing!' );
		return false;
	}
}

/** getTimers **/
Adapter.prototype.getTimers = function ( obj = {} ) {
	if (_.isFunction( this.adapter.getTimers ) ) {
		return this.adapter.getTimers( obj );
	} else {
		console.log( 'getGuideData adapter function is missing!' );
		return false;
	}
}

/* Start Local Media */
/** generic media files **/
Adapter.prototype.mediaFiles = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.mediaFiles ) ) {
		return this.adapter.mediaFiles( obj );
	} else {
		console.log( 'mediaFiles adapter function is missing!' );
		return false;
	}
}

/** generic media file **/
Adapter.prototype.mediaFile = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.mediaFile ) ) {
		return this.adapter.mediaFile( obj );
	} else {
		console.log( 'mediaFile adapter function is missing!' );
		return false;
	}
}

/** recent tv episodes **/
Adapter.prototype.recentEpisodes = function ( num = 25 ) {
	if ( _.isFunction( this.adapter.recentEpisodes ) ) {
		return this.adapter.recentEpisodes( num );
	} else {
		console.log( 'recentEpisodes adapter function is missing!' );
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShows = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.tvShows ) ) {
		return this.adapter.tvShows( obj );
	} else {
		console.log( 'tvShows adapter function is missing!' );
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShowByName = function ( name ) {
	if ( _.isFunction( this.adapter.tvShowByName ) ) {
		return this.adapter.tvShowByName( name );
	} else {
		console.log( 'tvShowByName adapter function is missing!' );
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShowByIMDB = function ( name ) {
	if ( _.isFunction( this.adapter.tvShowByIMDB ) ) {
		return this.adapter.tvShowByIMDB( name );
	} else {
		console.log( 'tvShowByIMDB adapter function is missing!' );
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShow = function ( showID ) {
	if ( _.isFunction( this.adapter.tvShow ) ) {
		return this.adapter.tvShow( showID );
	} else {
		console.log( 'tvShow adapter function is missing!' );
		return false;
	}
}

/** show episodes **/
Adapter.prototype.tvShowEpisodes = function( showID ) {
	if ( _.isFunction( this.adapter.tvShowEpisodes ) ) {
		return this.adapter.tvShowEpisodes( showID );
	} else {
		console.log( 'tvShowEpisodes  adapter function is missing!' );
		return false;
	}
}

/** recent movies **/
Adapter.prototype.recentMovies = function ( num = 25 ) {
	if ( _.isFunction( this.adapter.recentMovies ) ) {
		return this.adapter.recentMovies( num );
	} else {
		console.log( 'recentMovies adapter function is missing!' );
		return false;
	}
}

/** movies **/
Adapter.prototype.movies = function ( obj = {} ) {
	if ( _.isFunction( this.adapter.movies ) ) {
		return this.adapter.movies( obj );
	} else {
		console.log( 'movies adapter function is missing!' );
		return false;
	}
}

/** movie **/
Adapter.prototype.movie = function ( idShow ) {
	if ( _.isFunction( this.adapter.movie ) ) {
		return this.adapter.movie( idShow );
	} else {
		console.log( 'movies adapter function is missing!' );
		return false;
	}
}

/** movieByIMDB **/
Adapter.prototype.movieByIMDB = function( IMDB ) {
	if( _.isFunction( this.adapter.movieByIMDB ) ) {
		return this.adapter.movieByIMDB( IMDB );
	} else {
		console.log( 'movieByIMDB adapter function is missing!' );
		return false;
	}
}

/** movieByName **/
Adapter.prototype.movieByName = function ( name ) {
	if( _.isFunction( this.adapter.movieByName ) ) {
		return this.adapter.movieByName( name );
	} else {
		console.log( 'movies adapter function is missing!' );
		return false;
	}
}


module.exports = Adapter;

	
