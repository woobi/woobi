var	_ = require('lodash');
var	debug = require('debug')('woobi:lib:core:listeners');
var async = require("async");
var naturalSort = require('javascript-natural-sort');
var request = require('superagent');
var epg = require('./listeners/epg.js');

module.exports = function(Broadcast) {
	
	
	return Object.assign( epg( Broadcast ) , {	
		
		channels(data, callback) {
			debug('Send Channels');
			
			let send = [];
			_.each(Broadcast.channels, (chan, name) => {
				//chan.sources = _.uniqBy(chan.sources, 'name');
				if(!chan) return;
				let history = Array.isArray(chan.history) ? typeof chan.history[0] === 'object' ? chan.history[0] : {} : {}
				send.push({
					uri: chan.uri,
					state: chan.state,
					port: chan.port,
					host: chan.host,
					channelPort: chan.channelPort,
					channel: chan.channel,
					link: chan.link,
					links: chan.links,
					commands: chan.commands,
					playing: {
						name: chan.currentSource.name,
						codecs: chan.currentSource.codecs || {},
						metadata: chan.currentSource.metadata || {},
						duration: chan.currentSource.duration / 60,
						progress: chan.currentSource.progress
					},
					prev: {
						name: history.name,
						metadata: history.metadata  || {}
					},
					sources: chan.sources.map((ss, i) => {
						return {
							name: ss.name,
							position: i,
							metadata: ss.metadata || ss.options || {},
						};
					}),
					history: chan.history.map((ss, i) => {
						return {
							name: ss.name,
							position: i,
							metadata: ss.metadata || ss.options || {}
						};
					})
				})
			});
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			callback(null, send);
			return {
				success: true,
				channels: _.sortBy(send, 'channel').reverse()
			};
			
		}, // end channels
		
		channel(data, callback) {
			debug('Send Channel');
			if(!_.isObject(data)) {
				data = {};
			}
			let chan = Broadcast.channels[data.channel];
			
			if(!chan) return;
			let history = chan.history[0] || {}
			let send = {
				uri: chan.uri,
				state: chan.state,
				port: chan.port,
				host: chan.host,
				channelPort: chan.channelPort,
				channel: chan.channel,
				link: chan.link,
				links: chan.links,
				commands: chan.commands,
				playing: {
					name: chan.currentSource.name,
					codecs: chan.currentSource.codecs || {},
					metadata: chan.currentSource.metadata || {},
					duration: chan.currentSource.duration / 60,
					progress: chan.currentSource.progress
				},
				prev: {
					name: history.name,
					metadata: history.metadata  || {}
				},
				sources: chan.sources.map((ss, i) => {
					return {
						name: ss.name,
						position: i,
						metadata: ss.metadata || ss.options || {},
					};
				}),
				history: chan.history.map((ss, i) => {
					return {
						name: ss.name,
						position: i,
						metadata: ss.metadata || ss.options || {}
					};
				})
			}
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			callback(null, send);
			return {
				success: true,
				channel: send
			};
			
		}, // end channel
		
		tvshows(data, callback) {
							
			debug('get tvshows');
			
			if(!_.isObject(data)) {
				data = {};
			}
			
			let Lib = data.lib ? Broadcast.libs[data.lib] : Broadcast.libs.media;
			
			return Lib.tvShows()
			.then((tv) => {
				
				if(!_.isFunction(callback)) {
					callback = function() {};
				}
				debug('got tvshows');
				callback(null, tv);
				return {
					success: true,
					tvshows: tv,
					channels: Broadcast.socketListeners.channels().channels
				};
			});
			
		}, // end tv
		
		recentshows(data, callback) {
							
			debug('get recentshows');
			
			if(!_.isObject(data)) {
				data = {};
			}
			
			let Lib = data.lib ? Broadcast.libs[data.lib] : Broadcast.libs.media;
			
			return Lib.recentEpisodes(25)
			.then((tv) => {
				
				if(!_.isFunction(callback)) {
					callback = function() {};
				}
				debug('got recentshows');
				callback(null, tv);
				return {
					success: true,
					recentshows: tv,
					channels: Broadcast.socketListeners.channels().channels
				};
			});
			
		}, // end tv
		
		tvshow(data, callback) {
							
			debug('get tvshow');
			
			if(!_.isObject(data)) {
				data = {};
			}
			
			let Lib = data.lib ? Broadcast.libs[data.lib] : Broadcast.libs.media;
			
			let method;
			if(data.type === 'imdb') {
				method = Lib.tvShowByIMDB(data.imdb);
			} else if (data.type === 'name') {
				method = Lib.tvShowByName(data);
			} else {
				method = Lib.tvShow(data.showId);
			}
			return method.then((tv) => {
				if(!_.isFunction(callback)) {
					callback = function() {};
				}
				debug('got tv');
				
						var res = {
							success: true,
							show: tv,
							channels: Broadcast.socketListeners.channels().channels
						}
						callback(null, res);
						return res;
				
			})
			.catch(e => {
				debug('ERROR finding the tv show ', e);
			});
			
		}, // end tv
		
		movies(data, callback) {
							
			debug('get movies');
			
			if(!_.isObject(data)) {
				data = {};
			}
			
			let Lib = data.lib ? Broadcast.libs[data.lib] : Broadcast.libs.media;
			
			return Lib.movies()
			.then((movies) => {
				
				if(!_.isFunction(callback)) {
					callback = function() {};
				}
				debug('return movies');
				callback(null, movies);
				return {
					success: true,
					movies: movies,
					channels: Broadcast.socketListeners.channels().channels
				};
			});
			
		}, // end movies
		
		recentmovies(data, callback) {
							
			debug('get movies');
			
			if(!_.isObject(data)) {
				data = {};
			}
			
			let Lib = data.lib ? Broadcast.libs[data.lib] : Broadcast.libs.media;
			
			return Lib.recentMovies()
			.then((movies) => {
				
				if(!_.isFunction(callback)) {
					callback = function() {};
				}
				debug('return recentmovies');
				callback(null, movies);
				return {
					success: true,
					movies: movies,
					channels: Broadcast.socketListeners.channels().channels
				};
			});
			
		}, // end recentmovies
		
		movie(data, callback) {
							
			debug('get movie');
			
			if(!_.isObject(data)) {
				data = {};
			}
			
			let Lib = data.lib ? Broadcast.libs[data.lib] : Broadcast.libs.media;
			
			let method;
			if(data.type === 'imdb') {
				method = Lib.movieByIMDB(data.imdb);
			} else if (type === 'name') {
				method = Lib.movieByName(data);
			} else {
				method = Lib.movie(data.showId);
			}
			return method.then((movie) => {
				if(!_.isFunction(callback)) {
					callback = function() {};
				}
				debug('return movie ' + movie.name);
				var res = {
					success: true,
					movie: movie,
					channels: Broadcast.socketListeners.channels().channels
				}
				callback(null, res);
				return res;
				
			})
			.catch(e => {
				debug('ERROR with movie', e);
				var res = {
					success: false,
					movie: {},
					channels: Broadcast.socketListeners.channels().channels
				}
				callback(null, res);
				return res;
			});	
				
		}, // end tv
		
		runProgram(data, callback) {
			
		},
		
		manager(data) {
							
			debug('manager emitted',  data);
			
		}, // end manager
		
		channelStatus(name) {
			
			var src = Broadcast.channels[name];
			
			var list = [];
			list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Status of ' + name + '</b></div>');				
			
		},
		
		status() {

			var list = [];
				// Channels
				list.push('<div class="col-xs-12 col-sm-6 col-md-4" ><div style="border-bottom:1px solid #666;word-spacing:-.7px;"><b>Channels</b></div>');
				if(_.isObject(Broadcast.channels))
					_.each(Broadcast.channels, function(v) {
						if (!v) return
						
						//if(v.channel === 'x11grab') debug('Channel Object', v);
						
						var text = '<p><b><span style="">Channel ' + v.channel + '</b>';
						text += '<br /> ' + v.currentSource.name + '</span> ';
						text += '<br />state: ' + v.state.current + '</span><br />|| ';
						if(v.links) {
							_.each(v.links, (l,ii) => {
								if(ii == 'local' || ii == 'unicast'  || ii == 'hls') {
									text += '<a href="' + l + '">' + ii + '</a> || ';
								} else if(_.isArray(l)) {
									l.forEach((li, il) => {
										text += '<a href="' + li + '">' + ii + '</a> || ';
									});
								}
							});
						}
						text+= '</p>';
						list.push(text);
					});
				
				// Servers	
				list.push('</div><div class="col-xs-12 col-sm-6 col-md-4" ><div style="border-bottom:1px solid #666;word-spacing:-.7px;"><b>Servers</b></div>');
				if(_.isObject(Broadcast.servers))
					_.each(Broadcast.servers, function(v) {
						list.push('<span style="word-spacing:-.7px;">' + v.name + ' - ' + v.host  + ':' + v.port + '</span><br />');
					});
					
				// Streamers
				list.push('</div><div class="col-xs-12 col-sm-6 col-md-4" ><div style="border-bottom:1px solid #666;margin-top:0px;word-spacing:-.7px;"><b>Streamers</b></div>');
				if(_.isArray(Broadcast.proxies))
					_.each(Broadcast.proxies, function(v) {
						list.push('<span style="word-spacing:-.7px;">proxy - ' + v.source + ' - ' + v.ip + '</span><br />');
					});
				list.push('</div>');
				var ll = '';
				_.each(list, function(l) {
					ll += l
				});
				
			
			return {
				proxy: Broadcast.get('proxy'),
				html: ll,
				success: true,
				servers: convert(Broadcast.servers),
				channels: convert(Broadcast.channels),
				streamers: convert(Broadcast.proxies)
			}	
		},
		
		presets(callback) {
			callback = callback || function () {};
			let list = {}
			_.each(Broadcast.Presets, (p, k) => {
				list[k] = p();
			});
			
			Broadcast.libs._mongo.ChannelConfig.model.find().lean().exec((err, docs) => {
				debug('send /lodge socket presets', err);
				callback(err, {
					presets: list,
					saved: docs
				});
			});
		},
		
		signout(data, callback) {
			callback = callback || function () {};
			request
				.post('http://snowwhite:' + keystone.get('port') + '/keystone/api/session/signout')
				.set('Accept', 'application/json')
				.end((err, res) => {
					// Calling the end function will send the request
					debug(err, res);
					
				});
			
		},
		
		auth(data, callback) {
			debug('Auth', data);
			if (!data.user || !data.pass) {
				ss.openSocket.emit(data.iden, {
					data: {
						success: false,
						error: 'Email and password required'
					}
				});
			}
			
			var onSuccess = function(res) {			
				ss.openSocket.emit(data.iden, {
					data: {
						success: true,
						result: res
					}
				});
			}
			
			var onFail = function(err) {
				
				ss.openSocket.emit(data.iden, {
					data: {
						success: false,
						error:  err
					}
				});
			}		
			request
				.post('http://snowwhite:' + this.get('port') + '/keystone/api/session/signin')
				.send({ email: data.user, password: data.pass })
				.set('Accept', 'application/json')
				.end((err, res) => {
					// Calling the end function will send the request
					if(err || res.body.error) {
						return onFail(err || res.body.error);
					}
					onSuccess(res.body);
				});

		}
		
	});
}

function createArgs(line, query) {
	return line.split(' ').map(function(v) {
		if(v[0] === '%') {
			var str =  v.substring(1, v.length-1).toLowerCase();
			return query[str];
		} else {
			return v;
		}
	})
	.filter(function(v) { 
		return v !== '' 
	});
}

function convert(a) {
	try {
		a = JSON.stringify(a);
	} catch(e) {
		a={}
	}
	return a;
}		
