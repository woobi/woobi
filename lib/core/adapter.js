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

var debug = require('debug')('snowstreams:core:adapter');
var _ = require('lodash');

var Adapter = function (Broadcast, opts, callback) {
	if (!(this instanceof Adapter)) return new Adapter(Broadcast, opts, callback);
	
	debug('Adapter');
	
	// adapter methods
	var Adapters = Broadcast.import('lib/core/adapters');
	
	if(opts.type && _.isFunction(Adapters[opts.type])) {
		var useAdapter = opts.type;
	} else {
		var useAdapter = 'mysql';
	}
	
	this.adapter = Adapters[useAdapter](opts.config, () => {
			if(_.isFunction(callback)) {
				callback(null, this);
			}
	});		
	return this;
}

/** recent tv episodes **/
Adapter.prototype.recentEpisodes = function(num = 25) {
	if(_.isFunction(this.adapter.recentEpisodes)) {
		return this.adapter.recentEpisodes(num);
	} else {
		console.log('recentEpisodes adapter function is missing!');
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShows = function() {
	if(_.isFunction(this.adapter.tvShows)) {
		return this.adapter.tvShows();
	} else {
		console.log('tvShows adapter function is missing!');
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShow = function(showID) {
	if(_.isFunction(this.adapter.tvShow)) {
		return this.adapter.tvShow(showID);
	} else {
		console.log('tvShow adapter function is missing!');
		return false;
	}
}

/** show episodes **/
Adapter.prototype.tvShowEpisodes = function(showID) {
	if(_.isFunction(this.adapter.tvShowEpisodes)) {
		return this.adapter.tvShowEpisodes(showID);
	} else {
		console.log('tvShowEpisodes  adapter function is missing!');
		return false;
	}
}

/** recent movies **/
Adapter.prototype.recentMovies = function(num = 25) {
	if(_.isFunction(this.adapter.recentMovies)) {
		return this.adapter.recentMovies(num);
	} else {
		console.log('recentMovies adapter function is missing!');
		return false;
	}
}

/** movies **/
Adapter.prototype.movies = function() {
	if(_.isFunction(this.adapter.movies)) {
		return this.adapter.movies();
	} else {
		console.log('movies adapter function is missing!');
		return false;
	}
}
	
module.exports = Adapter;

	
