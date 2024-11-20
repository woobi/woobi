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
	
	//debug('Adapter', opts);
	// adapter methods - imports all files from a directory as object models
	var Adapters = Broadcast.import('lib/core/adapters');
	
	if(_.isFunction(opts.adapter)) {
		var useAdapter = opts.adapter;
	} else if ( _.isString( opts.adapter ) && _.isFunction( Adapters[opts.adapter] ) ) {
		var useAdapter = Adapters[opts.adapter];
	} else {
		//debug('Using default', opts.adapter, Adapters)
		var useAdapter = Adapters['media'];
	}
	
	this.adapter = useAdapter( opts.config, ( ) => {
		debug('Adapter finished... callback');
			if ( _.isFunction( callback ) ) {
				callback( null, this );
			}
	});	
	let yes = 0;
	let no =0;
	const methods = opts.methods ?
		opts.methods
	:
		['grabMedia', 'import', 'socketConnect', 'dbConnect', 'connect', 'connection', 'endSession', 'query', 'getTVChannels', 'getChannelGroups', 'getGuideData', 'getGuideProgram', 'setTimer', 'getTimers', 'getSeriesTimers', 'deleteTimer', 'deleteSeriesTimer', 'getRecordings', 'deleteRecording', 'movieByName', 'movieByIMDB', 'movie', 'movieFromTMDB', 'movieByTMDB','movies', 'tvShow', 'tvShows', 'recentMovies', 'tvShowSearch', 'tvShowEpisodes', 'tvShowByIMDB', 'tvShowFromTVDB', 'tvShowByTVDB', 'tvShowByName', 'mediaFile', 'mediaFiles', 'recentEpisodes', 'openTuner', 'updateMedia', 'deleteMedia', 'deleteItem', 'addItem', 'getItem', 'videos', 'video', 'byGroup', 'byMonitor']
	methods.forEach( method => {
		

		if ( _.isFunction( this.adapter[method] ) ) {
			this[method] = this.adapter[method].bind(this.adapter);
			yes++
		} else {
			no++;
			//debug( method + ' adapter function is not included!' );
		}
		
		
	})
	debug( opts.adapter  + 'adapter - ', yes, 'available methods,  ', no , 'unused methods' );
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

	
