/**
 * Creates a upd unicast from a multicast stream
 *
 * ####Example:
 *
 *     Broadcast.Stream.sourceProxy('start', port, callback)
 *
 *     
 * @param {String} action
 * @param {Int} port
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('snowstreams:stream:sourceProxy');
var _ = require('lodash');
var stream = require('stream');
var Routes = require('../core/routes');
var cp = require("child_process");
var ffprobe = require('fluent-ffmpeg').ffprobe;
var Leaky = require('../node-streams/leaky');
var fs = require('fs'); 
var Throttle = require('throttle');

module.exports = function(Broadcast) {
	
	return function sourceProxy(opts, callback) {
	
		var _this = this;
		
		if(!_.isFunction(callback)) {
			var callback = function(){}
		}
		if(!_.isObject(opts)) {
			opts = {};
		}
		if(_.isNaN(parseFloat(opts.port))) {
			opts.port = 7001;
		} else {
			opts.port = parseFloat(opts.port);
		}
		
		var name = 'ChannelServer';
		
		var routes = function(app) {
			
			/**
			 * we dont care about cors for now
			 * */
			app.use(function(req, res, next) {
				res.header("Access-Control-Allow-Origin", "*");
				res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
				next();
			});
			
			app.get('/test', function (req, res, next) {
				//res.writeHead(200, { "content-type": 'video/mp4' });
				
			});
			
			// restart channel
			app.get( ['/alvin/restart/channel/:name'], function (req, res) {
				var pro = Broadcast.channels[req.params.name];
				if(pro) {
					var save = pro.RESTART();
					debug('channel config', save);
					if(_.isFunction(pro.KILL)) {
						pro.KILL(restart);
					} else {
						restart();
					}
					
					function restart() {
						Broadcast.programs[req.params.name] = Broadcast.addChannel(req.params.name, save, (err, program) => {
							res.setHeader('Content-Type', 'application/json');
							res.json({ success: true, name: program.channel, message: 'Channel restarted.' });
						});
					}
					
				} else {
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: false, error: 'Channel not found'});
				}
			});
			
			// run program
			app.get( ['/alvin/program/:name/:cmd', '/alvin/program/:name/:cmd/:cmd2'], function (req, res) {
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
			app.get( '/alvin/tv/:channel', function(req, res, next) {

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
			
			/* serves main page */
			app.get([ "/channel/:channel", '/alvin/channel/:channel',  '/alvin/channel/:channel/play.*'], function(req, res, next) {
				
				if(req.params.channel) {
					var channel = req.params.channel;
					if(_.isObject(Broadcast.channels[channel]) && isReadableStream(Broadcast.channels[channel].stream)) {
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
						header["Content-Range"] = "bytes " + CS.start + "-" + CS.end + "/" + CS.total;
						
						res.writeHead(200, header);
						
						var stream = Broadcast.channels[channel].stream; //.pipe(new Leaky());
						
						stream.pipe(res);
						/*
						Broadcast.channels[channel].stream.on('data', function(chunk) {
							res.write(chunk);
						});
						*/
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
			
			app.get('/alvin/status', function(req, res, next) {
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
			
			app.get('/alvin/play.mp4', function (req, res) {
				
				//var file = '/media/2TB/NCIS/Season\ 14/NCIS.14x5.Philly.mkv';
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
							
							var T = stats.format.bit_rate / 8;
							var TT = T + (T*.95);
							stream.pipe(new Throttle(TT)).pipe(res, { end: false });
							//stream.pipe(new Throttle(TT)).pipe(res, { end: false });
							//var send = new Broadcast.Stream.broadcast({ stream: stream, name: 'Test'}, stats.format.bit_rate / 8);
							//send.pipe(res);
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
			
			
			// add the server routes
			Routes(app, Broadcast);
			
			return app;
		}
		var options = {
			host: opts.host || false,
			port: opts.port || 10001,
			nodeadmin: opts.nodeadmin || false,
			routes: routes
		}
		
		debug('create server');
		
		Broadcast.createServer(name, options, callback);
		
		return this;
	}

	function isReadableStream(obj) {
		return obj instanceof stream.Stream &&
			typeof (obj._read === 'function') &&
			typeof (obj._readableState === 'object');
	}

}
