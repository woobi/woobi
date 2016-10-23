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
	Mysql.prototype.recentEpisodes = function(num = 25) {
		var conn =  ()  => {
			return this.connection.query('select * from episode_view order by c05 DESC limit ' + num)
			.then(function(rows){
				// Logs out a list of hobbits 
				//console.log(rows);
				return rows.map((ep) => {
					return {
						showID: ep.idShow,
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
						art: ep.c06,
						season: ep.c12,
						episode: ep.c13
					}
				})
			});
		}
		return conn();
	}
	
	/** tv shows **/
	Mysql.prototype.tvShows = function() {
		return this.connection.query('select * from tvshow_view order by c00 ')
			.then(function(rows){
				// Logs out a list of hobbits 
				//console.log(rows);
				return rows.map((ep) => {
					return {
						 showID: ep.idShow,
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
						showPath: ep.strPath
					}
				})
		});
		
	}
	
	/** tv shows **/
	Mysql.prototype.tvShow = function(ID) {
		return this.connection.query("select * from tvshow_view where idShow='" + ID + "' order by c00")
			.then(function(rows){
				// Logs out a list of hobbits 
				//console.log(rows);
				return rows.map((ep) => {
					return {
						showID: ep.idShow,
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
						showPath: ep.strPath
					}
				})
		});
		
	}
	
	/** show episodes **/
	Mysql.prototype.tvShowEpisodes = function(showID) {
		return this.connection.query("select * from episode_view where idShow='" + showID + "' order by c12,c13 ")
			.then(function(rows){
				// Logs out a list of hobbits 
				//console.log(rows);
				return rows.map((ep) => {
					return {
						showID: ep.idShow,
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
						art: ep.c06,
						season: ep.c12,
						episode: ep.c13
					}
				})
		});
		
	}
	
	/** recent movies **/
	Mysql.prototype.recentMovies = function(num = 25) {
		var conn =  ()  => {
			return this.connection.query('select * from movie_view order by dateAdded DESC limit ' + num)
			.then(function(rows){
				// Logs out a list of hobbits 
				//console.log(rows);
				return rows.map((ep) => {
					return {
						movieID: ep.idMovie,
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
						posterArt: ep.c08,
						fanArt: ep.c20
					}
				})
			});
		}
		return conn();
	}
	
	/** movies **/
	Mysql.prototype.movies = function() {
		return this.connection.query('select * from movie_view order by c00 ')
			.then(function(rows){
				// Logs out a list of hobbits 
				//console.log(rows);
				return rows.map((ep) => {
					return {
						movieID: ep.idMovie,
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
						posterArt: ep.c08,
						fanArt: ep.c20
					}
				})
		});
		
	}
	
	return Mysql;
	
	
}

	
