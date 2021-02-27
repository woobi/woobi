var	express = require('express');
var	http = require('http');
var	https = require('https');
var	fs = require('fs');
var	_ = require('lodash');
var	dashes = '-----------------------------------';
var debug = require('debug')('woobi:core:createServer');
var Socket = require('./socket');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var compress = require('compression');
var async = require('async');


function serve() {

	var exports = {};
	
	var linkPrivateIps = [];
	var linkLocalIps = ['127.0.0.1/32'];
	
	exports.createServer = function(name, opts, callback) {
		
		var _this = this;
				
		var prepare = () => {			
			this.servers[name].Server.on('connection',  (socket) => {
				// Add a newly connected server
				var socketId = _this.nextSocketId++;
				this.servers[name].sockets[socketId] = socket
				//debug('socket', socketId, 'open');
				
				// Remove the socket when it closes
				socket.on('close',  () => {
					//debug('socket', socketId, 'closed');
					delete this.servers[name].sockets[socketId];
				});

			});
			
			this.io = require('socket.io')(this.servers[name].Server );
			Socket.socketRoutes.call(this);
			
			if(this.get('env') == 'development') {
				var Watcher = require('chokidar-socket-emitter')({ io: this.io });
			}
			
			callback(null, ' server started on port ' + link.port)	
			
		}
		if(!_.isFunction(callback)) {
			var callback = function(){}
		}
		if(!_.isString(name)) {
			callback('name must be a String');
			return this;
		}
		if(this.servers[name]) {
			callback('name in use');
			return this;
		}
		
		var linkApp = new express();
		
		if(typeof callback !== 'function')callback = function(){};
		
		var ipRange = _.union(linkPrivateIps,linkLocalIps,opts.ipRange);
		//debug(ipRange)
		var displayRange = _.union(linkLocalIps,opts.ipRange);
		
		var link = {
			host : opts.host || false,
			port : parseFloat(opts.port) || 2777,
			listen : opts.listen,
			ssl : opts.ssl,
			sslkey : opts.sslKey,
			sslcert : opts.sslCert
		}
		if(link.host === false) { 
			delete link.host;
		}
		// save the server
		this.servers[name] = {
			sockets: {},
			proxies: [],
			name: name,
			host: link.host || '@'
		}
		_.extend(this.servers[name], link);
		
		if(isNaN(link.port)) {
			link.port = 2777;
		}
		
		linkApp.enable('trust proxy');
		
		linkApp.use(compress());

		linkApp.use(logger('short'));
		
		linkApp.use(session({
			secret: this.get('session secret'),
		}))
		
		linkApp.use(methodOverride());
		linkApp.use(bodyParser.json());
		linkApp.use(bodyParser.urlencoded({ extended: true }));
		linkApp.use(multer({
			includeEmptyFields: true
		}).any());	
		
		/* restrict calls to ip range and localhost */
		var ipRangeMiddleware = require('./ipRangeRestrict')(
			ipRange,
			this.wrapHTMLError
		);
		//linkApp.use(ipRangeMiddleware);
				
		// add user routes
		let routes = Array.isArray(opts.routes) ? opts.routes : [opts.routes];
		
		_.each(routes, (route) => {
			debug( 'add route' );
			route(linkApp, opts);
		});
		
		finish.call(this);
		
		function finish() {
			
			
			if (opts.ssl) {
				
				var sslOpts = {};
				
				if (link.sslcert && fs.existsSync(link.sslcert)) {
					sslOpts.cert = fs.readFileSync(link.sslcert);
				}
				if (link.sslkey && fs.existsSync(link.sslkey)) {
					sslOpts.key = fs.readFileSync(link.sslkey);
				}
				
				if (!sslOpts.key || !sslOpts.cert) {
					
					console.log(' https server failed to start: invalid ssl configuration.  server is not listening.');
					
				} else {
					
					var httpsStarted = (msg) => {
						// use prepare to stop the server completely
						prepare();
						debug('https server started on port ' + link.port);
						
					};
					
					this.servers[name].Server = https.createServer(sslOpts, linkApp);
									
					var sslHost = link.host;
					var sslPort = link.port;
						
					
					if (sslHost) {
						this.servers[name].Server.listen(sslPort, sslHost, httpsStarted());
					} else {
						
						this.servers[name].Server.listen(sslPort, httpsStarted());
					}
					 
				}

			} else {
				
				this.servers[name].Server = http.createServer(linkApp);
				if (link.host) {
					this.servers[name].Server.listen(link.port, link.host, () => {
						prepare();
					});
				} else {
					this.servers[name].Server.listen(link.port, () => {
						prepare();
					});
				}
			
				debug('http server started on port ' + link.port);

			}
		} // end finish	
	}		
	return exports;	
}

module.exports = serve;
/**
 * 2015 snowkeeper
 * github.com/snowkeeper
 * npmjs.org/snowkeeper
 * 
 * Peace :0)
 * 
 * */
