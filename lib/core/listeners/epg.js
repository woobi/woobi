var	_ = require('lodash');
var	debug = require('debug')('woobi:lib:core:listeners:serverwmc');
var async = require("async");
var _ = require('lodash');

module.exports = function(Broadcast) {
	
	return {
		
		getTVChannels( callback ) {
							
			debug('getTVChannels');
						
			return Broadcast.libs.tv.getTVChannels()
			.then( ( tv ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function() {};
				}
				debug( 'got getTVChannels' );
				callback( null, tv );
				return {
					success: true,
					channels: tv,
				};
			});
			
		}, // end getChannels
		
		getChannelGroups( callback ) {
							
			debug('getChannelGroups');
						
			return Broadcast.libs.tv.getChannelGroups()
			.then( ( groups ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function() {};
				}
				debug('got getChannelGroups');
				callback(null, groups);
				return {
					success: true,
					groups: groups,
				};
			});
			
		}, // end getChannelGroups
		
		getGuideData( id, start, end, callback ) {
							
			debug('getGuideData');
				
			return Broadcast.libs.epg.getGuideData( id, start, end )
			.then( ( epg ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getGuideData' );
				callback( null, epg );
				return {
					success: true,
					entries: epg,
				};
			});
			
		}, // end getChannels
		
		getSeriesTimers: function ( callback ) {
			
			if ( !_.isFunction( callback ) ) {
					callback = function() {};
				}
			var send = 'GetSeriesTimers|False';
			debug( 'getSeriesTimers', send );	
			return Broadcast.libs.TCPSocket.socketConnect( send )
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
							channelID: vv[2],
							episodeID: vv[3],
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
							timerID: vv[21],
							keyword: vv[22],
							fullText: vv[23],
							lifetime: vv[24],
							maximumRecordings: vv[25],
							priority: vv[26],
						} );
					}
				});
				
				debug('got series');
				
				var res = {
					success: true,
					series: _.sortBy( d, ['show'] ),
				}
				callback(null, res);
				return res;
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
			
		},
		
		getTimers: function ( callback ) {
			
			if ( !_.isFunction( callback ) ) {
					callback = function() {};
				}
			var send = 'GetTimers';
			debug( 'GetTimers', send );	
			return Broadcast.libs.TCPSocket.socketConnect( send )
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
							channelID: vv[1],
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
							15: vv[15],
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
				
				var res = {
					success: true,
					timers: _.sortBy( d, ['startTime'] ),
				}
				callback(null, res);
				return res;
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
			
		},
		
		getChannelsSocket: function ( callback ) {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			var send = 'GetChannels|False';
			debug( 'Get Channels', send);	
			return Broadcast.libs.TCPSocket.socketConnect(send)
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
				
				var res = {
					success: true,
					channels: d,
				}
				callback(null, res);
				return res;
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
			
		},
		
		guideDataSocket: function ( id, start, end, callback ) {
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			var send = 'GetEntries|' + id + '|' + start + '|' + end;
			debug( 'GetEntries', send);	
			return Broadcast.libs.TCPSocket.socketConnect(send)
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
				
				var res = {
					success: true,
					entries: {}
				}
				res.entries[id] = d;
				
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
			
		},
	}
}
