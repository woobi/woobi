var debug = require('debug')('lodge:lib:routes:helpers');
var _ = require('lodash');

module.exports.channels = function(opts) {
	return new Promise((resolve, reject) => {
		var ch = this.socketListeners.channels(opts).channels;
		resolve(ch);
	});
}

module.exports.movies = function(opts) {
	return this.socketListeners.movies(opts).then(r => {
		return r;
	}).catch(r => debug(r));
}

module.exports.recentmovies = function(opts) {
	return this.socketListeners.recentmovies(opts).then(r => {
		return r;
	}).catch(r => debug(r));
}

module.exports.movie = function(opts) {
	return this.socketListeners.movie(opts).then(r => {
		return r;
	}).catch(r => debug(r));
}

module.exports.tvshows = function(opts) {
	return this.socketListeners.tvshows(opts).then(r => {
		//debug('helper got tvshow', r)
		return r;
	}).catch(r => console.log(r));
}

module.exports.recentshows = function(opts) {
	return this.socketListeners.recentshows(opts).then(r => {
		//debug('helper got tvshow', r)
		return r;
	}).catch(r => console.log(r));
}

module.exports.tvshow = function(opts) {
	return this.socketListeners.tvshow(opts).then(r => {
		return r;
	}).catch(r => debug(r));
}

module.exports.minichannel = function(opts) {
		return new Promise((resolve, reject) => {
			var ch = this.channels[opts.params.channel];
			resolve(ch);
		});
}
