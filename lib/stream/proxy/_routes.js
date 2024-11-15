
var debug = require('debug')('woobi:stream:_proxyRoutes');
var _ = require('lodash');
var path = require('path');
var multer = require('multer');

module.exports = function _proxyRoutes(Broadcast) {
/**
 * proxy routes.  Called from Broadcast.Stream.proxy._routes(app)
 *
 * ####Example:
 *
 *     Broadcast.Stream.proxy._routes(app)
 *
 *  @module   
 * @param {Object} app
 * @api private
 */
	return function proxyRoutes(app, cb) {
		
		var Stream = Broadcast.Stream.proxy.channels._stream
		var Manage = Broadcast.Stream.proxy.channels._manage;	
		
		let root = Broadcast.proxyRoot;
		let wobble = '/' + Broadcast.wobble;
		
		debug('Run proxy _routes', root, wobble, path.join(wobble, ':wobble', ':type'));
		
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

		app.get('/docs' , function (req, res) {
			debug('docs');
			res.sendFile(path.join(Broadcast.get('module root'), 'docs', 'index.html'));
		});

		/**
		 * status for the server
		 * 
		 * /woobi/status
		 * 
		 */
		app.get(root + '/status', function(req, res, next) {
			status(req, res);
					
		});
		/**
		 * uploads
		 * 
		 * /woobi/api/upload
		 * 
		 */
		const videoStorage = multer.diskStorage({
			destination: '/home/snow/media/akita/tmp', // Destination to store video 
			filename: (req, file, cb) => {
				cb(null, file.originalname )
			}
	   	});
		const upload = multer({
			storage: videoStorage,
			limits: {
			fileSize: 10000000000 // 10000000 Bytes = 10 MB
			},
			fileFilter(req, file, cb) {
			  // upload only mp4 and mkv format
			  if (!file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)) { 
				 return cb(new Error('Please upload a video'))
			  }
			  cb(undefined, true)
		   }
	   	}).array('upload');

		app.post(root + '/upload',  function (req, res) {
			upload(req, res, function(err){
				if (err instanceof multer.MulterError) {
					debug('Error multer', err);
					res.sendStatus(501);
				} else if (err) {
					debug('Error', err)
					res.sendStatus(501);
				}
				debug('Added file ' + req.file);
				res.sendStatus(200);
			})
			
		})
		/**
		 * channels
		 * 
		 * /woobi/api/series
		 * 
		 */
		 app.get(root + '/channels', function(req, res, next) {
			data = Broadcast.socketListeners.channels();
			debug(data);
			res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, channels: data.channels});
					
		});
		/**
		 * movies
		 * 
		 * /woobi/api/movies
		 * 
		 */
		 app.get(root + '/movies', function(req, res, next) {
			series(req, res);
					
		});
		/**
		 * videos
		 * 
		 * /woobi/api/videos
		 * 
		 */
		 app.get(root + '/videos', function(req, res, next) {
			series(req, res);
					
		});
		/**
		 * tv series
		 * 
		 * /woobi/api/series
		 * 
		 */
		app.get(root + '/series', function(req, res, next) {
			series(req, res);
					
		});
		/**
		 * tv show
		 * 
		 * /woobi/show/:id
		 * 
		 */
		 app.get(root + '/show/:id', function(req, res, next) {
			show(req, res, req.params.id);
					
		});
		/**
		 * send channel details
		 */
		app.get([path.join(wobble, ':wobble', ':type'),path.join(wobble, ':wobble')], function (req, res) {
			req._params=[req.params.wobble, req.params.type];
			return Stream.status.call(this, req, res, false, Broadcast);
		});


		app.get(path.join(root, '/', Broadcast.get('media passthrough route'), '*').replace(/\\/g,'/'), function (req, res, next) {
			/**
			 *  this is a simple passthrough to local media
			 *  for a dedicated system I  just use the media folder to mount smb paths
			 *  Broadcast.set('media passthrough route', '/media')
			 *  since the api root is added this gives a path of /woobi/media
			 * */
			debug('media passthrough', path.join(root, '/', Broadcast.get('media passthrough route'), '*').replace(/\\/g,'/'))
			var file = decodeURI(req.originalUrl);
			file = file.replace(root + Broadcast.get('media passthrough route'), Broadcast.get('media passthrough path'));
			res.sendFile(file);
		});
		
		/* serves dvr seekable stream */
		app.get([ root + "/dvr/:channel", root + '/dvr/:channel/play.*'], function(req, res, next) {
			//debug('video passthough route');
			var file = decodeURI(req._parsedUrl.pathname);
			file = file.replace(Broadcast.get('proxy api') + Broadcast.get('video passthrough route'), Broadcast.get('video passthrough path'));
			serveFile( file, req, res, Broadcast );
		})
		// serve video file direct
		app.get(path.join(root, '/', Broadcast.get('video passthrough route'), '*').replace(/\\/g,'/'), function (req, res, next) {	
			return Stream.rootDirect.call(this, req, res, false, Broadcast);
		});

		// serve on demand the current file of a channel
		app.get(root + "/ondemand/:channel", function (req, res, next) {				
			req._params=[req.params.channel];
			if(req.params.channel) {
				var channel = req.params.channel;
				var Channel = Broadcast.channels[channel];
				return Stream.ondemand.call(this, req, res, Channel, Broadcast);
			} else {
				lost();
			}
		});
		
		// serve a non mp4 as an mp4
		app.get(root + '/stream/*', function (req, res) {
			return Stream.stream.call(this, req, res, false, Broadcast);
		});
		
		// serve a hls stream file
		app.get(root + '/play/hls/:channel/:file', function (req, res, next) {
			req._params = [req.params.channel, 'hls', req.params.file];
			let channel = Broadcast.channels[req.params.channel];
			return Stream.hls.call(this, req, res, channel, Broadcast);
		});
		
		// send all channel hls playlist
		app.get(['/playlist', '/m3u', root + '/hls/' + Broadcast.wobbles + '.m3u', root + '/hlstest/:test', root + '/hls/list'], function (req, res, next) {
			return Stream.m3u.call(this, req, res, false, Broadcast);
		});

		// send epg for channels
		app.get(['/epg', '/epg/:days', root + '/epg', root + '/epg/:days', root + '/guide/:days'], function (req, res, next) {
			req._params=[req.params.days];
			return Stream.epg.call(this, req, res, false, Broadcast);
		});

		// create new channel
		app.post( [root + '/create/' +  Broadcast.wobble], function (req, res) {
			return Manage.create.call(this, req, res, false, Broadcast);
		});

		// delete Saved Config
		app.get( [root + '/deleteSavedConfig/' +  Broadcast.wobble + '/:channel'], function (req, res) {
			req._params=[req.params.id];
			return Manage.deleteSavedConfig.call(this, req, res, false, Broadcast);
		});

		// load channel from config
		app.get( [root + '/load/' +  Broadcast.wobble  + '/:channel' ], function (req, res) {
			req._params=[req.params.id];
			return Manage.load.call(this, req, res, false, Broadcast);
		});
		
		// delete a saved channel
		app.get( [root + '/remove/' + Broadcast.wobble + '/:id'], function (req, res) {
			req._params=[req.params.id];
			return Manage.remove.call(this, req, res, false, Broadcast);
		});
		
		// update a saved channel
		app.get( [root + '/update/' + Broadcast.wobble + '/:id'], function (req, res) {
			req._params=[req.params.id];
			return Manage.update.call(this, req, res, false, Broadcast);
		});
		
		// start channel
		app.get( [root + '/start/' + Broadcast.wobble + '/:name'], function (req, res) {
			req._params=[req.params.name];
			return Manage.start.call(this, req, res, false, Broadcast);
		});
		
		// stop channel
		app.get( [root + '/stop/' + Broadcast.wobble + '/:name'], function (req, res) {
			req._params=[req.params.name];
			return Manage.kill.call(this, req, res, false, Broadcast);
		});

		// kill channel
		app.get( [root + '/kill/' + Broadcast.wobble + '/:name'], function (req, res) {
			req._params=[req.params.name];
			return Manage.kill.call(this, req, res, false, Broadcast);
		});
		
		// restart channel
		app.get( [root + '/restart/' + Broadcast.wobble + '/:channel'], function (req, res) {
			req._params=[req.params.channel];
			return Manage.restart.call(this, req, res, false, Broadcast);
		});
		
		// goto source
		app.get( [root + '/jump/:channel/:to'], function (req, res) {
			req._params=[req.params.channel, req.params.to];
			return Manage.jumpTo.call(this, req, res, false, Broadcast);
		});
		
		// play next source
		app.get( [root + '/shift/:channel'], function (req, res) {
			req._params=[req.params.channel];
			return Manage.next.call(this, req, res, false, Broadcast);
		});
		
		// force source & prev
		app.get( [root + '/unshift/:channel/:type/:source'], function (req, res) {
			req._params=[req.params.channel, req.params.type, req.params.source];
			return Manage.prev.call(this, req, res, false, Broadcast);
		});
		
		// run program
		app.get( [root + '/program/:name/:cmd', root + '/program/:name/:cmd/:cmd2'], function (req, res) {
			req._params=[req.params.name, req.params.cmd, req.params.cmd2];
			return Manage.program.call(this, req, res, false, Broadcast);
		});	
		
		/* serves unicast stream */
		app.get([ root + "/unicast/:channel", root + '/unicast/:channel/play.*'], function(req, res, next) {
			if(req.params.channel) {
				var channel = req.params.channel;  
				if(_.isObject(Broadcast.channels[channel]) && Broadcast.isReadableStream(Broadcast.channels[channel].stream)) {
					return Stream.unicast.call(this, req, res, Broadcast.channels[channel], Broadcast);
				}
			}
			lost(req, res)	
		});	
		
		/**
		 * Catchall route
		 * 
		 * loop through the channels and serve some content or the status page
		 * 
		 * checks for a command from manage or stream and runs it
		 */
		app.use(function (req, res, next) {
			//debug('Catch All', req.originalUrl );
			//debug('baseUrl', req.baseUrl) 
			//debug('path', req.path) 
			//debug('query', req.query) 

			req._params = req.path.split('/').filter((i) => i != '')
			let lookFor = req._params[0];
			//debug('Channel?',lookFor);
			let channel = Broadcast.channels[lookFor];
			let _com = req._params[1] || '';
			let command = Stream[_com] || Manage[_com];
			if (channel) {
				//we have a channel
				if(_.isFunction(command)) {
					// run the command
					return command(req, res, channel, Broadcast);	
				} else {
					debug('no command found', _com)
					return Stream.status(req, res, channel, Broadcast);
				}
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.json({ success: false, error: 'nothing found'});
				//return status(req, res);
			}

		});

		function lost(req, res) {
			res.status(404).send(Broadcast.wrapHTML("Status","<span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>You did someting not right.<br /></div>"));
		}


		if( cb ) cb(null, app);
		return app
		
		function show(req, res, id) {
			debug('ERR getting episode files')
				return res.status(502).send(Broadcast.simplePage("<div style='padding:20px'><h1>Whoops.  something is bad.  Show page</h1>" + id + " </div>"));
		}

		function series(req, res) {
			Broadcast.libs.sonarr.tvShows()
			.then(files => {
				var list = [];
				_.each(files, function(v) {
					//debug('sonarr show', v)
					var link = 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/',root, 'show');
					list.push('<span style="word-spacing:-.7px;"><a href="' + link + '/' + v.id + '">' + v.title + ' (' + v.year + ')</a></span><br />');
				});
				var ll = '';
				_.each(list, function(l) {
					ll += l
				});	
				return res.status(200).send(Broadcast.simplePage("<div style='padding:20px'><h1>Series</h1><span  style='border-bottom:1px solid #aaa;'><div  style='padding:6px;background-color:#fff;line-height:1.6'>" + ll + '<br /></div></div>'));
			
			})
			.catch(e => {
				debug('ERR getting episode files')
				return res.status(502).send(Broadcast.simplePage("<div style='padding:20px'><h1>Whoops.  something is bad</h1></div>"));
			
			});
		}

		function status(req, res) {
			debug('status route');
			debug('Channels Information');
			var list = [];
			var docs = 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', 'docs');
			var ser = 'http://' + Broadcast.host + ':' + Broadcast.port + path.join('/', root, 'series');
			list.push('<div style="margin-top:20px;word-spacing:-.7px;border-bottom: 1px solid #aaa"><b>'+Broadcast.wobbles+'</b></div><a href="' + docs + '" style="color:#fff">Documents</a><p><a href="' + ser + '" style="color:#fff">Series</a></p>');
			if(_.isObject(Broadcast.channels)) {
				_.each(Broadcast.channels, function(v) {
					var text = '<p><span style="word-spacing:-.7px;"><a  style="color:#fff" href="/'+v.channel+'"> ' + v.channel + '</a>';
					text += ' &nbsp; | &nbsp; <span style="word-spacing:-.7px;"><a  style="color:#fff" href="/'+v.channel+'/playlist/html"> Playlist</a>';
					text += '<br /> Current Source: <a href="/'+v.channel+'/play" style="color:#fff">' + v.currentSource.name + '</a>';
					text += '<br /> Current State: ' + v.state.current + '</span></p>';
					list.push(text);
				});
			}	
			list.push('<div style="margin-top:20px;word-spacing:-.7px;border-bottom: 1px solid #aaa;"><b>Servers</b></div>');
			if(_.isObject(Broadcast.servers)) {
				_.each(Broadcast.servers, function(v) {
					list.push('<span style="word-spacing:-.7px;">' + v.name + ' - ' + v.host  + ':' + v.port + '</span><br />');
				});
			}
			list.push('<div style="margin-top:0px;word-spacing:-.7px;border-bottom: 1px solid #aaa"><b>Streams</b></div>');
			if(_.isArray(Broadcast.proxies)) {
				_.each(Broadcast.proxies, function(v) {
					list.push('<span style="word-spacing:-.7px;">proxy - ' + v.source + ' - ' + v.ip + '</span><br />');
				});
			}
			var ll = '';
			_.each(list, function(l) {
				ll += l
			});	
			return res.status(200).send(Broadcast.simplePage("<div style='padding:20px'><h1>Status</h1><span  style='border-bottom:1px solid #aaa;'><div  style='padding-top:6px;'>" + ll + '<br /></div></div>'));
		}
	}
}
