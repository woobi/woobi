const debug = require('debug')('woobi:core:adapter:media');
const moment = require('moment');
const Promise = require('bluebird');
const async = require('async');
const Database = require('better-sqlite3');
const path = require('path');
const { readdir } = require('fs').promises;
const ffprobe = require('fluent-ffmpeg').ffprobe;
const xml2json = require('xml-to-json')
let mimes = {    
    video: ['nfo','mkv', 'avi', 'rmvb', 'mpeg', 'wmv', 'mp4', 'm4v', 'mov']
}
/** 
 * Manage broadcast channels
 * @module Broadcast/libs/media
 * 
 * */
module.exports = function(Broadcast) {
	
	var replacePath = Broadcast.get('videoStringReplace');
	/**
 * media adapter
 *
 * ####Example:
 *
 *     Media({}, callback)
 * @class
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

	var Media = function (opts, callback) {
		if (!(this instanceof Media)) return new Media(opts, callback);
		debug('Woobi Sqlite3 Media Adapter construtor');
		
		this.mediaStore = path.join(Broadcast.get('dbPath') || Broadcast.mediaPath, 'woobiMedia.db') ;
		
		// create / grab the db
		this.db = new Database(this.mediaStore, {  }); // verbose: debug
		
		// table for monitored dirs
		this.db.prepare("CREATE TABLE IF NOT EXISTS monitor ( monitor_id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE );").run();
		// table for media entries
		this.db.prepare("CREATE TABLE IF NOT EXISTS media ( media_id INTEGER PRIMARY KEY, name TEXT NOT NULL , file TEXT NOT NULL UNIQUE, plot TEXT, poster TEXT, thumb TEXT, data TEXT, airdate INTEGER, added INTEGER, updated INTEGER, container_id INTEGER, FOREIGN KEY (container_id) REFERENCES containers (container_id));").run();
		// table for types of video
		this.db.prepare("CREATE TABLE IF NOT EXISTS groups ( group_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);").run();
		// table for containers ex: name of series, name of movie, simple organization
		this.db.prepare("CREATE TABLE IF NOT EXISTS containers ( container_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, title TEXT, group_id INTEGER, data TEXT, plot TEXT, poster TEXT, thumb TEXT, FOREIGN KEY (group_id) REFERENCES groups (group_id));").run();
		// table for media to group relationships
		this.db.prepare("CREATE TABLE IF NOT EXISTS media_groups( media_id INTEGER, group_id INTEGER, PRIMARY KEY (media_id, group_id), FOREIGN KEY (media_id) REFERENCES media (media_id) ON DELETE CASCADE ON UPDATE NO ACTION, FOREIGN KEY (group_id) REFERENCES groups (group_id) ON DELETE CASCADE   ON UPDATE NO ACTION );").run();
		// add default groups
		this.db.prepare("INSERT OR IGNORE INTO groups(name) VALUES(?)").run('Videos');
		this.db.prepare("INSERT OR IGNORE INTO groups(name) VALUES(?)").run('Series');
		this.db.prepare("INSERT OR IGNORE INTO groups(name) VALUES(?)").run('Movies');
		this.db.prepare("INSERT OR IGNORE INTO groups(name) VALUES(?)").run('mmmmhhmm');
		this.db.prepare("INSERT OR IGNORE INTO groups(name) VALUES(?)").run('Other');
		this.db.prepare("INSERT OR IGNORE INTO groups(name) VALUES(?)").run('Private');

		// default container
		this.db.prepare("INSERT OR IGNORE INTO containers (name, container_id, group_id) VALUES ('Videos', 1, 1)").run();
		
		// views
		// items
		this.db.exec('DROP VIEW IF EXISTS "main"."Items"; CREATE VIEW Items AS select  groups.group_id as groupId, groups.name as "group", containers.container_id as containerId, containers.name as container,containers.plot as cplot, containers.data as cdata, media.media_id as mediaId, media.name, media.file, media.data from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id )');
		
		// Series
		this.db.exec('DROP VIEW IF EXISTS "main"."Series"; CREATE VIEW Series AS select   containers.container_id as seriesId, containers.name as series, containers.title as name, (select count() from media where container_id=containers.container_id) episodes, containers.plot, containers.data, groups.name as "group", groups.group_id as "groupId"  from containers INNER JOIN groups USING ( group_id ) where group_id=2 GROUP BY series' );

		// Episodes
		this.db.exec('DROP VIEW IF EXISTS "main"."Episodes";')
		var _eps = this.db.prepare(' CREATE VIEW Episodes AS select groups.name as "group", containers.container_id as seriesId, containers.title as series, media.media_id as mediaId, media.name, media.file, media.data, media.plot, media.airdate as airdate, containers.plot as cplot, containers.data as cdata, groups.group_id as "groupId" from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where containers.group_id = 2  and media.file IS NOT NULL' );
		_eps.run()
		
		// Movie List
		this.db.exec('DROP VIEW IF EXISTS "main"."MovieList"; CREATE VIEW MovieList AS select  containers.container_id as movieId, containers.title as movie, (select count() from media where container_id=containers.container_id) episodes, containers.plot, containers.data, groups.name as "group", groups.group_id as "groupId" from containers INNER JOIN groups USING ( group_id ) where group_id=3 GROUP BY movie' );

		// Movies
		this.db.exec('DROP VIEW IF EXISTS "main"."Movies";');
		var _mov = this.db.prepare(' CREATE VIEW Movies AS select groups.name as "group", containers.container_id as movieId, media.airdate, containers.title as movie, media.media_id as mediaId, media.name, media.file, media.data, media.plot from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where group_id=3 and media.file IS NOT NULL' );
		_mov.run()

		// RecentMovies
		this.db.exec('DROP VIEW IF EXISTS "main"."RecentMovies";');
		var _mov = this.db.prepare(' CREATE VIEW RecentMovies AS select groups.name as "group", containers.container_id as movieId, media.airdate, containers.title as movie, media.media_id as mediaId, media.name, media.file, media.data, media.plot from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where group_id=3 and media.file IS NOT NULL ORDER by media.airdate ASC' );
		_mov.run()
		
		// Videos
		this.db.exec('DROP VIEW IF EXISTS "main"."Videos"; CREATE VIEW Videos AS select media.name, media.file, media.data, media.plot, media.airdate, media.media_id as mediaId, containers.title as container, containers.plot as cplot, containers.data as cdata, groups.name as "group" from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where group_id=1 ');
		

		debug('Woobi sqllite3 Adapter');
		//
		return this;
	}
	
	/** populate media store **/
	/**
	 * 
	 * @param {obj} obj
	 * 	@param {string} name // name of store
	 * 	@param {string} type // Movies, Series, Videos, Other, Private
	 * 	@param {string} look // path to dir
	 * 	@param {bool} byDir // add items by top level directory that is series / movie name
	 *  @param {bool} nfo // look for an nfo file associated with each File
	 *  @param {bool} nfoIsFilename // expects basename to be the same, if false we do some hooboo and hope
	 * 
	 * 
	 */
	Media.prototype.grabMedia = function( obj ) {
		return new Promise( (resolve, reject) => {
			if(obj.ignore) {
				debug('Skipping based on config', obj.name);
				return resolve();
			}
			if(Object.prototype.toString.call(obj) != "[object Object]") {
				return reject('A config object must be included')
			}
			//debug(Object.prototype.toString.call(obj), obj.name, obj.type, obj.look)
			if(!obj.type) {
				obj.type = 'Videos';
			}
			if(!obj.name) {
				return reject('A name must be included for this media store')
			}
			if(!obj.look) {
				return reject('A dir must be included for this media store')
			}
			
			// add this path to monitor
			this.db.prepare("INSERT OR IGNORE into monitor (path) VALUES (?)").run(obj.look);
			// get group id
			var _typeid = this.db.prepare("SELECT group_id from groups where name = ?").get(obj.type);
			if(_typeid && _typeid.group_id) {
				//we have group id
				var typeid = _typeid.group_id;
			} else {
				debug('No group found');
				// no group so abort
				return Promise.reject('Could not find a group ID for', obj.type)
			}
			debug('Get files for', obj, typeid)
			// traverse the directory and grab a list of video files
			getFiles(obj.look, obj.byDir)
				.then(files => {
					//debug(files);
					let nfo = [];
					var i=1;
					return new Promise( (resolve2, reject2) => {

						async.forEachOfSeries(files, (data, key, finished) => {
							//debug('next');
							/* key is name of the Series or movie
							data.files is an array of videos
							data.name is the name of the Series or Movie
							*/
							// add the container
							debug(key, data.name);
							
							// set the root folder name (show or movie name)
							let rootFolder = key;
							let containerId = '';
							var _ctn = this.db.prepare("INSERT OR IGNORE INTO containers (name, title, group_id) VALUES (?, ?, ?)").run(rootFolder, rootFolder, typeid);
							if(_ctn.lastInsertRowid && _ctn.changes != 0) {
								var ctn = containerId = _ctn.lastInsertRowid;
								debug('Added container', rootFolder, containerId);
							} else {
								var _cc = this.db.prepare("SELECT container_id from containers where name LIKE ?").get(rootFolder);
								var ctn = containerId = _cc.container_id;
								debug('Using container', rootFolder, containerId);
							}

							if (containerId == '') {
								containerId = 1;
							}
							async.each(data.files, (file, cb) => {
								// check for an nfo file first
								i++
								if(getExt(file) == 'nfo') {
									getNfo(file)
									.then(r => {
										
										let _o = {};
										let _keyname = obj.nfoNotFilename ? rootFolder : path.parse(file).name;
										let metadata = _o[_keyname] = r[0][Object.keys(r[0])[0]]
										metadata.ORIGINAL = Object.keys(r[0])[0];
										metadata._keyname = _keyname;
										nfo.push( _o );
										debug('Got nfo', _keyname, metadata.title)
										cb();
									})
									.catch(e => {
										debug('## ERROR with nfo', e);
										cb();
									});
									
								} else {
									var datas = {};
									ffprobe( file, ( err, metadata ) => {
										if(err) this.debug('ERR', err);
										if(metadata) {
											datas.bitRate = metadata.format.bit_rate;
											datas.duration = metadata.format.duration / 60;
											datas.start = metadata.format.start_time;
											datas.end = metadata.format.end;
											datas.size = metadata.format.size;
											//this.debug( 'got metadata', metadata.format, duration > this.truncate );
											datas.totalTimeInSeconds = metadata.format.duration
											//Broadcast.notify( this.name, this._info);
										} 
										try {
											datas = JSON.stringify(datas)
										} catch(e) {
											datas = '';
										}
										//add to database
										var stmt = this.db.prepare("INSERT OR IGNORE INTO media (name, file, added, container_id, data) VALUES (?, ?, ?, ?, ?)")
										let _keyname = obj.nfoNotFilename ? rootFolder : path.parse(file).name;
										
										var info = stmt.run(_keyname, file, moment().valueOf(), containerId, datas)
										
										//debug(obj.type, 'INSERT:  ', info.lastInsertRowid, typeid, file)
										if(info.lastInsertRowid && typeid) {
											debug('-- Adding group reference', info.lastInsertRowid, 'to', typeid  );
											this.db.prepare("INSERT  OR IGNORE INTO media_groups (media_id, group_id) VALUES (?, ?)").run( info.lastInsertRowid,  typeid);
				
										} else {
											//this entry exists so we could update the time
											this.db.prepare("UPDATE media set updated=? and data=? where name=?").run(moment().valueOf(), datas, _keyname);
											//debug('-- Exists: ', file, 'in', key  );
										}	
										cb();
									});								
									
								}								
							}, function (err) {
								//debug('done with files for', key);
								finished();
							});
							
						},  (err) => {
							debug('done with media for', obj.look, nfo.length);
							// we are done adding media files
							// now we can loop throu any nfo files we found and try and update the
							// media entries for them
							if(obj.nfo && nfo.length > 0) {
								debug('Starting nfo loop and updates', nfo.length);
								i=0;
								async.each(nfo, (_info, go) => {
									
									var add = '';
									var _container = Object.keys(_info)[0];
									var info = _info[_container];
									//debug('check nfo' , i++,  info.title);
									try {
										add = JSON.stringify(info);
									} catch(e) {
										debug('Failed to jsonify the data from nfo')
										add = '';
									}
									if( info.art) {
										info.thumb = info.art.thumb;
										info.poster = info.art.poster;
									} else {
										info.thumb = '';
										info.poster = '';
									}
									debug(info.ORIGINAL, _container, info.title)
									// see if this is a series or movie container
									if(info.ORIGINAL == 'tvshow' || info.ORIGINAL == 'movie') {
										// this nfo is not a file but may match a container
										let sql = this.db.prepare("UPDATE containers SET title=?, data=?, plot=?, thumb=?, poster=?  WHERE name LIKE ?"); 
										
										var res = sql.run( info.title, add, info.plot, info.thumb, info.poster, _container);
										debug('###', (res.changes > 0) ? 'Changed' : 'Not Changed', res);
										
									}
									// nfos are usually for a media file
									if (info.ORIGINAL != 'tvshow') {
										// what to search for
										
										debug('file?', info.title, _container)
										// grab the data to merge first
										var metadata = {}
										let _find = this.db.prepare("SELECT data, media_id from media WHERE name LIKE ? or name LIKE ?");
										var find = _find.get(info.title, _container);
										//debug(find, _searchFor);
										if(!find) {
											// did not find a match so skip ahead
											debug('No match found', _container, info.title)
											go();
										} else {
											// merge the metadata
											try {
												var unwind = JSON.parse(find.data);
												metadata = {
													...unwind,
													...info
												};
												metadata = JSON.stringify(metadata)
											} catch(e) {
												debug(e);
												var metadata = add;
											}
											let sql = this.db.prepare("UPDATE media SET name=?, airdate=?, data=?, plot=?, thumb=?, poster=? WHERE media_id = ?");
											const airdate = info.premiered || info.aired || info.dateadded;
											// try and add the info
											
											var res = sql.run(info.title, moment(airdate).valueOf(), metadata, info.plot, info.thumb, info.poster, find.media_id);
											debug('## media', (res.changes > 0) ? 'Changed' : 'Unchanged', find.media_id, res);

											go();
										}
									} else {
										go();
									}
								}, (err) => {
									debug('Done with nfo')
									resolve2(i);
								})
							} else {
								debug('Done with nfo')
								resolve2(i);
							}
							
						});
					});
				})
				// now create your store
				.then(i => {
					debug('Added', i, ' files for', obj.look)
					//var rows = this.db.prepare("SELECT media.* from media, groups, media_groups where groups.name = ? and media_groups.group_id = groups.group_id and media.media_id = media_groups.media_id").all(obj.type);
					//debug('From db:', rows);
					resolve();
				})
				.catch( e => {
					debug(e);
				});
		}); 
	}
	
	/** import from source **/
	Media.prototype.import = function(source) {
		debug('import array', source.length)
		var _typeid = this.db.prepare("SELECT path from monitor");
		let dirs =  [];
		for (const cat of _typeid.iterate()) {
			dirs.push(cat.path);
		}
		source.forEach((file) => {
			if (dirs.includes(file.look) && file.update != true) {
				debug('skipping from import since source is already tracked', file.look)
			} else {
				this.grabMedia(file)
			}
			
		})
		
	}


	/** videos **/
	Media.prototype.videos = function(limit, order) {
		if(!limit) limit = 50;
		if(!order) order = 'name ASC';
		const stmt = this.db.prepare('SELECT * FROM Videos ORDER by ' + order + ' LIMIT ?');
		let cat =  stmt.all(limit);
		
		let data = cat.map(r => {
			try {
				r.data = JSON.parse(r.data);
				if(r.cdata) {
					r.cdata = JSON.parse(r.cdata);
				}
			} catch (e) {
				debug(e)
			}
			return r;
		})
		return data;
	}

	/** recent tv episodes **/
	Media.prototype.recentEpisodes = function(limit, order) {
		if(limit == '') limit = 50;
		if(!order) order = 'airdate DESC';
		const stmt = this.db.prepare('SELECT * FROM Episodes ORDER by ' + order + ' LIMIT ' + limit);
		let cat =  stmt.all();
		let data = cat.map(r => {
			try {
				r.data = JSON.parse(r.data);
				if(r.cdata) {
					r.cdata = JSON.parse(r.cdata);
				}
			} catch (e) {
				debug(e)
			}
			return r;
		})
		return data;
	}
	
	/** tv shows **/
	Media.prototype.tvShows = function(limit, order) {
		if(!limit) limit = 50;
		if(!order) order = 'name ASC';
		const stmt = this.db.prepare('SELECT * FROM Series ORDER by ' + order + ' LIMIT ?');
		let cat =  stmt.all(limit);
		let data = cat.map(r => {
			try {
				r.data = JSON.parse(r.data);
				if(r.cdata) {
					r.cdata = JSON.parse(r.cdata);
				}
			} catch (e) {
				debug(e)
			}
			return r;
		})
		return data;
	}

	
	/** tv show **/
	Media.prototype.tvShow = function(ID) {
		if(!ID) {
			debug('No ID');
			return []
		}
		const stmt = this.db.prepare('SELECT * FROM Series where container_id = ?');
		let cat =  stmt.all(ID);
		const stmt2 = this.db.prepare('SELECT * FROM Episodes where container_id = ?');
		let cat2 =  stmt2.all(ID);
		try {
			cat2.data = JSON.parse(cat2.data);
			if(cat.cdata) {
				cat.cdata = JSON.parse(cat.cdata);
			}
		} catch (e) {
			debug(e)
		}
		return {
			'series': cat,
			'episodes': cat2,
		}	
	}
	
	/** tv shows **/
	Media.prototype.tvShowByName = function(name) {
		if(!name) {
			debug('No Name');
			return {}
		}
		const stmt = this.db.prepare('SELECT * FROM Series where series = ?');
		let cat =  stmt.all(name);
		const stmt2 = this.db.prepare('SELECT * FROM Episodes where container_id = ?');
		let cat2 =  stmt2.all(cat.container_id);
		
		try {
			cat2.data = JSON.parse(cat2.data);
			if(cat.cdata) {
				cat.cdata = JSON.parse(cat.cdata);
			}
		} catch (e) {
			debug(e)
		}
		
		return {
			'series': cat,
			'episodes': cat2,
		}	
		
	}

	/** tv shows **/
	Media.prototype.tvShowSearch = function(sql) {
		if(!sql) {
			debug('No Statement to execute');
			return {}
		}
		const stmt = this.db.prepare(sql);
		let results =  stmt.all();
		let episodes = [];
		let shows = [];
		if(results.length < 1) {
			debug('No Results for Search', sql)
			return {
				'series': 'cat',
				'episodes': [],
			}
		} else if(results.length == 1) {
			//create an array from the results
			//debug(results)
			shows = results;
		} else {
			shows = results;
		}
		debug('found',results.length,'results for search')
		shows.forEach((res) => {
			//debug('COntainer for ep search', res.seriesId)
			episodes = episodes.concat(this.tvShowEpisodes(res.seriesId));
		})
		//debug(episodes)	
		return {
			'series': shows,
			'episodes': episodes,
		}	
		
	}
	
	/** tv shows **/
	Media.prototype.tvShowByIMDB = function(IMDB) {
		
		
	}
	
	/** show episodes **/
	Media.prototype.tvShowEpisodes = function(seriesId) {
		const stmt2 = this.db.prepare('SELECT * FROM Episodes where seriesId = ?');
		let cat =  stmt2.all(seriesId);
		let data = cat.map(r => {
			try {
				r.data = JSON.parse(r.data);
				if(r.cdata) {
					r.cdata = JSON.parse(r.cdata);
				}
			} catch (e) {
				debug(e)
			}
			return r;
		})
		return data;
	}
	
	
	
	/** recent movies **/
	Media.prototype.recentMovies = function(limit) {
		if(!limit) limit = 50;
		let stmt = this.db.prepare('SELECT * FROM RecentMovies LIMIT ?');
		let cat =  stmt.all(limit);
		let data = cat.map(r => {
			try {
				r.data = JSON.parse(r.data);
				if(r.cdata) {
					r.cdata = JSON.parse(r.cdata);
				}
			} catch (e) {
				debug(e)
			}
			return r;
		})
		return data;
	}
	
	/** movies **/
	Media.prototype.movies = function(limit, order) {
		if(!limit) limit = 200;
		if(!order) order = 'name ASC';
		const stmt = this.db.prepare('SELECT * FROM Movies ORDER by ' + order + ' LIMIT ?');
		let cat =  stmt.all(limit);
		let data = cat.map(r => {
			try {
				r.data = JSON.parse(r.data);
				if(r.cdata) {
					r.cdata = JSON.parse(r.cdata);
				}
			} catch (e) {
				debug(e)
			}
			return r;
		})
		//return data;
		return new Promise( (resolve, reject) => {
			resolve(data);
		});
	}

	
	Media.prototype.movieByName = function(name) {
		
	
	}
	
	Media.prototype.movie = function(ID) {
		
	
	}
		
	Media.prototype.movieByIMDB = function(IMDB) {
		
	
	}
	
	return Media;
	
	
}


/* functions */

async function getNfo(file) {
	const ret = await Promise.all([ 
		new Promise((resolve, reject) => {
			xml2json({
				input: file,
			}, function(err, result) {
				if(err) {
					debug(err);
					return reject(err);
				} else {
					//debug(result);
					resolve(result)
				}
			
			});
		})
	]);
	return ret;
}

function getExt(res) {
	return path.extname(res).replace('.','');
}

async function getFiles(dir, byDir, pushTo) {
	let ret = {};
	
	const dirents = await readdir(dir, { withFileTypes: true });
  	await Promise.all(dirents.map((dirent) => {
    	if (byDir) {
			var use = ret[dirent.name] = {
				'name': dirent.name,
				'files': []
			}
		} else if (pushTo) {
			var use = pushTo;	
		} else if (ret['Videos']) {
			var use = ret['Videos'];
		} else {
			var use = ret['Videos'] = { 'files': [] };
		}
		
		const res = path.resolve(dir, dirent.name);
    	//debug(dirent)
    	if(dirent.isDirectory()) {
			return getFiles(res, false, use);
		} else if(mimes.video.includes(getExt(res)) == true) {
			use.files.push(res);
		}
		//debug(ret)
		return;
  	}));
  	return ret;
}
