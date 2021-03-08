var debug = require('debug')('woobi:core:adapter');
var _ = require('lodash');
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
var Adapter = function ( Broadcast, opts, callback ) {
	if ( !( this instanceof Adapter ) ) return new Adapter( Broadcast, opts, callback );
	
	debug('Adapter', opts);
	// adapter methods
	var Adapters = Broadcast.import('lib/core/adapters');
	
	if(_.isFunction(opts.adapter)) {
		var useAdapter = opts.adapter;
	} else if ( _.isString( opts.adapter ) && _.isFunction( Adapters[opts.adapter] ) ) {
		var useAdapter = Adapters[opts.adapter];
	} else {
		debug('Using default', opts.adapter, Adapters)
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
		['grabMedia', 'socketConnect', 'dbConnect', 'connect', 'connection', 'endSession', 'query', 'getTVChannels', 'getChannelGroups', 'getGuideData', 'getGuideProgram', 'setTimer', 'getTimers', 'getSeriesTimers', 'deleteTimer', 'deleteSeriesTimer', 'getRecordings', 'deleteRecording', 'movieByName', 'movieByIMDB', 'movie', 'movieFromTMDB', 'movieByTMDB','movies', 'tvShow', 'tvShows', 'recentMovies', 'tvShowEpisodes', 'tvShowByIMDB', 'tvShowFromTVDB', 'tvShowByTVDB', 'tvShowByName', 'mediaFile', 'mediaFiles', 'recentEpisodes', 'openTuner', 'updateMedia', 'deleteMedia', 'deleteItem', 'addItem', 'getItem', 'videos', 'video', 'byGroup', 'byMonitor']
	methods.forEach( method => {
		if ( _.isFunction( this.adapter[method] ) ) {
			this[method] = this.adapter[method].bind(this.adapter);
		} else {
			debug( method + ' adapter function is not included!' );
		}
		
	})
	if ( _.isFunction( callback ) ) {
		callback( null, this );
	}
	return this;
}

/** 
 * Manage broadcast channels
 * @module Adapter 
 * 
 * */
module.exports = Adapter;

	
