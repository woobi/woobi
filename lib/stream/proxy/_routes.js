/**
 * proxy routes.  Called from Broadcast.Stream.proxy.routes(app)
 *
 * ####Example:
 *
 *     Broadcast.Stream.proxy._routes(app)
 *
 *     
 * @param {Object} app
 * @api private
 */
 
var debug = require('debug')('woobi:stream:_proxyRoutes');
var _ = require('lodash');
var stream = require('stream');
var cp = require("child_process");
var ffprobe = require('fluent-ffmpeg').ffprobe;
var Leaky = require('../../node-streams/leaky');
var fs = require('fs'); 
var Throttle = require('throttle');
var path = require('path');
var parse = require('json-safe-parse');
var moment = require('moment');


module.exports = function _proxyRoutes(Broadcast) {

	return function proxyRoutes(app, cb) {
			
		let root = Broadcast.get('proxy api');
		debug('Run proxy _routes', root);
		/**
		 * we dont care about cors for now
		 * */
		app.use(function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		});
		
		app.get(root , function (req, res) {
			debug('Root route');
			res.write('test');
			res.end()
		});
			
		// serve asset media
		debug('media passthrough', path.join(root, '/', Broadcast.get('media passthrough route'), '*').replace(/\\/g,'/'))
		
		app.get(path.join(root, '/', Broadcast.get('media passthrough route'), '*').replace(/\\/g,'/'), function (req, res, next) {
			/**
			 *  this is a simple passthrough to local media
			 *  for a dedicated system I  just use the media folder to mount smb paths
			 *  Broadcast.set('media passthrough route', '/media')
			 *  since the api root is added this gives a path of /woobi/media
			 * */
			//debug('Fix media url', req.originalUrl)
			var file = decodeURI(req.originalUrl);
			file = file.replace(root + Broadcast.get('media passthrough route'), Broadcast.get('media passthrough path'));
			//debug('Send media file', file)
			res.sendFile(file);
		});
		
		/* serves main seekable stream */
		app.get([ root + "/channel/:channel", root + '/channel/:channel/play.*'], function(req, res, next) {
			debug('/channel/:channel route');
			if(req.params.channel) {
				var channel = req.params.channel;
				var Channel = Broadcast.channels[channel];
				var file = Channel.links.dvrPath;
				var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
				serveFile( file, req, res );
			} else {
				return res.sendStatus(501);
			}
		})
		// serve video file direct
		app.get(path.join(root, '/', Broadcast.get('video passthrough route'), '*').replace(/\\/g,'/'), function (req, res, next) {				
			//debug('video passthough route');
			var file = decodeURI(req._parsedUrl.pathname);
			file = file.replace(root + Broadcast.get('video passthrough route'), Broadcast.get('video passthrough path'));
			serveFile( file, req, res );
		});

		// serve on demand the current file of a channel
		app.get(root + "/ondemand/:channel", function (req, res, next) {				
			//debug('serve ondemand content');
			if(req.params.channel) {
				var channel = req.params.channel;
				var Channel = Broadcast.channels[channel];
				var file = Channel.sources[0].file;
				var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
				debug(Channel.name, 'serve ondemand content', file);
				serveFile( file, req, res );
			} else {
				return res.sendStatus(501);
			}
			
		});

		function serveFile( file, req, res ) {
			fs.stat(file, function(err, stats) {
				if (err) {
					debug('404', file);
					if (err.code === 'ENOENT') {
						// 404 Error if file not found
						return res.sendStatus(404);
					}
					res.end(err);
				}
				
				debug('Trying to direct stream video file: ' + file, req.headers.range );
				var total = stats.size;
				if (!req.headers.range) {
					// 416 Wrong range
					//debug('no range');
					//return res.sendStatus(416);
					var start = 0;
					var end = total - 1;
				} else {
					var positions = req.headers.range.replace(/bytes=/, "").split("-");
					var start = parseInt(positions[0], 10);
					var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
				}
				var chunksize = (end - start) + 1;
				if(start > end) start = 0;
				
				if (req.query.audio === 'yes') {
					new Broadcast.Source.Fluent({
						name: Broadcast.randomName(),
						file,
						stream: false,
						onlyOptions: ['-codec:v','copy','-codec:a', 'aac', '-preset','fast'],
						format: 'mpegts',
						seekByBytes: start
					}, (err, fluent) => {
						if (err || !Broadcast.isReadableStream(fluent.stream)) {
							res.end(err);
						}					
						debug('Playing ' + fluent.name );		
							
							res.writeHead(206, {
								"Content-Range": "bytes " + start + "-" + end + "/" + total,
								"Accept-Ranges": "bytes",
								"Content-Length": chunksize,
								"Content-Type": "video/mp4"
							});	
							fluent.stream.pipe(new Leaky()).on('data', function(chunk) {
								res.write(chunk);
							});
							fluent.stream.on('end', function() {
								res.end();
							});	
							
						/*res.sendSeekable(fluent.stream, {
							  type: "video/mp4",
							  length: fluent.size
						});*/
						//fluent.stream.pipe(res);
					});
				} else {
					debug('create stream and write', start, end)
					var stream = fs.createReadStream(file, { start: start })
					.on("open", function() {
						res.writeHead(206, {
							"Content-Range": "bytes " + start + "-" + end + "/" + total,
							"Accept-Ranges": "bytes",
							//"Content-Length": chunksize,
							"Content-Type": "video/mp4"
						});
						stream.pipe(res);
					}).on("error", function(err) {
						res.end(err);
					});
				}
			
			});	
		};
		
		// serve a non mp4 as an mp4
		app.get(root + '/stream/*', function (req, res) {
			debug('/stream route');
			var a = req.url.split('/');	
			a.splice(0,3);		
			var file = decodeURI('/' + a.join('/'));
			debug( file )
			fs.stat(file, function(err, stats) {
				if (err) {
					if (err.code === 'ENOENT') {
						// 404 Error if file not found
						return res.sendStatus(404);
					}
					res.end(err);
				}
				
				var range = req.headers.range;
				if (!range) {
					// 416 Wrong range
					return res.sendStatus(416);
				}
				
				var positions = range.replace(/bytes=/, "").split("-");
				var start = parseInt(positions[0], 10);
				var total = stats.size;
				var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
				var chunksize = (end - start) + 1;
				
				debug('Trying to stream video file: ' + file );
			
				new Broadcast.Source.Fluent({
					name: Broadcast.randomName(),
					file,
					stream: false,
					streamable: false,
					encode: false,
					seekByBytes: start,
					onlyOptions: ['-b:a', '128k', '-acodec', 'aac', '-ar 44100', '-ac', '2', '-b:v', '1800k', '-vcodec', 'libx264', '-preset', 'fast', '-bsf:v', 'h264_mp4toannexb', '-tune', 'zerolatency', '-movflags', 'faststart', '-strict', 'experimental'],
					format: 'mpegts'
				}, (err, fluent) => {
					if (err || !Broadcast.isReadableStream(fluent.stream)) {
						res.end(err);
					}					
					debug('Playing ' + fluent.name );		
					res.contentType('mp4');	
					/*
					fluent.stream.pipe(new Leaky()).on('data', function(chunk) {
						res.write(chunk);
					});
					fluent.stream.on('end', function() {
						res.end();
					});
					*/
					// end the stream if the connection ends
					res.on( 'finish', () => {
						fluent.end();
						debug('end stream on stop');
					})
					.on( 'end', () => {
						fluent.end();
						debug('end stream on stop');
					})
					.on( 'error', () => {
						fluent.end();
						debug('end stream on error');
					});
					fluent.stream.pipe(res);
				});
					
			});
		});
		
		// serve a hls stream list file
		app.get(root + '/play/hls/:channel/:file', function (req, res, next) {
			//debug('hls play channel route', req.params);
			var cl = Broadcast.proxies.push({ip: req.ip, source: req.params.channel});
			var file = path.join(Broadcast.mediaPath, 'channels', req.params.channel, req.params.file);
			res.sendFile(file);
		});
		
		// send all channel hls playlist
		app.get([root + '/hls/channels.m3u', root + '/hlstest/:test', root + '/hls/list'], function (req, res, next) {
			//debug('hls channel playlist route');
			var list =['#EXTM3U', ''];
			
			_.each(Broadcast.channels, (c,k) => {
				list.push('#EXTINF:-1,' + c.channel);
				list.push(c.link);
				//if (c.links.local111) {
				list.push('#EXTINF:-1,' + c.channel + ' On Demand');
				list.push(c.links.ondemand);
				//}
			});
			
			if(!req.params.test) {
				res.writeHead(200, {'Content-Type': 'application/vnd.apple.mpegurl'});
			} else {
				res.writeHead(200);
			}
			res.write(list.join('\n'));
			res.end();
		});

		// send epg for channels
		app.get([root + '/epg', root + '/epg/:days', root + '/guide/:days'], function (req, res, next) {
			//debug('epg route', req.param.days);
			
			var list =['<?xml version="1.0" encoding="ISO-8859-1"?>', '<!DOCTYPE tv SYSTEM "xmltv.dtd">'];
			// service provider.... tv
			list.push('<tv source-info-url="http://localhost:8337/woobi/epg" source-info-name="Woobi2" generator-info-name="XMLTV/Woobi2" generator-info-url="http://www.xmltv.org/">');
			var chans = new Array();
			var programs = new Array();
			
			_.each(Broadcast.channels, (c,k) => {
				chans.push('<channel id="' + c.channel + '">');
				chans.push('<display-name>' + c.channel + '</display-name>');
				chans.push('</channel>');
				//if (c.links.unicast1) {
					chans.push('<channel id="' + c.channel + '-ondemand">');
					chans.push('<display-name>' + c.channel + ' On Demand</display-name>');
					chans.push('</channel>');
				//}

				// add the sources
				var len = req.params.days ? req.params.days : 7;
				var start = moment(c.currentSource.startTime);
				var end = moment(c.currentSource.startTime).add(len, 'days');
				//debug('channel started: ' + start)
				// repeat the channel lineup until we hit end
				do {
					addPgm(c, programs, start)
				} while (start.isBefore(end))				
			});

			// join the arrays
			list = list.concat(chans, programs);
			list.push('</tv>');
			
			res.writeHead(200, {'Content-Type': 'application/xml'});
			res.write(list.join('\n'));
			res.end();
		});
		
		// push the program
		function addPgm(c, programs, start) {
			_.each(c.sources, (s) => {
				var item = s.metadata;
				
				var a = c.epgTime(start);
				//debug('begin: ' + start.format(), a)
				if ( !item.totalTimeInSeconds ) {

				}
				start = start.add( item.totalTimeInSeconds, 'seconds');
				//debug('length: ' + item.totalTimeInSeconds);
				//debug('end: ' + start.format())
				var b = c.epgTime(start);
				
				printPgm('', programs, item, a , b, c, () => {
					printPgm('-ondemand', programs, item, a , b, c)
				});	
				
			});
			return programs;
		}
		function printPgm(who, programs, item, a , b, c, callback) {
			var sizes = {
				banner: ' width="758" height="160" ',
				poster: ' width="680" height="1000" ',
				fanart: ' width="1920" height="1080" ',
				thumb: ' width="640" height="360" ',
			}
			var sanitize = function HtmlEncode(mystring){
				//return mystring;
				if(!mystring) mystring = '';
				return mystring.replace(/&/g, "\&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/'/g, "&quot;");
			}
			var desc = (who == '') ? '' : 'ON DEMAND\r\n\r\nStart the current program over on demand.\r\n\r\n';
			
			programs.push('<programme start="' + a + '" stop="' + b + '" channel="' + c.channel + who + '">');
				programs.push('<title lang="en">' + (item.show || item.name) + '</title>');
				if(item.show) programs.push('<sub-title lang="en">' + item.title + '</sub-title>');
				if(item.rating) programs.push('<star-rating><value>' + item.rating + '</value></star-rating>');
				if(item.rating) programs.push('<rating><value>' + item.rating + '</value></rating>');
				if(item.premiered || item.airDate) programs.push('<date>' + (item.premiered || item.airDate) + '</date>');
				programs.push('<desc lang="en">' + desc + (sanitize(item.description) || item.name) + '</desc>');
				if(item.idMovie) {
					programs.push('<category lang="en">movie</category>');
				}
				var genre = (item.genre || '').split('/');
				_.each(genre, g => {
					if(g)programs.push('<category lang="en">' + (g) + '</category>');
				})
				if( item.art ) {
					_.each(item.art, art => {
						programs.push('<icon src="' + Broadcast._options.artStringReplace(art.url) + '" ' + sizes[art.type] + ' />');
					})
				}
				if(item.idShow)programs.push('<episode-num system="dd_progid">' + (item.episodeID || item.idMovie) + '</episode-num>');
				if(item.idShow)programs.push('<episode-num system="onscreen">s' + (item.season || '') + 'e' + (item.episode || '') + '</episode-num>');
			programs.push('</programme>');
			if(callback) callback();
		}

		// create new channel
		app.get( [root + '/new/channel'], function (req, res) {
			debug('new channel route');
			var pro = decodeURIComponent(req.query.config);
			debug('channel config', pro);
			pro = parse(pro);
			let link = false;
			if(pro) {
				if (req.query.start === 'yes') {
					// grab clone of original config
					debug('channel config', pro.name);
					Broadcast.addChannel(pro.name, pro)
					.then(program => {
						link = Broadcast.channels[pro.name] ? Broadcast.channels[pro.name].hls.link : false;
						keep(pro.name + ' Channel Started.');
						Broadcast.notify('channels', Broadcast.socketListeners.channels());
					})
					.catch(e => {
						debug('Error adding channel', e);
						fail(e);
					});
				} else {
					keep('');
				}
			} else {
				fail('Channel config required');
			}
			
			function keep(message= '') {
				if (req.query.keep === 'yes') {
					if(Broadcast.libs._mongo) {
						debug('Keeping Config... autostart?', req.query.autostart);
						var m = new Broadcast.libs._mongo.ChannelConfig.model({
							name: pro.name,
							config: req.query.config,
							autostart: req.query.autostart === 'yes' ? true : false
						});
						m.save(() => {
							debug('Config saved');
							success(message + ', Config saved');
						})
					}
				} else {
					success(message);
				}
			}
			
			function success(message = '') {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: true, message, link });
				Broadcast.socketListeners.presets((err, p) => {
					debug('emit preset');
					Broadcast.notify('presets', p);
				});
			}
			function fail(err) {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: err});
			}
		});
		
		// delete a saved channel
		app.get( [root + '/remove/channel/:id'], function (req, res) {
			debug('remove channel route');
			if(req.params.id) {
				// grab clone of original config
				debug('channel config removal', req.params.id);
				if(Broadcast.libs._mongo) {
					Broadcast.libs._mongo.ChannelConfig.model.find({ _id: req.params.id }).remove().exec((err) => {
						debug('Config removed', err);
						if (err) {
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: false, error: 'Channel config not removed'});
						} else {
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: true, message: ' Channel Removed.' });
							Broadcast.socketListeners.presets((err, p) => {
								debug('emit preset');
								Broadcast.notify('presets', p);
							});
						}
					})
				} else {
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: false, error: 'Missing mongo connection'});
				}
					
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel config required'});
			}
		});
		
		// update a saved channel
		app.get( [root + '/update/channel/:id'], function (req, res) {
			debug('update channel route');
			var pro = req.query.config;
			//debug('channel config', pro);
			try {
				pro = JSON.parse(pro);
			} catch(e) {
				debug(e);
				pro = false;
			}
			if(pro && req.params.id) {
				// grab clone of original config
				debug('channel config update', pro.name);
				if(Broadcast.libs._mongo) {
					debug('Updating Config... autostart?', req.query.autostart);
					Broadcast.libs._mongo.ChannelConfig.model.update({ _id: req.params.id },{
						name: pro.name,
						config: req.query.config,
						autostart: req.query.autostart === 'yes' ? true : false
					}).exec((err) => {
						debug('Config saved', err);
						if (err) {
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: false, error: 'Channel config not updated'});
						} else {
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: true, name: pro.name, message: pro.name + ' Channel Updated.' });
							Broadcast.socketListeners.presets((err, p) => {
								debug('emit preset');
								Broadcast.notify('presets', p);
							});
						}
					})
				} else {
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: false, error: 'Missing mongo connection'});
				}
					
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel config required'});
			}
		});
		
		// start channel
		app.get( [root + '/start/channel/:name'], function (req, res) {
			debug('start channel route');
			var pro = Broadcast.channels[req.params.name];
			if (pro) {
				// grab clone of original config
				start( pro.CONFIG() );
			} else if (req.query.config) {
				start( parse(req.query.config) );
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel not found'});
			}
			
			function start( config ) {
				debug('channel config', config.name,  config);
				Broadcast.addChannel(config.name, config)
				.then(program => {
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: true, name: program.channel, message: program.channel + ' Channel Started.' });
				})
				.catch(e => {
					debug('Error starting channel', e);
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: false, error: e});
				});
			}
			
		});
		
		// stop channel
		app.get( [root + '/kill/channel/:name'], function (req, res) {
			debug('kill channel route');
			var pro = Broadcast.channels[req.params.name];
			if (pro) {
				// grab clone of original config
				var save = pro.CONFIG();
				debug('channel config');
				if(_.isFunction(pro.KILL)) {
					pro.KILL(restart);
				} else {
					fail();
				}
			} else {
				fail();
			}
			function restart() {
				delete Broadcast.channels[this.channel];
				setTimeout(() => {
					Broadcast.notify('channels', Broadcast.socketListeners.channels());
				}, 250);
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: true, message: ' Channel removed.' });
			}
			function fail() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel not found or failed to stop.'});
			}
		});
		
		// restart channel
		app.get( [root + '/restart/channel/:channel'], function (req, res) {
			debug('restart channel route');
			var pro = Broadcast.channels[req.params.channel];
			if(pro) {
				debug('Try to restart channel ' + pro.channel);
				var save = pro.CONFIG();
				if(_.isFunction(pro.RESTART)) {
					let config = {}
					if(req.query.passthrough === 'yes') {
						config.hls = save.hls;
						config.hls.passthrough = true;
						debug('passthrough channel ' + pro.channel);
					}
					if(req.query.passthrough === 'no') {
						config.hls = save.hls;
						config.hls.passthrough = false;
						debug('transcode channel ' + pro.channel);
					}
					if(req.query.keepQueue === 'yes') {
						config.files = pro.sources;
						debug('keep sources channel ' + pro.channel);
					}
					pro.RESTART(config)
					.then(newChannel => {
						debug('Channel Rebooted', newChannel.channel);
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: true, channel: newChannel.channel,  message:  'Channel Rebooted.' });
					})
					.catch((err) => {
						debug(' err restarting channel', err);
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: false, error: err});
					});
						
				} else {
					restart();
				}
				
				function restart() {
					debug('channel config', save);
					debug('restart in .5 sec');
					Broadcast.addChannel(req.params.channel, save)
					.then(newChannel => {
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: true, name: newChannel.channel, message: newChannel.name + ' Channel Restarted.' });
					})
					.catch((err) => {
						debug(' err restarting channel', err);
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: false, error: 'Channel not found'});
					});
				}
				
			} else {
				debug(' err no channel', req.params.channel);
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel not found'});
			}
		});
		
		// goto source
		app.get( [root + '/jump/:channel/:to'], function (req, res) {
			debug('jumpto source channel route');
			var pro = Broadcast.channels[req.params.channel];
			var type = req.params.type;
			var source = req.params.source;
			var channel = req.params.channel;
			if(pro) {
				debug('jump to source ' + req.params.to);
				pro.jumpTo(Number(req.params.to));
				succeed();
			} else {
				fail();
			}
			function succeed() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: true, channel: channel, source: source, type: type, message: 'Selected source is now streaming.' });
			}
			function fail() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel not found'});
			}
		});
		
		// play next source
		app.get( [root + '/shift/:channel'], function (req, res) {
			debug('play next source route');
			var pro = Broadcast.channels[req.params.channel];
			var type = req.params.type;
			var source = req.params.source;
			var channel = req.params.channel;
			if(pro) {
				debug('channel play next');
				pro.nextSource();
				succeed();
			} else {
				fail();
			}
			function succeed() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: true, channel: channel, source: source, type: type, message: 'Next source is now streaming.' });
			}
			function fail() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel not found'});
			}
		});
		
		// force source & prev
		app.get( [root + '/unshift/:channel/:type/:source'], function (req, res) {
			debug('unshift route');
			var pro = Broadcast.channels[req.params.channel];
			var type = req.params.type;
			var source = req.params.source;
			var channel = req.params.channel;
			if(pro) {
				
				if (type === 'file') {
					debug('Force a new file to top of ' + pro.channel);
					if(_.isFunction(pro.force)) { 
						pro.force(parse(source), true);
						succeed();
					} else {
						fail();
					}
				} else if (type === 'index') {
					debug('Force a new source to top');
					if(_.isFunction(pro.force)) { 
						pro.force(pro.sources[source], true);
						succeed();
					} else {
						fail();
					}
				} else if (type === 'history') {
					debug('Play an item from history');
					if(_.isFunction(pro.force)) { 
						pro.force(pro.history[source], true);
						succeed();
					} else {
						fail();
					}
				} else if (type === 'prev') {
					debug('Start the prev episode');
					pro.prevSource();
					succeed();
				} else {
					fail();
				}
				
				
			} else {
				fail();
			}
			function succeed() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: true, channel: channel, source: source, type: type, message: 'Source is now streaming.' });
			}
			function fail() {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Channel not found'});
			}
		});
		
		// run program
		app.get( [root + '/program/:name/:cmd', root + '/program/:name/:cmd/:cmd2'], function (req, res) {
			debug('program channel route');
			var pro = Broadcast.programs[req.params.name];
			if(pro) {
				var save = pro.redo(req.params.cmd, req.params.cmd2);
				debug('save', save);
				if(!_.isFunction(pro.end)) {
					pro.end = (pass, cb) => {
						cb();
					};
				}
				pro.end(null, () => {
					setTimeout(() => {
						Broadcast.programs[req.params.name] = Broadcast.addProgram(req.params.name, save, (err, program) => {
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: true, options: program.options });
						});
					}, 1500);
				});
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'Program not found'});
			}
		});
		
		/* serves mpegts as mp4 */
		app.get( root + '/tv/:channel', function(req, res, next) {
			debug('serves mpegts as mp4 channel route');
			if(req.params.channel) {
				var channel = req.params.channel;
				if(_.isObject(Broadcast.channels[channel]) && isReadableStream(Broadcast.channels[channel].stream)) {
					
					next();

				} else {
					next();
				}
			} else {
				next();
			}
		});			
		
		/* serves unicast stream */
		app.get([ root + "/unicast/:channel", root + '/unicast/:channel/play.*'], function(req, res, next) {
			debug('serves unicast stream route');
			if(req.params.channel) {
				var channel = req.params.channel;
				if(_.isObject(Broadcast.channels[channel]) && Broadcast.isReadableStream(Broadcast.channels[channel].stream)) {
					debug('channel stream is good');
					var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
					
					var range =  req.headers.range || undefined;
					var CS = Broadcast.channels[channel].currentSource;
					if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
						// Check range contains numbers and they fit in the file.
						// Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
						CS.start = _.isNumber(range[1]) && range[1] >= 0 && range[1] < CS.end ? range[1] - 0 : CS.start;
						CS.end = _.isNumber(range[2]) && range[2] > CS.start && range[2] <= CS.end ? range[2] - 0 : CS.end;
						CS.rangeRequest = true;
					} 
					
					var header = {};
					header.Pragma = "public";
					//header["Last-Modified"] = CS.modified.toUTCString();
					header["Content-Transfer-Encoding"] = "binary";
					//header["Content-Length"] = CS.length;
					header["Content-Type"] = 'video/mp4';
					header["Accept-Ranges"] = "bytes";
					//header["Content-Range"] = "bytes " + CS.start + "-" + CS.end + "/" + CS.total;
					
					res.writeHead(206, header);
					
					var stream = Broadcast.channels[channel].stream; //.pipe(new Leaky());
					/*
					stream.pipe(res);
					*/
					Broadcast.channels[channel].stream.on('data', function(chunk) {
						//debug('send data');
						res.write(chunk);
					});
					
					Broadcast.channels[channel].stream.on('end', function() {
						res.end();
						Broadcast.proxies.splice(cl - 1, 1);
					});
					
					req.connection.addListener('close', function () {
						Broadcast.proxies.splice(cl - 1, 1);
					});

				} else {
					debug('channel err');
					next();
				}
			} else {
				debug('channel err');
				next();
			}
		});			
		
		app.get(root + '/status', function(req, res, next) {
			debug('status route');
			var list = [];
			list.push('<div style="margin-top:0px;word-spacing:-.7px;border-bottom: 1px solid #aaa"><b>Streams</b></div>');
			if(_.isArray(Broadcast.proxies))
				_.each(Broadcast.proxies, function(v) {
					list.push('<span style="word-spacing:-.7px;">proxy - ' + v.source + ' - ' + v.ip + '</span><br />');
				});
			list.push('<div style="margin-top:20px;word-spacing:-.7px;border-bottom: 1px solid #aaa"><b>Channels</b></div>');
			if(_.isObject(Broadcast.channels))
				_.each(Broadcast.channels, function(v) {
					var text = '<p><span style="word-spacing:-.7px;">Channel ' + v.channel;
					text += '<br /> Current Source: <a href="/channel/'+v.channel+'">' + v.currentSource.name + '</a>';
					text += '<br /> Current State: ' + v.state.current + '</span></p>';
					list.push(text);
				});
				
			list.push('<div style="margin-top:20px;word-spacing:-.7px;border-bottom: 1px solid #aaa;"><b>Servers</b></div>');
			if(_.isObject(Broadcast.servers))
				_.each(Broadcast.servers, function(v) {
					list.push('<span style="word-spacing:-.7px;">' + v.name + ' - ' + v.host  + ':' + v.port + '</span><br />');
				});
			var ll = '';
			_.each(list, function(l) {
				ll += l
			});	
			return res.status(200).send(Broadcast.wrapHTML("Status","<span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>" + ll + '<br /></div>'));
			
			
		});
		
		app.get(root + '/play.mp4', function (req, res) {
			debug('play.mp4 route');
			var file = '/home/snow/Videos/paris2.mp4';
			debug('play test');
			
			ffprobe(file, function(err, stats) {
				if (err) {
					  if (err.code === 'ENOENT') {
						  // 404 Error if file not found
						  //return res.sendStatus(404);
						  debug('File not found');
						  res.end(err); // I added this
					  }
					  res.end(err);
				}
				var stat = fs.statSync(file);
				var total = stat.size;
				 debug('metadata', stats, stat);
				
				var range = req.headers.range;
				
				debug('send pipe');
				
				if (!range) {
					// 416 Wrong range
					//return res.sendStatus(416);
					console.log('Err: It seems like someone tried to download the video.');
					res.end(err);
				}else{
					var positions   = range.replace(/bytes=/, "").split("-");
					debug(positions);
					var start       = parseInt(positions[0], 10);
					var end         = positions[1] ? parseInt(positions[1], 10) : total - 1;
					var chunksize   = (end - start) + 1;

					res.writeHead(200, {
						"Content-Range": "bytes " + start + "-" + end + "/" + total ,
						"Accept-Ranges": "bytes",
						"Content-Length": chunksize,
						"Content-Type": "video/mp4"
					});
					//Broadcast.channels['2'].stream.pipe(new Leaky()).pipe(res);
					//var stream2 = Broadcast.Stream.bridge() ;
					debug(start, end);
					var stream = fs.createReadStream(file, {
						start: start,
						end: end
					}).on("open", function() {
						debug('pipe');
						stream.pipe(res, { end: false })
					}).on("error", function(err) {
						debug('ERROR');
						//res.end(err);
					})
					//After the stream starts we can interject the broadcast
					.on('end',() => {
						debug('now pipe the broadcast');
					});		
					
				}
			});
		});
			
		if( cb ) cb(null, app);
		return app
	}
}
