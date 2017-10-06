/**
 * Live TV adapter
 *
 * ####Example:
 *
 *     LiveTV({}, callback)
 *
 * @param {Object} opts
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('woobi:core:adapter:livetv');
var net = require('net');
var moment = require('moment');
var mysqlP = require('promise-mysql');
var async = require("async");
var _ = require('lodash');
var pkg = require('../../../package.json');

module.exports = function ( Broadcast ) {
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
		
		// kodi mysql
		this.connection;
		
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
		
		mysqlP.createConnection({
			host:  opts.epg.host,
			user:  opts.epg.user,
			password:  opts.epg.pass,
			database:  opts.epg.database
		}).then((conn) => {
			this.epg = conn;
		});
		
		mysqlP.createConnection({
			host:  opts.tv.host,
			user:  opts.tv.user,
			password:  opts.tv.pass,
			database:  opts.tv.database
		}).then((conn) => {
			this.tv = conn;
			if(callback) callback(null, this);
		})
		.catch(e => {
			debug('ERROR with mysql connection', e);
			callback('ERROR with mysql connection');
		});	
		
		this.connect('GetServerVersion|' + moment.utc().format("Y-MM-DD H:mm:ss") + '|' + this.hostname);
		this.poll = setInterval( this.pollServer.bind(this), 15000);
			
		return this;
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
			callback(['Error GetServiceStatus', e], []);
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
			
			series.forEach(function(v) {
				var vv = v.split('|');
				if (vv[0] != '<EOF>' ) {
					d.push( {
						seriesId: vv[0],
						show: vv[1],
						channelId: vv[2],
						programId: vv[3],
						showName: vv[4],
						start: vv[5],
						end: vv[6],
						marginStart: vv[7],
						marginEnd: vv[8],
						//9: vv[9],
						//11: vv[11],
						//10: vv[10],
						//12: vv[12],
						anyChannel: vv[13],
						anyTime: vv[14],
						daysOfWeek: vv[15],
						state: vv[16],
						name: vv[17],
						genre: vv[18],
						subgenre: vv[19],
						runType: vv[20],
						timerId: vv[21],
						keyword: vv[22],
						fullText: vv[23],
						lifetime: vv[24],
						maximumRecordings: vv[25],
						priority: vv[26],
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
					timerId: vv[0], // iClientIndex
					channelId: vv[1], // iClientChannelUid
					startTime: vv[2],
					endTime: vv[3],
					state: vv[4], // pvr_timer_state
					name: vv[5],
					directory: vv[6], //strDirectory
					info: vv[7], //summary
					//8: vv[8], 
					//9: vv[9],
					recordMarginStart: vv[11],
					programId: vv[10],
					recordMarginEnd: vv[12],
					genre: vv[13],
					subgenre: vv[14],
					programId: vv[15],
					seriesTimerId: vv[16],
					//17: vv[17],
					//18: vv[18],
					runType: vv[19], // iPreventDuplicateEpisodes
					anyChannel: vv[20],
					anyTime: vv[21],
					daysOfWeek: vv[22], // iWeekdays
					parentSeriesID: vv[23], // iParentClientIndex
					lifetime: vv[24],
					maximumRecordings: vv[25],
					priority: vv[26],
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
		debug('Add Timer Test', obj.isSeries, obj.runType, obj.anyChannel, obj.anyTime);
		var send = 'SetTimer|-1'  // epg recording
			+ '|' + obj.channelId // Channel ID
			+ '|' + obj.startTime // Start date and time of listing
			+ '|' + obj.endTime  // End date and time of listing
			+ '|' + this.pvrStates.pvr_timer_state_new // pvr timer state boolean
			+ '|' + obj.title // name of listing
			+ '|' + (obj.priority || 0)  //XBMc Priotiry (not used)
			+ '|' + (obj.marginStart || 0) // pre padding in minutes
			+ '|' + (obj.marginEnd || 0)  // post padding in minutes
			+ '|' + (obj.isRepeating || 0)  // XBMC bIsRepeating 
			+ '|' + obj.programId  // ScheduleEntry ID
			+ '|' + (obj.isSeries || 0) // 1 = yes, 0 = no
			+ '|' + obj.runType // any=0, firstRun=1, live=2
			+ '|' + obj.anyChannel // 1 = yes, 0 = no
			+ '|' + obj.anyTime; // 1 = yes, 0 = no
	
		var message = 'Working on scheduling {0} for {2}.'.format(
            obj.title,
            obj.channelName || obj.channel,
            moment.unix(obj.startTime).format('LLLL')
        );
        
        var error = 'Error recording {0} {1} at {2}.'.format(
            obj.title,
            obj.channelName || obj.channel,
            moment.unix(obj.startTime).format('LLLL')
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
		
		var send = 'CancelTimer|{0}'.format( 
			obj.timerId // Timer ID
		);
		        
        var error = 'Error recording {0} on {2}.'.format(
            obj.title,
            moment.unix(obj.startTime).format('LLLL')
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
					moment.unix(obj.startTime).format('LLLL')
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
		
		var send = 'CancelSeriesTimer|{0}'.format( 
			obj.seriesId // Timer ID
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
	LiveTV.prototype.getGuideData = function ( channels, start, end ) {
			
			var sql = 'select a.*, b.sName "channelName" from epgtags a left join epg b on a.idEpg = b.idEpg ';
			var c = '';
			var dates = '';
			if ( channels ) {
				
				if ( !Array.isArray( channels ) ) channels = [channels];
				
				channels.forEach( function ( v, k ) {
					if ( k > 0 ) c += ' and ';
					c += ' a.idEpg = "' + v + '" ';
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
			
			debug( 'SQL: ', sql );
			
			return this.epg.query( sql )
			.then( ( rows ) => {
				// Logs out a list of hobbits 
				//console.log(rows);
				var promises = [];
				rows.forEach( ( ep, key ) => {
					var c = ep.channelName ? ep.channelName.split('/') : ['noChannelName'];
					promises.push( new Promise( ( resolve, reject ) => {
						resolve( {
							epgId: ep.idEpg,
							channel: c.pop(),
							programId: ep.iBroadcastUid,
							episodeId: ep.iEpisodeId,
							title: (typeof ep.sTitle == 'string') ? ep.sTitle.replace(/ *\([^)]*\) */g, "").trim() : '',
							episode: ep.sEpisodeName,
							iconPath: ep.sIconPath,
							startTime: ep.iStartTime,
							endTime: ep.iEndTime,
							genre: ( "" + ep.iGenreType + ep.iGenreSubType),
							repeat: (ep.iFirstAired+ 86400 === ep.iStartTime),
						});
				}));
			});
			debug('run promises for getGuideData');
			return Promise.all(promises).then( r => {
				debug('promises done');
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
				return { groups: groups };
			})
			.catch( ( e ) => {
				debug( 'Error in getGuideData', e );
			});
		});
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
			
			debug( 'SQL: ', sql );
			
			return this.epg.query( sql )
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
			debug('run promises for getGuideProgram');
			return Promise.all(promises).then( r => {
				debug('promises done');
				return r;
			});
		});
	}
	
	
	/** channel list **/
	LiveTV.prototype.getTVChannels = function ( ) {
			
			var replaceSMB = Broadcast.get('epg').replaceSMBWith;
			
			return this.tv.query( 'select * from channels' )
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
			debug('run promises');
			return Promise.all(promises).then( r => {
				debug('promises done');
				return r;
			});
		});
	}
	
	
	/** channel groups **/
	LiveTV.prototype.getChannelGroups = function ( ) {
			
			var replaceSMB = Broadcast.get('epg').replaceSMBWith;
			
			return this.tv.query( "select a.*, b.iUniqueId 'channelID', b.sChannelName 'Channel', b.idEpg, b.sIconPath, c.sName 'Group', c.idGroup  from map_channelgroups_channels a INNER JOIN channels b on a.idChannel=b.idChannel INNER JOIN channelgroups c on a.idGroup = c.idGroup order by b.sChannelName" )
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
			debug('run promises');
			return Promise.all(promises).then(r => {
				debug('promises done');
				var groups = {};
				r.forEach( function ( v, k ) {
					if ( !groups[v.group] ) groups[v.group] = [];
					groups[v.group].push(v);
				});
				return groups;
			});
		});
	}
	
	return LiveTV;
	
}

	
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};
