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
	} else {
		var useAdapter = Adapters['media'];
	}
	
	this.adapter = useAdapter( opts.config, ( ) => {
		debug('Adapter finished... callback');
			if ( _.isFunction( callback ) ) {
				callback( null, this );
			}
	});	
	
	const methods = opts.methods ?
		opts.methods
	:
		['socketConnect', 'dbConnect', 'connect', 'connection', 'endSession', 'query', 'getTVChannels', 'getChannelGroups', 'getGuideData', 'getGuideProgram', 'setTimer', 'getTimers', 'getSeriesTimers', 'deleteTimer', 'deleteSeriesTimer', 'getRecordings', 'deleteRecording', 'movieByName', 'movieByIMDB', 'movie', 'movieFromTMDB', 'movieByTMDB','movies', 'tvShow', 'tvShows', 'recentMovies', 'tvShowEpisodes', 'tvShowByIMDB', 'tvShowFromTVDB', 'tvShowByTVDB', 'tvShowByName', 'mediaFile', 'mediaFiles', 'recentEpisodes', 'openTuner']
	methods.forEach( method => {
		this[method] = ( obj = {} ) => {
			if ( _.isFunction( this.adapter[method] ) ) {
				return this.adapter[method]( obj );
			} else {
				debug( method + ' adapter function is missing!' );
				return false;
			}
		}
	})
	if ( _.isFunction( callback ) ) {
		callback( null, this );
	}
	return this;
}

module.exports = Adapter;

	
