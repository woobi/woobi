import { extend, isFunction, isObject } from 'lodash';
import debugging from 'debug';
import SF from  './socketFunctions';
import io from 'socket.io-client';
import Gab from '../common/gab';

let	debug = debugging('lodge:app:lib:sockets');

let Sockets = function() {
	
	// connected
	this.connected = {
		io: false,
		open: false,
		firstRun: true,
	}
	this.proxy = 'proxy';
}


Sockets.prototype.connect = function(callback) {
	// connection
	debug('init io connect', '//' + this.host + ':' + this.port + snowUI.namespace);
	this.io = io(this.host + ':' + this.port + snowUI.namespace, { 'forceNew': true });
	
	this.io.on('connect',(data) => {
		debug('io connected', snowUI.namespace);
		this.connected.open = true;
		this.connected.firstRun = false;
		this.connected.io =  {
			get() {
				this.io.socket.connected;
			}
		}
		
		if(isFunction(callback)) {
			callback(null,true);
		}
	});
	this.io.on('connect-error',(err) => {
		debug('io connect-error',err);
		if(isFunction(callback)) {
			callback(err);
		}
	});	
	
}

Sockets.prototype.init = function(opts, callback) {
	let _opts = {
		host: snowUI.host || '//@',
		port: snowUI.port,
		namespace: snowUI.namespace
	};
	if(isFunction(opts)) {
		callback = opts;
		opts = _opts;
	}
	
	if(isObject(opts)) {
		opts = _opts;
	}
	
	this.port = opts.port;
	this.host = opts.host;
	
	let _this = this;
	
	this.connect();
	
}

extend(Sockets.prototype, SF());


export default new Sockets();
