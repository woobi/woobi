var	_ = require('lodash');
var	debug = require('debug')('snowstreams:lib:core:listeners');
var async = require("async");
var naturalSort = require('javascript-natural-sort');
var request = require('superagent');

module.exports = function() {
	var ss = this;
	
	return {	
		
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
				.post('http://snowwhite:' + keystone.get('port') + '/keystone/api/session/signin')
				.send({ email: data.user, password: data.pass })
				.set('Accept', 'application/json')
				.end((err, res) => {
					// Calling the end function will send the request
					if(err || res.body.error) {
						return onFail(err || res.body.error);
					}
					onSuccess(res.body);
				});

		},
		
		start(data, callback) {
			
			debug('start listener');
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			if(!data.slug) {
				callback('slug required');
				ss.authSocket.emit(data.iden, { received: data , error: 'slug required' });
				return;
			}
			if(!keystone.lists[data.asset]) {
				callback('Asset type required');
				ss.authSocket.emit(data.iden, { received: data , error: 'Asset type required' });
				return;
			}
			
			var item = {};
			keystone.lists[data.asset]
				.model.findOne()
				.where('slug', data.slug)
				.populate('programs')
				.populate({
					path: 'stream',
					populate: { path: 'argument program' }
				})
				.populate({
					path: 'source',
					populate: { path: 'argument program source' }
				})
				.exec()
				.then(function(doc) {
					
					if(!_.isObject(doc.source[0])) {
						callback('Error playing asset - no source found to start');
						ss.authSocket.emit(data.iden, {  error: 'no source found to start' , received: data , message: 'no source found to start' });
						return false;
					}
					
					var Channel = new ss.Channel(doc.name, { doc });
					
					/**
					 *  we need to figure out what type of structure this is
					 * we may have a program to run  or files that broadcast will handle
					 * the program could be from the input(source) or the output(stream)
					 * we need a stream to accept the video pipe
					 * 
					 * */
					 
					// set the initial assets
					// we only get one stream
					var stream = doc.stream;
					// we can have multiple sources
					var source = doc.source[0];
					
					var sendSource = [];
					
					if(source.type === 'program') {
						// run the source program
						sendSource = [ doc.source[0].slug ];
						debug('start program', doc.source[0].slug);
						ss.source.program({
							Channel,
							doc: doc.source[0],
							killChannel: true
						}, function(err, program) {
							if(err) {
								debug(err)
							}							
							debug('got program');
							
							startBroadcast()
							
						});
					} else if(source.type === 'file') {
						var sources = []
						async.each(doc.source, function(source, next) {
							source.populate('files', function(err, doc) {
								// debug(source.files, files)
								var files = doc.files.map(function(file) {
									return file.file;
								});
								files.sort(naturalSort);
								sources.push(files);
								next();
							});
						}, function() {
							// flatten an array of arrays
							sendSource = sources.reduce(function(a, b) {
								return a.concat(b);
							}, []);
							startBroadcast();
						});
					} else {
						callback('Error playing asset');
						ss.authSocket.emit(data.iden, {  error: err , received: data , message: 'error playing asset' });
					}
					
					function startBroadcast() {
						// create a broadcast passthru stream
						ss.source.broadcast({
							name: doc.slug + '_' + doc._id,
							broadcast: true,
							source: sendSource,
							loop: doc.loop,
							Channel: Channel,
							doc,
							killChannel: true
						}, function(err, source) {
							debug('got broadcast');
							if(!err) {
								debug('send '+doc.source[0].slug+' over '+doc.stream.type+'://'+ doc.stream.host+':'+doc.stream.port);
								// create the udp stream from broadcast
								ss.stream.udp({
									Channel,
									name: doc.stream.slug + '-' + doc.stream._id,
									source: doc.slug,
									host: doc.stream.host,
									port: doc.stream.port,
									doc: doc.stream,
									killChannel: true
								}, function(err, Asset) {
									if(err) {
										debug(err)
									}
									
									// play the Channel
									debug('play Channel');
									Channel.play();
									
									callback(null, {  data: doc , message: 'Started ' + Channel.name});
									ss.openSocket.emit('status', ss.Listen.status());
									ss.authSocket.emit(data.iden, {  data: doc , message:  'Started ' + Channel.name});
								});
							} else {
								debug('ERROR broadcasting', err, doc);
							}
						});
					}

				}, function (err) { //first promise rejected
					callback(err);
					ss.authSocket.emit(data.iden, {  error: err , received: data , message: 'doc not found' });
				});
		}, // end start
		
		stop(data, callback) {
							
			debug('stop emitted');
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			if(!data.slug) {
				callback('slug required');
				ss.authSocket.emit(data.iden, { received: data , error: 'slug required' });
				return;
			}
			if(!keystone.lists[data.asset]) {
				callback('Asset type required');
				ss.authSocket.emit(data.iden, { received: data , error: 'Asset type required' });
				return;
			}
			
			debug('get list item', data.slug, data.asset);
			
			var item = {};
			
			keystone.lists[data.asset]
				.model.findOne()
				.where('slug', data.slug)
				
				.populate('programs')
				.populate({
					path: 'stream',
					populate: { path: 'argument program' }
				})
				.populate({
					path: 'source',
					populate: { path: 'argument program' }
				})
				
				.exec()
				.then(function(doc) {
					
					doc.streaming = false;
					doc.save();
					
					// run stop
					debug('g0t list item');
					
					var type= 'Channel ';
					debug('check channel');
					var Channel = ss.channel(doc._id);
					debug('is channel', Channel);
					if(!Channel) {
						var Asset = ss.asset(doc._id);
						type = 'Asset ';
					}
					if(Channel) {
						
						debug('stop ' + type, Channel.name);
						ss.removeChannel(Channel);
						
					} else if(Asset) {
						
						debug('stop ' + type, Asset.name);
						ss.removeAsset(Asset);
						
					} else { 
						debug(type + ' not found');
						
					}
					
					
					callback(null, {  data: doc , message: 'Stopped ' + doc.name });
					ss.notify('status', ss.Listen.status());
					ss.talk(data.iden, {  data: doc , message: 'Stopped ' + doc.name });
					
					
				}, function (err) { 
					callback(err);
					ss.talk(data.iden, {  error: err , received: data , message: 'doc not found' });
				});
		}, // end stop
		
		runProgram(data, callback) {
			
			debug('runProgram listener', data);
			
			if(!_.isFunction(callback)) {
				callback = function() {};
			}
			
			if(!data.program) {
				callback('Program slug required');
				ss.authSocket.emit(data.iden, { received: data , error: 'program slug required' });
				return;
			}
			
			if(!_.isObject(data.query) || !data.query.argument) {
				callback('Query required');
				ss.authSocket.emit(data.iden, { received: data , error: 'program slug and argument required' });
				return;
			}
			
			keystone.lists['Program'].model
				.findOne()
				.where('slug', data.program)
				.populate({
					path: 'arguments',
					match: { anchor: data.query.argument},
				})
				.exec(function(err, doc) {
					if(err) {
						return res.apiError({err:err});
					}
					
					var replacedArgs = createArgs(doc.arguments[0].argument, data.query)
					var runMe = doc.program + ' ' + replacedArgs.join(' ');
					
					ss.source.program(
						{
							doc: doc, 
							program: doc.program, 
							argument: replacedArgs,
						},
						function(err, program) {
							if(err) {
								debug('program error', err);
								callback('Program ' + doc.name + ' had a problem running:  ' + runMe);
								ss.authSocket.emit(data.iden, {  error: err , received: data , message:  'Program ' + doc.name + ' had a problem running:  ' + runMe });
							} else {
								debug("added program " + program.name );
								if(!doc.respawn) {
									var tFn = (command) => {
										debug('got emit for ' + program.name, command);
										if(!_.isObject(command)) {
											command = {
												action: command
											}
										}
										if(command.action === 'stop') {
											debug('remove single run program Asset');
											ss.removeAsset(program);
											ss.removeListener('source.' + program.id, tFn)
										}
									}
									ss.on('source.' + program.id, tFn);
								}
								program.play();
								callback(null, {  data: doc , message: 'Program ' + doc.name + ' ran:  ' + runMe });
								ss.openSocket.emit('status', ss.Listen.status());
								ss.authSocket.emit(data.iden, {  data: doc , message: 'Program ' + doc.name + ' ran: ' + runMe});
							}
						}
					);

				});
		},
		
		manager(data) {
							
			debug('manager emitted',  data);
			
			if(!data.find) {
				ss.authSocket.emit(data.iden, { received: data , error: 'find required' });
				return;
			}
			if(!keystone.lists[data.manage]) {
				ss.authSocket.emit(data.iden, { received: data , error: 'list required' });
				return;
			}
			
			var item = {};
			
			keystone.lists[data.manage].model.findOne(data.find).
				exec().
				then(function (doc) { //first promise fulfilled
					item.doc = doc;
					return doc;
				}, function (err) { //first promise rejected
					throw err;
				}).
				then(function (doc) { //second promise fulfilled
					data.results = doc.length;
					if(data.iden) ss.authSocket.emit(data.iden, { received: data, data: { received: data, data: doc} });
					debug(doc);
					if(doc.type === 'program') {
						debug('run program');
						ss.Listen.play(data);	
					}
				
				}, function (err) { //something happened
					//catch the error, it can be thrown by any promise in the chain
					ss.authSocket.emit(data.iden, {  received: data , error: err });
				});
			
		}, // end manager
		
		channelStatus(name) {
			
			var src = ss.sources[name];
			
			var list = [];
			list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Status of ' + name + '</b></div>');				
			
		},
		
		status() {

			var list = [];
			list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Streams</b></div>');
			if(_.isObject(ss.streams))
				_.each(ss.streams, function(v) {
					list.push('<span style="word-spacing:-.7px;">' + v.type +  ' - ' + v.name +  ' - ' + v.host + ':' + v.port + '</span><br />');
				});
			if(_.isObject(ss.servers.keystone.proxies))
				_.each(ss.servers.keystone.proxies, function(v) {
					list.push('<span style="word-spacing:-.7px;">proxy - ' + v.source + ' - ' + v.ip + '</span><br />');
				});
			list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Sources</b></div>');
			if(_.isObject(ss.sources))
				_.each(ss.sources, function(v) {
					var text = '<span style="word-spacing:-.7px;">' + v.type + ' - ' + v.name;
					if(v.pid) text += ' - PID: ' + v.pid  + '</span>';
					text+='<br />';
					list.push(text);
				});
				
			list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Servers</b></div>');
			if(_.isObject(ss.servers))
				_.each(ss.servers, function(v) {
					list.push('<span style="word-spacing:-.7px;">' + v.name + ' - ' + v.host  + ':' + v.port + '</span><br />');
				});
			var list2 = Object.keys(ss.servers.keystone.proxies).length + ' proxy connections.';	
			var ll = '';
			_.each(list, function(l) {
				ll += l
			});	
			return {
				proxy: ss.get('proxy'),
				status: "<p>"+list2+"</p><span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>" + ll + '<br /></div>'
			}	
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
			
