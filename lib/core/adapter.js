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

var Adapter = function (Broadcast, opts, callback) {
	if (!(this instanceof Adapter)) return new Adapter(Broadcast, opts, callback);
	
	debug('Adapter');
	
	// adapter methods
	var Adapters = Broadcast.import('lib/core/adapters');
	
	if(_.isFunction(opts.adapter)) {
		var useAdapter = opts.adapter;
	} else if (_.isString(opts.adapter) && _.isFunction(Adapters[opts.adapter])) {
		var useAdapter = Adapters[opts.adapter];
	} else {
		var useAdapter = Adapters['mysql'];
	}
	
	this.adapter = useAdapter(opts.config, () => {
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
Adapter.prototype.tvShowByName = function(name) {
	if(_.isFunction(this.adapter.tvShowByName)) {
		return this.adapter.tvShowByName(name);
	} else {
		console.log('tvShowByName adapter function is missing!');
		return false;
	}
}

/** tv shows **/
Adapter.prototype.tvShowByIMDB = function(name) {
	if(_.isFunction(this.adapter.tvShowByIMDB)) {
		return this.adapter.tvShowByIMDB(name);
	} else {
		console.log('tvShowByIMDB adapter function is missing!');
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

/** movie **/
Adapter.prototype.movie = function(idShow) {
	if(_.isFunction(this.adapter.movie)) {
		return this.adapter.movie(idShow);
	} else {
		console.log('movies adapter function is missing!');
		return false;
	}
}

/** movieByIMDB **/
Adapter.prototype.movieByIMDB = function(IMDB) {
	if(_.isFunction(this.adapter.movieByIMDB)) {
		return this.adapter.movieByIMDB(IMDB);
	} else {
		console.log('movieByIMDB adapter function is missing!');
		return false;
	}
}

/** movieByName **/
Adapter.prototype.movieByName = function(name) {
	if(_.isFunction(this.adapter.movieByName)) {
		return this.adapter.movieByName(name);
	} else {
		console.log('movies adapter function is missing!');
		return false;
	}
}

module.exports = Adapter;

	
