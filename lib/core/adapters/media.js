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

module.exports = function(Broadcast) {
	
	var replacePath = Broadcast.get('videoStringReplace');
	
	var Media = function (opts, callback) {
		if (!(this instanceof Media)) return new Media(opts, callback);
		debug('Woobi Sqlite3 Media Adapter construtor');
		
		this.mediaStore = path.join(Broadcast.mediaPath, 'woobiMedia.db') ;
		
		// create / grab the db
		this.db = new Database(this.mediaStore, {  }); // verbose: debug
		
		// table for monitored dirs
		this.db.prepare("CREATE TABLE IF NOT EXISTS monitor ( monitor_id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE );").run();
		// table for media entries
		this.db.prepare("CREATE TABLE IF NOT EXISTS media ( media_id INTEGER PRIMARY KEY, name TEXT NOT NULL , file TEXT NOT NULL UNIQUE, plot TEXT, data TEXT, airdate INTEGER, added INTEGER, updated INTEGER, container_id INTEGER, FOREIGN KEY (container_id) REFERENCES containers (container_id));").run();
		// table for types of video
		this.db.prepare("CREATE TABLE IF NOT EXISTS groups ( group_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);").run();
		// table for containers ex: name of series, name of movie, simple organization
		this.db.prepare("CREATE TABLE IF NOT EXISTS containers ( container_id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, group_id INTEGER, data TEXT, plot TEXT, FOREIGN KEY (group_id) REFERENCES groups (group_id));").run();
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
		this.db.exec('DROP VIEW IF EXISTS "main"."Series"; CREATE VIEW Series AS select   containers.container_id as seriesId, containers.name as series, (select count() from media where container_id=containers.container_id) episodes, containers.plot, containers.data, groups.name as "group", groups.group_id as "groupId", containers.name as name from containers INNER JOIN groups USING ( group_id ) where group_id=2 GROUP BY series' );

		// Episodes
		this.db.exec('DROP VIEW IF EXISTS "main"."Episodes"; CREATE VIEW Episodes AS select groups.name as "group", containers.container_id as seriesId, containers.name as series, media.media_id as mediaId, media.name, media.file, media.data, media.plot, media.airdate as airdate, containers.plot as cplot, containers.data as cdata, groups.group_id as "groupId" from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where containers.group_id = 2 ' );
		
		// Movie List
		this.db.exec('DROP VIEW IF EXISTS "main"."MovieList"; CREATE VIEW MovieList AS select  containers.container_id as movieId, containers.name as movie, (select count() from media where container_id=containers.container_id) episodes, containers.plot, containers.data, groups.name as "group", groups.group_id as "groupId" from containers INNER JOIN groups USING ( group_id ) where group_id=3 GROUP BY movie' );

		// Movies
		this.db.exec('DROP VIEW IF EXISTS "main"."Movies"; CREATE VIEW Movies AS select groups.name as "group", containers.container_id as movieId, media.airdate, containers.name as movie, media.media_id as mediaId, media.name, media.file, media.data, media.plot from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where group_id=3 ' );
		
		// Videos
		this.db.exec('DROP VIEW IF EXISTS "main"."Videos"; CREATE VIEW Videos AS select media.name, media.file, media.data, media.plot, media.airdate, media.media_id as mediaId, containers.name as container, containers.plot as cplot, containers.data as cdata, groups.name as "group" from containers LEFT JOIN media USING ( container_id ) INNER JOIN groups USING ( group_id ) where group_id=1 ');
		

		debug('Woobi Media Adapter return');
		//
		return this;
	}
	
	/** populate media store **/
	/**
	 * 
	 * @param {
	 * 	(*)name: string , // name of store
	 * 	(*)type: string, // Movies, Series, Videos, Other, Private
	 * 	(*)look: string, // path to dir
	 * 	byDir: boolean (false), // add items by top level directory that is series / movie name
	 *  nfo: boolean (false) // look for an nfo file associated with each File
	 *  nfoIsFilename: boolean (true) // expects basename to be the same, if false we do some hooboo and hope
	 * } obj
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
					return new Promise( (resolve2, reject2) => {

						async.forEachOfSeries(files, (data, key, finished) => {
							//debug('next');
							/* key is name of the Series or movie
							data.files is an array of videos
							data.name is the name of the Series or Movie
							*/
							// add the container
							//debug(key, ctn);
							
							var _ctn = this.db.prepare("INSERT OR IGNORE INTO containers (name, group_id) VALUES (?, ?)").run(key, typeid);
							if(_ctn.lastInsertRowid && _ctn.changes != 0) {
								var ctn = _ctn.lastInsertRowid;
								debug('Added container', key, _ctn);
							} else {
								var _cc = this.db.prepare("SELECT container_id from containers where name = ?").get(key);
								var ctn = _cc.container_id;
								debug('Using container', key, ctn);
							}

							if (ctn == '') {
								ctn = 1;
							}
							async.each(data.files, (file, cb) => {
								// check for an nfo file first
								if(getExt(file) == 'nfo') {
									getNfo(file)
									.then(r => {
										let _o = {};
										let _keyname = obj.nfoNotFilename ? key : path.parse(file).name;
										_o[_keyname] = r[0][Object.keys(r[0])[0]]
										_o[_keyname].ORIGINAL = Object.keys(r[0])[0];
										nfo.push( _o );
										//debug('Got nfo', r)
										cb();
									});
									return;
									
								} else {
																	
									//add to database
									var stmt = this.db.prepare("INSERT OR IGNORE INTO media (name, file, added, container_id) VALUES (?, ?, ?, ?)")
									var info = stmt.run(path.parse(file).name, file, moment().valueOf(), ctn)
									
									//debug(obj.type, 'INSERT:  ', info.lastInsertRowid, typeid, file)
									if(info.lastInsertRowid && typeid) {
										//debug('-- Added', file, 'to', key  );
										this.db.prepare("INSERT  OR IGNORE INTO media_groups (media_id, group_id) VALUES (?, ?)").run( info.lastInsertRowid,  typeid);
			
									} else {
										//this entry exists so we could update the time
										this.db.prepare("UPDATE media set updated=? where name=?").run(moment().valueOf(), path.parse(file).name);
										//debug('-- Exists: ', file, 'in', key  );
									}	
									cb();
								}								
							}, function (err) {
								debug('done with files for', key);
								finished();
							});
							
						},  (err) => {
							debug('done with media for', obj.look, nfo.length);
							// we are done adding media files
							// now we can loop throu any nfo files we found and try and update the
							// media entries for them
							if(obj.nfo && nfo.length > 0) {
								debug('Starting nfo loop and updates', nfo.length);
								async.each(nfo, (_info, cb2) => {
									var add;
									var _container = Object.keys(_info)[0];
									var info = _info[_container];
									try {
										add = JSON.stringify(info);
									} catch(e) {
										debug('Failed to jsonify the data from nfo')
										return cb2();
									}
									debug(info.ORIGINAL, _container, info.title)
									// get ready to try and add the info
									if(info.ORIGINAL == 'tvshow' || info.ORIGINAL == 'movie') {
										// this nfo is not a file but may match a container
										let sql = this.db.prepare("UPDATE containers SET data=?, plot=? WHERE name LIKE ? ORDER BY name LIMIT 3"); 
										var _searchFor = info.title;
										var res = sql.run( add, info.plot, info.title+'%');
										debug('##series', (res.changes > 0) ? 'SUCCESS' : 'ERROR', 'updating', _searchFor, res);
									} 
									if (info.ORIGINAL != 'tvshow') {
										let sql = this.db.prepare("UPDATE media SET airdate=?, data=?, plot=? WHERE name LIKE ? ORDER BY name LIMIT 3");
										const airdate = info.premiered || info.aired || info.dateadded;
										// try and add the info
										var _searchFor = obj.nfoNotFilename ? ''+_container+'%' : _container;
										var res = sql.run(moment(airdate).valueOf(), add, info.plot, _searchFor);
										debug('##file', (res.changes > 0) ? 'SUCCESS' : 'ERROR', 'updating', _searchFor, res);
									}
									
									
									cb2();

								}, (err) => {
									resolve2();
								})
							} else {
								resolve2();
							}
							
						});
					});
				})
				// now create your store
				.then(files => {
					debug('Added all for ', obj.look)
					var rows = this.db.prepare("SELECT media.* from media, groups, media_groups where groups.name = ? and media_groups.group_id = groups.group_id and media.media_id = media_groups.media_id").all(obj.type);
					//debug('From db:', rows);
					resolve();
				})
				.catch( e => {
					debug(e);
				});
		}); 
	}
	
	/** videos **/
	Media.prototype.videos = function(limit, order) {
		if(!limit) limit = 50;
		if(!order) order = 'name ASC';
		const stmt = this.db.prepare('SELECT * FROM Videos ORDER by ? LIMIT ?');
		let cat =  stmt.all(order, limit);
		return cat;
	}

	/** recent tv episodes **/
	Media.prototype.recentEpisodes = function(limit, order, updown) {
		if(limit == '') limit = 50;
		if(!order) order = 'airdate DESC';
		if(!updown) updown = ' ';
		debug(limit, order, updown);
		const stmt = this.db.prepare('SELECT * FROM Episodes ORDER by ' + order + ' LIMIT ?');
		let cat =  stmt.all(limit);
		return cat;
	}
	
	/** tv shows **/
	Media.prototype.tvShows = function(limit, order) {
		if(!limit) limit = 50;
		if(!order) order = 'name ASC';
		const stmt = this.db.prepare('SELECT * FROM Series ORDER by ? LIMIT ?');
		let cat =  stmt.all(order, limit);
		return cat;
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
		return {
			'series': cat,
			'episodes': cat2,
		}	
		
	}
	
	/** tv shows **/
	Media.prototype.tvShowByIMDB = function(IMDB) {
		
		
	}
	
	/** show episodes **/
	Media.prototype.tvShowEpisodes = function(showID) {
		const stmt2 = this.db.prepare('SELECT * FROM Episodes where container_id = ?');
		let cat2 =  stmt2.all(cat.container_id);
		return cat2;
	}
	
	
	
	/** recent movies **/
	Media.prototype.recentMovies = function(num) {
		if ( !Number(num) ) {
			num = 50
		}
		
	}
	
	/** movies **/
	Media.prototype.movies = function() {
		
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
