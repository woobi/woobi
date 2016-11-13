/**
 * mysql adapter
 *
 * ####Example:
 *
 *     Broadcast.adapter.mysql({}, callback)
 *
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('snowstreams:core:adapter:mysql');
var mysqlP = require('promise-mysql');

module.exports = function(Broadcast) {
	var Mysql = function (opts, callback) {
		if (!(this instanceof Mysql)) return new Mysql(opts, callback);
		debug('mysql');
		var _this = this;
		this.connection;
		
		 if(!opts.user || !opts.pass  || !opts.database || !opts.host) {
			  console.log('A correct adapter config is required!  Exiting now.');
			 process.exit();
			 return false;
		 }
		
		mysqlP.createConnection({
			host:  opts.host,
			user:  opts.user,
			password:  opts.pass,
			database:  opts.database
		}).then((conn) => {
			this.connection = conn;
			if(callback) callback(null, this);
		});
		
		return this;
	}
	
	/** recent tv episodes **/
	Mysql.prototype.grabMedia = function(id, type) {
		if(!type) {
			type = 'tvshow';
		}
		return this.connection.query("select * from art where media_type='" + type + "' and media_id='" + id + "'")
			.then(function(rows){
				return rows;
			})
			.catch(console.log);
	}	
	
	/** recent tv episodes **/
	Mysql.prototype.recentEpisodes = function(num = 100) {
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
								playCount: ep.playCount,
								lastPlayed: ep.lastPlayed,
								dateAdded: ep.dateAdded,
								show:  ep.strTitle,
								genre: ep.genre,
								studio: ep.studio,
								premiered: ep.premiered,
								mpaa: ep.mpaa,
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
	Mysql.prototype.tvShows = function(all) {
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
								resolve({
									idShow: ep.idShow,
									userrating: ep.userrating,
									title: ep.c00,
									name: ep.c00,
									description: ep.c01,
									rating: ep.c04,
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
	Mysql.prototype.tvShow = function(ID) {
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
					rating: ep.c04,
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
	Mysql.prototype.tvShowByName = function(ID) {
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
					rating: ep.c04,
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
	Mysql.prototype.tvShowByIMDB = function(IMDB) {
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
					rating: ep.c04,
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
	Mysql.prototype.tvShowEpisodes = function(showID) {
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
	Mysql.prototype.recentMovies = function(num = 100) {
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
									file: ep.strPath + ep.strFileName,
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
									rating: ep.c12,
									resumeTimeInSeconds: ep.resumeTimeInSeconds,
									totalTimeInSeconds: ep.totalTimeInSeconds,
									imdb: ep.c09,
									year: ep.c07,
									blurb: ep.c03,
									description: ep.c01,
									rating: ep.c05,
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
	Mysql.prototype.movies = function() {
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
									file: ep.strPath + ep.strFileName,
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
									rating: ep.c12,
									resumeTimeInSeconds: ep.resumeTimeInSeconds,
									totalTimeInSeconds: ep.totalTimeInSeconds,
									imdb: ep.c09,
									year: ep.c07,
									blurb: ep.c03,
									description: ep.c01,
									rating: ep.c05,
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
	
	Mysql.prototype.movieByName = function(name) {
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
						file: ep.strPath + ep.strFileName,
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
						rating: ep.c12,
						resumeTimeInSeconds: ep.resumeTimeInSeconds,
						totalTimeInSeconds: ep.totalTimeInSeconds,
						imdb: ep.c09,
						year: ep.c07,
						blurb: ep.c03,
						description: ep.c01,
						rating: ep.c05,
					}
				return this.grabMedia(ep.idMovie, 'movie')
				.then(art => {
						all.art = art;
						return all;
				});
						
		});
	
	}
	
	Mysql.prototype.movie = function(ID) {
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
						file: ep.strPath + ep.strFileName,
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
						rating: ep.c12,
						resumeTimeInSeconds: ep.resumeTimeInSeconds,
						totalTimeInSeconds: ep.totalTimeInSeconds,
						imdb: ep.c09,
						year: ep.c07,
						blurb: ep.c03,
						description: ep.c01,
						rating: ep.c05,
					}
				return this.grabMedia(ep.idMovie, 'movie')
				.then(art => {
						all.art = art;
						return all;
				});
						
		});
	
	}
		
	Mysql.prototype.movieByIMDB = function(IMDB) {
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
						file: ep.strPath + ep.strFileName,
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
						rating: ep.c12,
						resumeTimeInSeconds: ep.resumeTimeInSeconds,
						totalTimeInSeconds: ep.totalTimeInSeconds,
						imdb: ep.c09,
						year: ep.c07,
						blurb: ep.c03,
						description: ep.c01,
						rating: ep.c05,
					}
				return this.grabMedia(ep.idMovie, 'movie')
				.then(art => {
						all.art = art;
						return all;
				});
						
		});
	
	}
	
	return Mysql;
	
	
}

	
