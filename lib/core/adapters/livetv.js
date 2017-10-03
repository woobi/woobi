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

module.exports = function ( Broadcast ) {
	var LiveTV = function ( opts, callback ) {
		
		if ( !( this instanceof LiveTV ) ) return new LiveTV( opts, callback );
		
		debug('LiveTV Adapter constructor');
		
		var _this = this;
		
		// configs
		this.socket = opts.socket;
		this.epg = opts.epg;
		this.tv = opts.tv;
		
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
		
		this.pre = opts.socket.pre || this.agent + '^@' + this.hostname + '@' + this.iden + '|';
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
		
		
			
		return this;
	}
	
	LiveTV.prototype.connect = function ( words ) {
		
		debug( 'message', words );
		
		return new Promise((resolve, reject) => {
			
			var client = new net.Socket();
			var msg = this.pre + words + this.post;
			
			var ret;
			
			client.setEncoding('utf8');
			
			client.connect(this.socket.port, this.socket.host, function() {
				debug('Connected to LiveTV');
				client.write(msg);
				debug('Sent: ', msg);
			});
			
			client.on('data', function(data) {
				debug('Received data ', typeof data);
				ret += data;
				if ( data.search( '<EOF>' ) > -1 ) {
					resolve(ret);
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
			
			var c = series.split('<EOL>');
			c[0] = c[0].replace('undefined','');
			c.forEach(function(v) {
				var vv = v.split('|');
				if (vv[0] != '<EOF>' ) {
					d.push( {
						id: vv[0],
						show: vv[1],
						channelId: vv[2],
						episodeId: vv[3],
						showName: vv[4],
						start: vv[5],
						end: vv[6],
						marginStart: vv[7],
						marginEnd: vv[8],
						9: vv[9],
						11: vv[11],
						10: vv[10],
						12: vv[12],
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
			var res = {
				success: false,
				series: [],
			}
			callback(null, res);
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
			
			var c = timers.split('<EOL>');
			c[0] = c[0].replace('undefined','');
			c.forEach(function(v) {
				var vv = v.split('|');
				if (vv[0] != '<EOF>' ) {
					d.push( {
						id: vv[0],
						channelId: vv[1],
						startTime: vv[2],
						endTime: vv[3],
						state: vv[4],
						name: vv[5],
						6: vv[6],
						info: vv[7],
						8: vv[8],
						9: vv[9],
						recordMarginStart: vv[11],
						epgID: vv[10],
						recordMarginEnd: vv[12],
						genre: vv[13],
						subgenre: vv[14],
						episodeId: vv[15],
						16: vv[16],
						17: vv[17],
						18: vv[18],
						runType: vv[19],
						anyChannel: vv[20],
						anyTime: vv[21],
						daysOfWeek: vv[22],
						parentSeriesID: vv[23],
						lifetime: vv[24],
						maximumRecordings: vv[25],
						priority: vv[26],
						keyword: vv[27],
						fulltext: vv[28],
					} );
				}
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
			
			var c = channels.split('<EOL>');
			var d = {};
			c[0] = c[0].replace('undefined','');
			c.forEach(function(v) {
				var vv = v.split('|');
				if (vv[0] != '<EOF>' ) {
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
				}
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
			
			var c = entries.split('<EOL>');
			var d = {};
			c[0] = c[0].replace('undefined','');
			c.forEach(function(v) {
				var vv = v.split('|');
				if (vv[0] != '<EOF>' ) {
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
				}
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
					promises.push( new Promise( ( resolve, reject ) => {
						resolve( {
							channelName: ep.channelName,
							idEpg: ep.idEpg,
							idBroadcast: ep.idBroadcast,
							broadcastUid: ep.iBroadcastUid,
							title: ep.sTitle,
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
							notify: ep.bNotify,
							seriesId: ep.iSeriesId,
							episodeId:  ep.iEpisodeId,
							episodePart: ep.iEpisodePart,
							episodeName: ep.sEpisodeName,
							flags: ep.iFlags
						});
				}));
			});
			debug('run promises for getGuideData');
			return Promise.all(promises).then( r => {
				debug('promises done');
				var groups = {};
				var map = [];
				r.forEach( function ( v, k ) {
					if ( !groups[v.channelName] ) groups[v.channelName] = [];
					if ( v.channelName ) {
						groups[v.channelName].push(v);
						map.push( {
							title: v.title,
							channelName: v.channelName,
							key: groups[v.channelName].length -1,
						});
					}
				});
				return { groups: groups, map: map };
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
							idEpg: ep.idEpg,
							channelName: ep.sChannelName,
							channel: c.pop(),
							name: c[0],
							isRadio: ep.bIsRadio,
							isHidden: ep.bIsHidden,
							isUserSetIcon: ep.bIsUserSetIcon,
							isUserSetName: ep.bIsUserSetName,
							isLocked: ep.bIsLocked,
							iconPath: replaceSMB(ep.sIconPath),
							isVirtual: ep.bIsVirtual,
							EPGEnabled:  ep.bEPGEnabled,
							EPGScraper: ep.sEPGScraper,
							lastWatched: ep.iLastWatched,
							clientId: ep.iClientId
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
							idChannel: ep.idChannel,
							idGroup: ep.idGroup,
							idEpg: ep.idEpg,
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

	
