var	_ = require('lodash');
var	debug = require('debug')('snowstreams:lib:core:listeners');
var async = require("async");
var naturalSort = require('javascript-natural-sort');
var request = require('superagent');

module.exports = function(Broadcast) {
	
	
	return {	
		
		channels(data, callback) {
			
			debug('Send Channels');
			var send = [];
			_.each(Broadcast.channels, (chan, name) => {
				chan.sources = _.uniqBy(chan.sources, 'name');
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
					sources: chan.sources.map((ss, i) => {
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
				channels: send
			};
			
		}, // end start
		
		stop(data, callback) {
							
			debug('stop emitted');
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			
		}, // end stop
		
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
						var text = '<p><b><span style="">Channel ' + v.channel + '</b>';
						text += '<br /> ' + v.currentSource.name + '</span> ';
						text += '<br />state: ' + v.state.current + '</span><br />|| ';
						if(v.links) {
							_.each(v.links, (l,ii) => {
								if(ii == 'local' || ii == 'unicast') {
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
		
	}
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
