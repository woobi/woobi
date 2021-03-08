

var debug = require('debug')('woobi:core:adapter:livetv');
var net = require('net');
var moment = require('moment');
var mysqlP = require('promise-mysql');
var async = require("async");
var _ = require('lodash');
var pkg = require('../../../package.json');
var Promise = require('bluebird');
/** 
 * Manage broadcast channels
 * @module Broadcast/libs/livetv
 * 
 * */
module.exports = function ( Broadcast ) {
	/**
 * Live TV adapter
 *
 * ####Example:
 *
 *     LiveTV({}, callback)
 * @class
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */
	var LiveTV = function ( opts, callback ) {
		
		if ( !( this instanceof LiveTV ) ) return new LiveTV( opts, callback );
		
		debug('LiveTV Adapter constructor');
		
		var _this = this;
		
		// configs
		this.socket = opts.socket;
		this.epg = opts.epg;
		this.tv = opts.tv;
		this.pvrStates = {
			pvr_timer_state_new: 0, // a new, unsaved timer
			pvr_timer_state_scheduled: 1,   //  the timer is scheduled for recording
			pvr_timer_state_recording: 2,   //  the timer is currently recording
			pvr_timer_state_completed: 3,   //  the recording completed successfully
			pvr_timer_state_aborted: 4 ,    //  recording started, but was aborted
			pvr_timer_state_cancelled: 5,   //  the timer was scheduled, but cancelled
			pvr_timer_state_conflict_ok: 6, //  the scheduled timer conflicts with another one but will be recorded
			pvr_timer_state_conflict_nok: 7, //  the scheduled timer conflicts with another one and won't be recorded
			pvr_timer_state_error: 8,       //  the timer is scheduled, but can't be recorded for some reason
				
		}
		this.recordingStates = {
			none: 0,
			scheduled: 1,
			initializing: 2,
			recording: 3,
			recorded: 4,
			deleted: 5,
		}
		
		if ( typeof callback !== 'function' ) {
			callback = function () {};
		}
		
		if ( !this.socket.port || !this.socket.host ) {
			debug('Could not set up LiveTV without a host and port');
			callback( 'Could not set up LiveTV without a host and port' );
			return this;
		}
		
		// message protocol
		this.agent = opts.socket.agent || 'Woobi';
		this.hostname = opts.socket.hostname || 'studio';
		this.iden = opts.socket.iden || '';
		
		//this.pre = opts.socket.pre || this.agent + '@' + this.hostname + '@' + 2 + '|';
		this.pre = this.hostname + '|';
		this.post = opts.socket.post || '<Client Quit>';
				
		if(!opts.epg.user || !opts.epg.pass  || !opts.epg.database || !opts.epg.host) {
			console.log('A correct epg adapter config is required!  Exiting now.');
			process.exit();
			return false;
		}

		if(!opts.tv.user || !opts.tv.pass  || !opts.tv.database || !opts.tv.host) {
			console.log('A correct tv adapter config is required!  Exiting now.');
			process.exit();
			return false;
		}
		
		this.opts = opts;
		
		this.tv = mysqlP.createPool({
			host: this.opts.tv.host,
			user: this.opts.tv.user,
			password: this.opts.tv.pass,
			database: this.opts.tv.database,
			waitForConnections: true,
			connectionLimit: 10,
		})
		
		this.epg = mysqlP.createPool({
			host: this.opts.epg.host,
			user: this.opts.epg.user,
			password: this.opts.epg.pass,
			database: this.opts.epg.database,
			waitForConnections: true,
			connectionLimit: 10,
		})
		
				
		this.poll = null;
		// get status from wmc
		this.connect('GetServerVersion|' + moment.utc().format("Y-MM-DD H:mm:ss") + '|' + this.hostname);
		
		this.poll = setInterval( this.pollServer.bind(this), 60000);
		
		this.replace = {
			replaceSMBWith: function ( str ) {
				var p = str.split('/');
				// get the file
				p = p.slice(-1)[0];
				if( p ) {
					return '/woobi/media/anna/TempSWMC/imageCache/channelIcons/' + p;
				} else {
					return ''
				}
			},
			replaceSMBForRecording: function ( str ) {
				//debug(str)
				var p = str.split('/');
				// get the file
				p = p.slice(-1)[0];
				if( p ) {
					return 'http://studio.snowpi.org:2777/woobi/stream/media/anna/' + p;
				} else {
					return ''
				}
			}
		};
		
		if(callback) callback(null, this);	
		
		return this;
		
	}
	
	LiveTV.prototype.endSession = function ( ) {
		debug('END Session');
		this.epg.end()
		.then(function (err) {
		  debug('Pool epg ended', err);
		});
		this.tv.end()
		.then(function (err) {
		  debug('Pool tv ended', err);
		});
		clearInterval(this.poll);
	}
	
	LiveTV.prototype.connection = function ( db ) {
		const use = db === 'tv' ? db : 'epg';
		
		return new Promise( resolve => {
			resolve(this[use]);
		});
		/*
		const getSqlConnection = () => {
			return this[use].getConnection().disposer( connection => {
				debug('release connection');
				this[use].releaseConnection(connection);
			});
		}
				
		return Promise.using(getSqlConnection(), function(connection) {
			return connection;
		})
		*/
		
	}
	
	LiveTV.prototype.connect = function ( words ) {
		
		//debug( 'message', words );
		
		return new Promise((resolve, reject) => {
			
			var client = new net.Socket();
			var msg = this.pre + words + this.post;
			
			var ret;
			
			client.setEncoding('utf8');
			
			client.connect(this.socket.port, this.socket.host, function() {
				//debug('Connected to LiveTV');
				client.write(msg);
				//debug('Sent: ', msg);
			});
			
			client.on('data', function(data) {
				//debug('Received data ', data);
				ret += data;
				if ( data.search( '<EOF>' ) > -1 ) {
					// our result will be in the form of value<EOL>value<EOL><EOF>
					var c = ret.split('<EOL>');
					// clean up the first 
					c[0] = c[0].replace('undefined','');
					// dump the eol
					c.pop();
					resolve(c);
					client.destroy(); // kill client after server's response
				}
				
			});

			client.on('error', function(error) {
				debug('LiveTV Connection error');
				reject(error);
			});
			
			client.on('close', function() {
				// debug('LiveTV Connection closed');
				
			});

		});
		
	}
	
	/* poll the server for notification */
	LiveTV.prototype.pollServer = function ( ) {
			
		var send = 'GetServiceStatus|1.3.0|linux'; // + pkg.name + "|" + pkg.version;
		//debug( 'GetServiceStatus', send );	
		
		return this.connect( send )
		.then( ( status ) => {

			//debug( 'Service Status Result', c );
			if ( status[0] == 'True' ) {
				// the server is up
				if ( status.length > 1 ) {
					// we may have a status update or message
					// let notify figure out what should be updated
					this.notify( 'update', status );
				}
			} else {
				// send notification of service error
				this.notify( 'server', false )
			}
			
		})
		.catch(e => {
			debug('ERROR with GetServiceStatus', e);
			this.notify( 'server', false )
			return res;
		});	
		
	}
	
	/* send notificationof updates or messages */
	LiveTV.prototype.notify = function ( who, results ) {
		//debug('notify', who, results);
		// remove the server status
		var isUp = results.shift() === 'True' ? true : false;
		//debug('after status', results);
		// remove the drivespace
		var space = results.shift();
		if ( typeof space === 'string' ) space = space.split("|");
		//debug('after space', space, results);
		var transform = {
			updateTimers: 'getAllTimers',
			updateRecordings: 'getRecordings',
			updateChannels: 'getChannels',
			updateChannelGroups: 'getChannelGroups',
			updateEPGForChannel: 'getGuideData',
			message: 'parseMessage'
		}
		results.forEach( function (v) {
			var vv = v.split('|');
			Broadcast.notify( 'notify epg', {
				update: transform[vv[0]] || vv[0] || false
			});
		});
	}
	
	LiveTV.prototype.getSeriesTimers = function ( callback ) {
			
		if ( !_.isFunction( callback ) ) {
				callback = function() {};
			}
		var send = 'GetSeriesTimers|False';
		debug( 'getSeriesTimers', send );	
		return this.connect( send )
		.then( ( series ) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			var d = [];
			
			function strToBool( e, reversed ) {
				if ( reversed === true ) 	return e.toLowerCase() === 'true' ? 1 : 0;
				return e.toLowerCase() === 'true' ? 0 : 1;
			}
			
			series.forEach(function(v) {
				var vv = v.split('|');
				if (vv[0] != '<EOF>' ) {
					d.push( {
						seriesId: Number(vv[0]),
						show: vv[1],
						channelId: Number(vv[2]),
						programId: Number(vv[3]),
						showName: vv[4],
						start: Number(vv[5]),
						end: Number(vv[6]),
						marginStart: Number(vv[7]),
						marginEnd: Number(vv[8]),
						isPreMarginRequired: vv[9],
						priority: vv[11],
						isPostMarginRequired: vv[10],
						//12: vv[12],
						anyChannel: strToBool(vv[13]),
						anyTime: strToBool(vv[14]),
						daysOfWeek: Number(vv[15]),
						state: Number(vv[16]),
						name: vv[17],
						genre: Number(vv[18]),
						subgenre: Number(vv[19]),
						runType: Number(vv[20]),
						timerId: Number(vv[21]),
						keyword: vv[22],
						fullText: vv[23],
						lifetime: Number(vv[24]),
						maximumRecordings: Number(vv[25]),
						priority: Number(vv[26]),
					} );
				}
			});
			
			debug('got series');
		
			callback(null,  _.sortBy( d, ['show'] ) );
			
			return  _.sortBy( d, ['show'] );
			
		})
		.catch(e => {
			debug('ERROR with getSeriesTimers', e);
			callback(['Error getting series', e], []);
			return res;
		});	
		
	}
		
	LiveTV.prototype.getTimers = function ( callback ) {
			
		if ( !_.isFunction( callback ) ) {
				callback = function() {};
			}
		var send = 'GetTimers';
		debug( 'GetTimers', send );	
		return this.connect( send )
		.then( ( timers ) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			var d = [];
			
			timers.forEach(function(v) {
				var vv = v.split('|');
				d.push( {
					timerId: Number(vv[0]), // iClientIndex
					channelId: Number(vv[1]), // iClientChannelUid
					startTime: Number(vv[2]),
					endTime: Number(vv[3]),
					state: Number(vv[4]), // pvr_timer_state
					name: vv[5],
					directory: vv[6], //strDirectory
					info: vv[7], //summary
					priority: Number(vv[8]), 
					isRepeating: vv[9],
					recordMarginStart: Number(vv[11]),
					programId: Number(vv[10]),
					recordMarginEnd: Number(vv[12]),
					genre: Number(vv[13]),
					subgenre: Number(vv[14]),
					programId: Number(vv[15]),
					seriesTimerId: Number(vv[16]),
					isPreMarginRequired: vv[17],
					isPostMarginRequired: vv[18],
					runType: Number(vv[19]), // iPreventDuplicateEpisodes
					anyChannel: Number(vv[20]),
					anyTime: Number(vv[21]),
					daysOfWeek: Number(vv[22]), // iWeekdays
					parentSeriesID: Number(vv[23]), // iParentClientIndex
					lifetime: Number(vv[24]),
					maximumRecordings: Number(vv[25]),
					priority: Number(vv[26]),
					keyword: vv[27],
					fulltext: vv[28],
				} );
				
			});
			
			debug('got timers');
			
			callback(null, _.sortBy( d, ['startTime'] ) );
			
			return _.sortBy( d, ['startTime'] );
			
		})
		.catch(e => {
			debug('ERROR with getTimers', e);
			var res = {
				success: false,
				series: [],
			}
			callback(['Error getting timers', e], []);
			return res;
		});	
		
	}
	
	LiveTV.prototype.setTimer = function ( obj, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		debug('Add Timer Test', obj);
		var send = 'SetTimerKodi'
			+ '|' + (obj.recordingType || -1)   // epg recording
			+ '|' + (obj.anyChannel || -1) // Channel ID or -1 for any
			+ '|' + obj.startTime // Start date and time of listing
			+ '|' + obj.endTime  // End date and time of listing
			+ '|' + this.pvrStates.pvr_timer_state_new // pvr timer state boolean
			+ '|' + obj.title // name of listing
			+ '|' + (obj.priority || 0)  // priority 0 normal / 1 high / 2 low 
			+ '|' + (obj.marginStart || 0) // pre padding in minutes
			+ '|' + (obj.marginEnd || 0)  // post padding in minutes
			+ '|' + (obj.isRepeating || 0)  // bIsRepeating -  // 1 = yes, 0 = no
			+ '|' + obj.programId  // ScheduleEntry ID
			+ '|' + (obj.runType || 0) // any=0, firstRun=1, live=2
			+ '|' + (obj.anyTime || 0) // 0 = yes, 1 = no
			+ '|' + (obj.weekDays || 127) //  i have no idea how this is calculated  127 = all days (mon and Sun = 65) (thur & fri = 24) (tu-th-sa = 42)
			+ '|' + (obj.lifetime || -1) // when to delete - -4 not set, -3 latest, -2 watched, -1 as needed, 0 manual, 7 one week
			+ '|' + (obj.isKeyword || 0)// 1 = yes, 0 = no
			+ '|' + (obj.fullText || 0) // 0 = no or string
			+ '|' + (obj.search || 0) //  0 = no or string
			+ '|' + (obj.maxRecordings || -1) // -1 as many as possible to 10
			+ '|' + (obj.isManual || 0) // 1 = yes, 0 = no
	
		var message = 'Working on scheduling {0} at {2}.'.format(
            obj.title,
            obj.channelName || obj.channel,
            moment.unix(obj.startTime).format('llll')
        );
        
        var error = 'Error scheduling {0} at {2}.'.format(
            obj.title,
            obj.channelName || obj.channel,
            moment.unix(obj.startTime).format('llll')
        );
		
		debug( 'Set a Timer', send);	
		return this.connect(send)
		.then((results) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			debug('got timer results');
			
			var res = {
				success: results[0] == 'error' ? false : true,
				message: results[0] == 'error' ? results[0] : message,
				error: results[0] == 'error' ? error : false
			};
			
			callback( null, res );
			
			return res;
			
		})
		.catch(e => {
			debug('ERROR with setTimer', e);
			var res = {
				success: false,
				error: e,
			}
			callback(null, res);
			return res;
		});	
		
	}
	
	LiveTV.prototype.deleteTimer = function ( obj, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		
		var send = 'DeleteTimerKodi|{0}|0'.format( 
			obj.timerId // Timer ID
		);
		        
        var error = 'Error recording {0} on {2}.'.format(
            obj.title,
            moment.unix(obj.startTime).format('llll')
        );
		
		debug( 'Delete a Timer', send);	
		return this.connect(send)
		.then((results) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			debug('got delete timer results');
			
			var res = {
				success: true,
				message: '{1}... Working on removing {0} on {2}.'.format(
					obj.title,
					results[0],
					moment.unix(obj.startTime).format('llll')
				),
			};
			
			callback( null, res );
			
			return res;
			
		})
		.catch(e => {
			debug('ERROR with deleteTimer', e);
			var res = {
				success: false,
				error: e,
			}
			callback(null, res);
			return res;
		});	
		
	}
	
	LiveTV.prototype.deleteSeriesTimer = function ( obj, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		
		var send = 'DeleteTimerKodi|{0}|1'.format( 
			obj.timerId // Timer ID
		);
		        
        var error = 'Error cancelling {0}.'.format(
            obj.showName
        );
		
		debug( 'Delete a Series Pass', send);	
		return this.connect(send)
		.then((results) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			debug('got delete series pass results');
			
			var res = {
				success: results[0] == 'error' ? false : true,
				message: results[0] == 'error' ? 'Could not remove series pass' : '{1}... Working on removing {0}.'.format(
					obj.showName,
					results[0]
				),
			};
			
			callback( null, res );
			
			return res;
			
		})
		.catch(e => {
			debug('ERROR with deleteSeriesTimer', e);
			var res = {
				success: false,
				error: e,
			}
			callback(null, res);
			return res;
		});	
		
	}
	
	/* get saved recordings */
	LiveTV.prototype.getRecordings = function ( callback ) {
			
		if ( !_.isFunction( callback ) ) {
			callback = function() {};
		}
		
		var replaceSMB = this.replace.replaceSMBForRecording;
		
		var send = 'GetRecordings';
		debug( 'GetRecordings', send );	
		return this.connect( send )
		.then( ( recordings ) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			var d = [];
			
			recordings.forEach(function(v) {
				var vv = v.split('|');
				var show = vv[3].replace(/ *\([^)]*\) */g, "").trim();
				var count = vv[3].replace(show,'').trim().replace('(','').replace(')','');
				//debug(vv);
				d.push( {
					recordingId: vv[0], // 
					title: vv[1], // 
					url: replaceSMB(vv[2]),
					directory: vv[3],
					show: show,
					count: count,
					plotOutline: vv[4], // 
					plot: vv[5],
					channelName: vv[6], //
					iconPath: vv[7], //
					thumbnailPath: vv[8], 
					recordingTime: Number(vv[9]),
					duration: Number(vv[11]),
					priority: Number(vv[10]),
					lifetime: Number(vv[12]),
					genreType: Number(vv[13]),
					subGenreType: Number(vv[14]),
					genre: Number('' + vv[13] + vv[14]),
					lastplayedPosition: Number(vv[15]),
					status: vv[16],
					channelId: Number(vv[17]),
					programId: Number(vv[18]),
					19: vv[19], // 
					audio: vv[20],
					21: Number(vv[21]),
					22: Number(vv[22]), // 
					23: Number(vv[23]), // 
					playCount: Number(vv[24]),
					25: vv[25],
					26: vv[26],
					27: vv[27],
					28: vv[28],
				} );
				
			});
			
			debug('got recordings');
			
			d = _.sortBy( d, ['recordingTime'] ) ;
			
			callback(null, d);
			
			return d;
			
		})
		.catch(e => {
			debug('ERROR with getRecordings', e);
			var res = {
				success: false,
				series: [],
			}
			callback(['Error getting recordings', e], []);
			return res;
		});	
		
	}
	
	LiveTV.prototype.getChannelsSocket = function ( callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		var send = 'GetChannels|False';
		debug( 'Get Channels', send);	
		return this.connect(send)
		.then((channels) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			channels.forEach(function(v) {
				var vv = v.split('|');
				d[vv[2]] = {
					id: vv[0],
					isRadio: vv[1],
					channel: vv[2],
					name: vv[8],
					encrypted: vv[4],
					logo: vv[5],
					blocked: vv[6],
					realChannel: vv[7],
					callsign: vv[3],
					url: vv[9]
				};
				
			});
			
			debug('got channels');
			
			callback( null, d );
			
			return d;
			
		})
		.catch(e => {
			debug('ERROR with getChannels', e);
			var res = {
				success: false,
				channels: [],
			}
			callback(null, res);
			return res;
		});	
		
	}
		
	LiveTV.prototype.guideDataSocket = function ( id, start, end, callback ) {
			
		if(!_.isFunction(callback)) {
			callback = function() {};
		}
		var send = 'GetEntries|' + id + '|' + start + '|' + end;
		debug( 'GetEntries', send);	
		return this.connect(send)
		.then((entries) => {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			entries.forEach(function(v) {
				var vv = v.split('|');
				d[vv[3]] = {
					guideID: vv[0],
					title: vv[1],
					channel: vv[2],
					start: vv[3],
					end: vv[4],
					info: vv[5],
					desc: vv[6],
					original: vv[7],
					rating: vv[8],
					star: vv[9],
					season: vv[11],
					episode: vv[10],
					eps: vv[12],
					genre: vv[13],
					icon: vv[14],
					episodeTitle: vv[15],
					showID: vv[16],
					audio: vv[17],
					tags: vv[18],
					19: vv[19],
					cast: vv[20],
					director: vv[21],
					writer: vv[22],
					year: vv[23],
					imdb: vv[24],
					isSeries: vv[25]
				};
				
			});
			
			debug('got entries');
			
			var res = {}
			
			entries[id] = d;
			
			callback(null, res);
			
			return res;
			
		})
		.catch(e => {
			
			debug('ERROR with guideData', e);
			var res = {
				success: false,
				channels: [],
			}
			callback(null, res);
			return res;
			
		});	
		
	}
	
	/** guide data **/
	LiveTV.prototype.getGuideData = function ( obj ) {
		var channels = obj.channels;
		var start = obj.start;
		var end = obj.end
		var userSQL = obj.sql;
		if ( !userSQL ) {	
			var sql = 'select a.*, b.sName "channelName" from epgtags a left join epg b on a.idEpg = b.idEpg ';
			var c = '';
			var dates = '';
			if ( channels ) {
				
				if ( !Array.isArray( channels ) ) channels = [channels];
				
				channels.forEach( function ( v, k ) {
					if ( k > 0 ) c += ' and ';
					c += ' channelName = "' + v + '" ';
				});
				
				if ( c !== '' ) {
					sql += ' WHERE ' + c;
				}
				
			}
			
			if ( start ) {
				if ( channels ) {
					sql += ' and ';
				} else {
					sql += ' WHERE ';
				}
				sql += ' a.iEndTime >= ' + start + ' and iStartTime <= ' + end;
			}
			
			sql += ' order by channelName, iStartTime';
		} else {
			var sql = userSQL;
		}
		
		//debug( 'SQL: ', sql );
		
		return this.connection()
		.then( conn => {
			return conn.query( sql )
			.then( ( rows ) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach( ( ep, key ) => {
					var c = ep.channelName ? ep.channelName.split('/') : ['noChannelName'];
					promises.push( new Promise( ( resolve, reject ) => {
						//debug(Number(ep.iFirstAired), Number(ep.iStartTime))
						resolve( {
							epgId: ep.idEpg,
							channel: c.pop(),
							programId: ep.iBroadcastUid,
							episodeId: ep.iEpisodeId,
							title: (typeof ep.sTitle == 'string') ? ep.sTitle.replace(/ *\([^)]*\) */g, "").trim() : '',
							episode: ep.sEpisodeName,
							iconPath: ep.sIconPath,
							firstAired: ep.iFirstAired,
							startTime: ep.iStartTime,
							endTime: ep.iEndTime,
							genre: ( "" + ep.iGenreType + ep.iGenreSubType),
							repeat: (Number(ep.iFirstAired) == Number(ep.iStartTime)),
						});
					}));
				});
				
				return Promise.all(promises).then( r => {
					debug('ran promises for getGuideData');
					var groups = {};
					var map = [];
					r.forEach( function ( v, k ) {
						if ( !groups[v.channel] ) groups[v.channel] = [];
						if ( v.channel ) {
							groups[v.channel].push(v);
							/*map.push( {
								title: v.title,
								channel: v.channel,
								key: groups[v.channel].length -1,
							});*/
						}
					});
					//conn.end();
					return { groups: groups, guide: r };
				})
				.catch( ( e ) => {
					debug( 'Error in getGuideData', e );
				});
			});
		}).catch(debug);
	}
	
	
	/** single guide program **/
	LiveTV.prototype.getGuideProgram = function ( program, key ) {
		let useKey;
		switch ( key ) {
			case "title":
				useKey = 'sTitle';
				break;
			default:	
				useKey = 'iBroadcastUid';
		}
		
		var sql = 'select a.*, b.sName "channelName" from epgtags a left join epg b on a.idEpg = b.idEpg ';
		sql += ' WHERE a.' + useKey + ' = "' + program + '"';
		
		sql += ' order by iStartTime';
				
		return this.connection('epg')
		.then( conn => {
			return conn.query( sql )	
			.then( ( rows ) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach( ( ep, key ) => {
					var c = ep.channelName ? ep.channelName.split('/') : ['noChannelName'];
					promises.push( new Promise( ( resolve, reject ) => {
						resolve( {
							channelName: ep.channelName,
							channel: c.pop(),
							epgId: ep.idEpg,
							broadcastId: ep.idBroadcast,
							programId: ep.iBroadcastUid,
							title: (typeof ep.sTitle == 'string') ? ep.sTitle.replace(/ *\([^)]*\) */g, "").trim() : '',
							plotOutline: ep.sPlotOutline,
							plot: ep.sPlot,
							originalTitle: ep.sOriginalTitle,
							cast: ep.sCast,
							director: ep.sDirector,
							writer: ep.sWriter,
							year:  ep.iYear,
							imdb: ep.sIMDBNumber,
							iconPath: ep.sIconPath,
							startTime: ep.iStartTime,
							endTime: ep.iEndTime,
							genreType: ep.iGenreType,
							genreSubType: ep.iGenreSubType,
							genre:  ep.sGenre,
							firstAired: ep.iFirstAired,
							parentalRating: ep.iParentalRating,
							starRating: ep.iStarRating,
							seriesId: ep.iSeriesId,
							episodeId:  ep.iEpisodeId,
							episodePart: ep.iEpisodePart,
							episode: ep.sEpisodeName,
						});
					}));
				});
				
				return Promise.all(promises).then( r => {
					debug('ran promises for getGuideProgram');
					//conn.end();
					return r;
				});
			});
		}).catch(debug);
	}
	
	
	/** channel list **/
	LiveTV.prototype.getTVChannels = function ( ) {
			
		var replaceSMB = this.replace.replaceSMBWith;
		return this.connection('tv')
		.then( conn => {
			return conn.query( 'select * from channels' )	
			.then( ( rows ) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach((ep) => {
					promises.push( new Promise( ( resolve, reject ) => {
						var c = ep.sChannelName.split('/');
						resolve( {
							channelId: ep.iUniqueId,
							epgId: ep.idEpg,
							channelName: ep.sChannelName,
							channel: c.pop(),
							name: c[0],
							//isRadio: ep.bIsRadio,
							//isHidden: ep.bIsHidden,
							//isUserSetIcon: ep.bIsUserSetIcon,
							//isUserSetName: ep.bIsUserSetName,
							//isLocked: ep.bIsLocked,
							iconPath: replaceSMB(ep.sIconPath),
							//isVirtual: ep.bIsVirtual,
							//EPGEnabled:  ep.bEPGEnabled,
							//EPGScraper: ep.sEPGScraper,
							//lastWatched: ep.iLastWatched,
							//clientId: ep.iClientId
						});
					}));
				});
				return Promise.all(promises).then( r => {
					debug('promises done');
					//conn.end();
					return r;
				});
			});
		}).catch(debug);
	}
	
	
	/** channel groups **/
	LiveTV.prototype.getChannelGroups = function ( ) {
			
		var replaceSMB = this.replace.replaceSMBWith;
		return this.connection('tv')
		.then( conn => {
			return conn.query( "select a.*, b.iUniqueId 'channelID', b.sChannelName 'Channel', b.idEpg, b.sIconPath, c.sName 'Group', c.idGroup  from map_channelgroups_channels a INNER JOIN channels b on a.idChannel=b.idChannel INNER JOIN channelgroups c on a.idGroup = c.idGroup order by b.sChannelName" )
			.then( ( rows ) => {
				//console.log(rows);
				var promises = [];
				rows.forEach((ep) => {
					promises.push( new Promise( ( resolve, reject ) => {
						var c = ep.Channel.split('/');
						resolve( {
							//idChannel: ep.idChannel,
							//idGroup: ep.idGroup,
							epgId: ep.idEpg,
							channel: c.pop(),
							name: c[0],
							group: ep.Group,
							channelId: ep.channelID,
							channelName: ep.Channel,
							iconPath: replaceSMB(ep.sIconPath),
						});
					}));
				});
				return Promise.all(promises).then(r => {
					debug('promises done');
					var groups = {};
					r.forEach( function ( v, k ) {
						if ( !groups[v.group] ) groups[v.group] = [];
						groups[v.group].push(v);
					});
					//conn.end();
					return groups;
				});
			});
		}).catch(debug);
	}
	
	return LiveTV;
	
}

	
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};
