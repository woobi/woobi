/**
 * Creates a upd unicast from a multicast stream
 *
 * ####Example:
 *
 *     ss.stream.udpProxy('start', port, callback)
 *
 *     
 * @param {String} action
 * @param {Int} port
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('snowstreams:stream:udpProxy');
var _ = require('lodash');
var stream = require('stream');
var chunkingStreams = require('chunking-streams');
var SizeChunker = chunkingStreams.SizeChunker;


module.exports = function(Broadcast) {
	
	return function udpProxy(opts, callback) {
	
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
		
		var name = 'sourceProxy';
		var routes = function(app) {
			/* serves main page */
			app.get(["/:channel", '/channel/:channel'], function(req, res, next) {

				if(req.params.channel) {
					var channel = req.params.channel;
					if(_.isObject(Broadcast.channels[channel]) && isReadableStream(Broadcast.channels[channel].stream)) {
						
						var cl = Broadcast.proxies.push({ip: req.ip, source: channel});
						res.writeHead(206, { "Content-Type": 'video/mpegts' });
						Broadcast.channels[channel].stream.on('data', function(chunk) {
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
						next();
					}
				} else {
					next();
				}
			});
			
			// override the default catch-all
			app.use(function(req, res, next) {
				var list = [];
				list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Streams</b></div>');
				if(_.isArray(Broadcast.proxies))
					_.each(Broadcast.proxies, function(v) {
						list.push('<span style="word-spacing:-.7px;">proxy - ' + v.source + ' - ' + v.ip + '</span><br />');
					});
				list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Sources</b></div>');
				if(_.isObject(Broadcast.channels))
					_.each(Broadcast.channels, function(v) {
						var text = '<span style="word-spacing:-.7px;">Channel ' + v.channel;
						text += '<br /> Now Playing: ' + v.file.name + '</span><br />';
						list.push(text);
					});
					
				list.push('<div style="margin-top:10px;word-spacing:-.7px;"><b>Servers</b></div>');
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
