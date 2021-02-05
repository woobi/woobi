/**
 * media adapter
 *
 * ####Example:
 *
 *     Media({}, callback)
 *
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('woobi:core:adapter:media');
var mysqlP = require('promise-mysql');
var Promise = require('bluebird');

module.exports = function(Broadcast) {
	var replacePath = Broadcast.get('videoStringReplace');
	var Media = function (opts, callback) {
		if (!(this instanceof Media)) return new Media(opts, callback);
		debug('Media Adapter construtor');
		var _this = this;
		this.connection;
		
		 if(!opts.user || !opts.pass  || !opts.database || !opts.host) {
			debug('opts:', opts)
			console.log('A correct adapter config is required!  Exiting now.');
			 process.exit();
			 return false;
		 }
		
		this.connection = mysqlP.createPool({
			host:  opts.host,
			user:  opts.user,
			password:  opts.pass,
			database:  opts.database,
			connectionLimit: 20,
		});
		debug('Media Adapter return', this.connection);
		return this;
	}
	
	/** images **/
	Media.prototype.grabMedia = function(id, type) {
		if(!type) {
			type = 'tvshow';
		}
		return this.connection.query("select * from art where media_type='" + type + "' and media_id='" + id + "'")
			.then(function(rows){
				return rows;
			})
			.catch(console.log);
	}
	
	/** custom sql **/
	Media.prototype.query = function(sql) {
		return this.connection.query(sql)
			.then(function(rows){
				return rows;
			})
			.catch(console.log);
	}
	
	/** recent tv episodes **/
	Media.prototype.recentEpisodes = function(num = 100) {
		debug(num)	
		return this.connection.query('select * from episode_view order by c05 DESC limit ' + num)
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach((ep) => {
					promises.push(new Promise((resolve, reject) => {
						this.grabMedia(ep.idShow)
						.then(r => {
						
							resolve( {
								idShow: ep.idShow,
								userrating: ep.userrating,
								filename: ep.strFileName,
								path: ep.strPath,
								file: ep.c18,
								direct: replacePath(ep.c18),
								playCount: ep.playCount,
								lastPlayed: ep.lastPlayed,
								dateAdded: ep.dateAdded,
								show:  ep.strTitle,
								genre: ep.genre,
								studio: ep.studio,
								premiered: ep.premiered,
								mpaa: ep.mpaa,
								rating: ep.rating,
								resumeTimeInSeconds: ep.resumeTimeInSeconds,
								totalTimeInSeconds: ep.totalTimeInSeconds,
								episodeID: ep.idEpisode,
								airdate: ep.c05,
								title: ep.c00,
								name: ep.strTitle + ' - ' + ep.c00,
								description: ep.c01,
								art: r,
								season: ep.c12,
								episode: ep.c13,
								thumb: ep.c06.replace(/(<([^>]+)>)/ig,""),
							});
					});
				}));
			});
			debug('run promises');
			return Promise.all(promises).then(r => {
				debug('promises done');
				return r
			});
		});
	}
	
	/** tv shows **/
	Media.prototype.tvShows = function(all) {
		var sql = 'select * from tvshow_view ';
		if(!all) sql += ' where totalCount > 0 '
		sql += 'order by c00 ';
		return this.connection.query(sql)
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach((ep) => {
					promises.push(new Promise((resolve, reject) => {
						this.grabMedia(ep.idShow)
							.then(r => {
								return {
									idShow: ep.idShow,
									userrating: ep.userrating,
									title: ep.c00,
									name: ep.c00,
									description: ep.c01,
									rating: ep.rating,
									originalAirDate: ep.c05,
									genre: ep.c08,
									dateAdded: ep.dateAdded,
									lastPlayed: ep.lastPlayed,
									totalEpisodes:  ep.totalCount,
									totalSeasons: ep.totalSeasons,
									studio: ep.c14,
									mpaa: ep.c13,
									imdb: ep.c12,
									episodeGuide: ep.c10,
									showPath: ep.strPath,
									art: r,
								}
							})
							.then(ep => {
								return this.tvShowEpisodes(ep.idShow)
								.then(shows => {
									ep.episodes = shows;
									return this.grabMedia(ep.idShow)
										.then(art => {
											ep.art = art;
											resolve(ep);
										});
								});
							})
					}));
				});
				return Promise.all(promises).then(r => {
					debug('promises done');
					return r
				});
		});
		
	}
	
	/** tv show **/
	Media.prototype.tvShow = function(ID) {
		const sql = "select * from tvshow_view as t where idShow='" + ID + "' order by c00";
		return this.connection.query(sql)
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				let ep = rows[0];
				let all = {
					idShow: ep.idShow,
					userrating: ep.userrating,
					title: ep.c00,
					name: ep.c00,
					description: ep.c01,
					rating: ep.rating,
					originalAirDate: ep.c05,
					genre: ep.c08,
					dateAdded: ep.dateAdded,
					lastPlayed: ep.lastPlayed,
					totalEpisodes:  ep.totalCount,
					totalSeasons: ep.totalSeasons,
					studio: ep.c14,
					mpaa: ep.c13,
					imdb: ep.c12,
					episodeGuide: ep.c10,
					showPath: ep.strPath,
					art: ep.c06,
				}
				return this.tvShowEpisodes(ep.idShow)
					.then(shows => {
						all.episodes = shows;
						return this.grabMedia(ep.idShow)
							.then(art => {
								all.art = art;
								return all;
							});
					});

		});
		
	}
	
	/** tv shows **/
	Media.prototype.tvShowByName = function(ID) {
		return this.connection.query("select * from tvshow_view  where c00 LIKE '%" + ID + "%' ")
			.then((rows) => {
				//console.log(rows);
				let ep = rows[0];
				let all = {
					idShow: ep.idShow,
					userrating: ep.userrating,
					title: ep.c00,
					name: ep.c00,
					description: ep.c01,
					rating: ep.rating,
					originalAirDate: ep.c05,
					genre: ep.c08,
					dateAdded: ep.dateAdded,
					lastPlayed: ep.lastPlayed,
					totalEpisodes:  ep.totalCount,
					totalSeasons: ep.totalSeasons,
					studio: ep.c14,
					mpaa: ep.c13,
					imdb: ep.c12,
					episodeGuide: ep.c10,
					showPath: ep.strPath,
				}
				return this.tvShowEpisodes(ep.idShow)
					.then(shows => {
						all.episodes = shows;
						return this.grabMedia(ep.idShow)
							.then(art => {
								all.art = art;
								return all;
							});
					});
		});
		
	}
	
	/** tv shows **/
	Media.prototype.tvShowByIMDB = function(IMDB) {
		return this.connection.query("select * from tvshow_view as t  where c12='" + IMDB + "'")
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				let ep = rows[0] || {};
				let all = {
					idShow: ep.idShow,
					userrating: ep.userrating,
					title: ep.c00,
					name: ep.c00,
					description: ep.c01,
					rating: ep.rating,
					originalAirDate: ep.c05,
					genre: ep.c08,
					dateAdded: ep.dateAdded,
					lastPlayed: ep.lastPlayed,
					totalEpisodes:  ep.totalCount,
					totalSeasons: ep.totalSeasons,
					studio: ep.c14,
					mpaa: ep.c13,
					imdb: ep.c12,
					episodeGuide: ep.c10,
					showPath: ep.strPath,
					art: ep.c06,
				}
				return this.tvShowEpisodes(ep.idShow)
					.then(shows => {
						//console.log('episodes', shows);
						all.episodes = shows;
						return this.grabMedia(ep.idShow)
							.then(art => {
								all.art = art;
								return all;
							});
						
					});				
		});
		
	}
	
	/** show episodes **/
	Media.prototype.tvShowEpisodes = function(showID) {
		return this.connection.query("select * from episode_view where idShow='" + showID + "' order by c12,LENGTH(c13),c13 ")
			.then((rows) => {
				// Logs out a list of hobbits 
				var promises = [];
				rows.forEach((ep) => {
					promises.push(new Promise((resolve, reject) => {
						this.grabMedia(ep.idShow)
							.then(r => {
								resolve({
									thumb: ep.c06.replace(/(<([^>]+)>)/ig,""),
									season: ep.c12,
									episode: ep.c13,
									airdate: ep.c05,
									description: ep.c01,
									totalTimeInSeconds: ep.totalTimeInSeconds,
									show:  ep.strTitle,
									title: ep.c00,
									idShow: ep.idShow,
									episodeID: ep.idEpisode,
									userrating: ep.userrating,
									genre: ep.genre,
									studio: ep.studio,
									premiered: ep.premiered,
									mpaa: ep.mpaa,
									resumeTimeInSeconds: ep.resumeTimeInSeconds,
									totalTimeInSeconds: ep.totalTimeInSeconds,
									filename: ep.strFileName,
									path: ep.strPath,
									file: ep.c18,
									rating: ep.rating,
									direct: replacePath(ep.c18),
									playCount: ep.playCount,
									lastPlayed: ep.lastPlayed,
									dateAdded: ep.dateAdded,
									name: ep.strTitle + ' - ' + ep.c00,
									art: r,
								});
						})
						
					}));
				});
				return Promise.all(promises).then(r => {
					debug('promises done');
					return r
				});
		});
	}
	
	
	
	/** recent movies **/
	Media.prototype.recentMovies = function(num) {
		if ( !Number(num) ) {
			num = 50
		}
		return this.connection.query('select * from movie_view order by dateAdded DESC limit ' + num)
		.then((rows) => {
			// Logs out a list of hobbits 
			//console.log(rows);
			var promises = [];
			rows.forEach((ep) => {
				promises.push(new Promise((resolve, reject) => {
					this.grabMedia(ep.idMovie, 'movie')
						.then(r => {
							resolve({
								idMovie: ep.idMovie,
								userrating: ep.userrating,
								filename: ep.strFileName,
								path: ep.strPath,
								direct: replacePath(ep.strPath + ep.strFileName),
								link: replacePath(ep.strPath + ep.strFileName),
								file: (ep.strPath + ep.strFileName),
								playCount: ep.playCount,
								lastPlayed: ep.lastPlayed,
								dateAdded: ep.dateAdded,
								premiered: ep.premiered,
								movie:  ep.c00,
								name: ep.c00,
								title: ep.c00,
								genre: ep.c14,
								director: ep.c06,
								producer: ep.c15,
								originCountry: ep.c21,
								resumeTimeInSeconds: ep.resumeTimeInSeconds,
								totalTimeInSeconds: ep.totalTimeInSeconds,
								imdb: ep.c09,
								year: ep.c07,
								blurb: ep.c03,
								description: ep.c01,
								rating: ep.rating,
								art: r,
							});
					})
					
				}));
			});
			return Promise.all(promises).then(r => {
				debug('promises done');
				return r
			});
		});
	}
	
	/** movies **/
	Media.prototype.movies = function() {
		return this.connection.query('select * from movie_view order by c00 ')
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach((ep) => {
					promises.push(new Promise((resolve, reject) => {
						this.grabMedia(ep.idMovie, 'movie')
							.then(r => {
								resolve({
									idMovie: ep.idMovie,
									userrating: ep.userrating,
									filename: ep.strFileName,
									path: ep.strPath,
									direct: replacePath(ep.strPath + ep.strFileName),
									link: replacePath(ep.strPath + ep.strFileName),
									file: (ep.strPath + ep.strFileName),
									playCount: ep.playCount,
									lastPlayed: ep.lastPlayed,
									dateAdded: ep.dateAdded,
									movie:  ep.c00,
									name: ep.c00,
									title: ep.c00,
									genre: ep.c14,
									director: ep.c06,
									producer: ep.c15,
									premiered: ep.premiered,
									originCountry: ep.c21,
									rating: ep.rating,
									resumeTimeInSeconds: ep.resumeTimeInSeconds,
									totalTimeInSeconds: ep.totalTimeInSeconds,
									imdb: ep.c09,
									year: ep.c07,
									blurb: ep.c03,
									description: ep.c01,
									art: r,
								});
						})
						
					}));
				});
				return Promise.all(promises).then(r => {
					debug('promises done');
					return r
				});
		});
	}
	
	Media.prototype.movieByName = function(name) {
		let sql = "select * from movie_view where c00 LIKE '%" + name + "%'";
		return this.connection.query(sql)
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				let ep = rows[0];
				let all = {
						idMovie: ep.idMovie,
						userrating: ep.userrating,
						filename: ep.strFileName,
						path: ep.strPath,
						direct: replacePath(ep.strPath + ep.strFileName),
						link: replacePath(ep.strPath + ep.strFileName),
						file: (ep.strPath + ep.strFileName),
						playCount: ep.playCount,
						lastPlayed: ep.lastPlayed,
						dateAdded: ep.dateAdded,
						movie:  ep.c00,
						name: ep.c00,
						title: ep.c00,
						genre: ep.c14,
						director: ep.c06,
						producer: ep.c15,
						premiered: ep.premiered,
						originCountry: ep.c21,
						resumeTimeInSeconds: ep.resumeTimeInSeconds,
						totalTimeInSeconds: ep.totalTimeInSeconds,
						imdb: ep.c09,
						year: ep.c07,
						blurb: ep.c03,
						description: ep.c01,
						rating: ep.rating,
					}
				return this.grabMedia(ep.idMovie, 'movie')
				.then(art => {
						all.art = art;
						return all;
				});
						
		});
	
	}
	
	Media.prototype.movie = function(ID) {
		let sql = "select * from movie_view where idMovie='" + ID + "'";
		return this.connection.query(sql)
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				let ep = rows[0];
				let all = {
						idMovie: ep.idMovie,
						userrating: ep.userrating,
						filename: ep.strFileName,
						path: ep.strPath,
						direct: replacePath(ep.strPath + ep.strFileName),
						link: replacePath(ep.strPath + ep.strFileName),
						file: (ep.strPath + ep.strFileName),
						playCount: ep.playCount,
						lastPlayed: ep.lastPlayed,
						dateAdded: ep.dateAdded,
						movie:  ep.c00,
						name: ep.c00,
						title: ep.c00,
						genre: ep.c14,
						director: ep.c06,
						producer: ep.c15,
						originCountry: ep.c21,
						premiered: ep.premiered,
						rating: ep.rating,
						resumeTimeInSeconds: ep.resumeTimeInSeconds,
						totalTimeInSeconds: ep.totalTimeInSeconds,
						imdb: ep.c09,
						year: ep.c07,
						blurb: ep.c03,
						description: ep.c01,
					}
				return this.grabMedia(ep.idMovie, 'movie')
				.then(art => {
						all.art = art;
						return all;
				});
						
		});
	
	}
		
	Media.prototype.movieByIMDB = function(IMDB) {
		let sql = "select * from movie_view where c09='" + IMDB + "'";
		return this.connection.query(sql)
			.then((rows) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				let ep = rows[0];
				let all = {
						idMovie: ep.idMovie,
						userrating: ep.userrating,
						filename: ep.strFileName,
						path: ep.strPath,
						direct: replacePath(ep.strPath + ep.strFileName),
						link: replacePath(ep.strPath + ep.strFileName),
						file: (ep.strPath + ep.strFileName),
						playCount: ep.playCount,
						lastPlayed: ep.lastPlayed,
						dateAdded: ep.dateAdded,
						movie:  ep.c00,
						name: ep.c00,
						title: ep.c00,
						genre: ep.c14,
						director: ep.c06,
						producer: ep.c15,
						premiered: ep.premiered,
						originCountry: ep.c21,
						rating: ep.rating,
						resumeTimeInSeconds: ep.resumeTimeInSeconds,
						totalTimeInSeconds: ep.totalTimeInSeconds,
						imdb: ep.c09,
						year: ep.c07,
						blurb: ep.c03,
						description: ep.c01,
					}
				return this.grabMedia(ep.idMovie, 'movie')
				.then(art => {
						all.art = art;
						return all;
				});
						
		});
	
	}
	
	return Media;
	
	
}

	
