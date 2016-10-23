import { EventEmitter } from 'events';
import { isFunction, forEach } from 'lodash';
import Debug from 'debug';
import fetchPolyfill from 'fetch'

let debug = Debug('lodge:app:common:gab');

class Gab extends EventEmitter {
	constructor(props) {
		super(props)
	}
	
	componentDidMount() {
		if(window && typeof window.fetch == 'undefined' ) {
			// polyfill fetch
			window.fetch = fetchPolyfill
		}
	}
	
	request(route, moon, callback) {
		var _this = this;
		if(!isFunction(callback)) {
			callback = function(){};
		}
		if(!route) {
			var res = {
				success: false,
				message: 'No route defined.',
			}
			this.emit('request', res);
			return callback(res);
		}
		var	url = '/json/' + route;
		
		debug('request', url);
		
		var result = {
			success: false,
			slug: route
		}
		
		return fetch(url, { mode: 'cors' })
			.then(r => {
				return r.json();
			})
			.then(data => {
				debug('request result', data);
				result.success = true;
				result.json = data.results;
				_this.emit('request', result);
				callback(null, result);
				return result;
			})
		.catch(e => {
			console.error('error fetching', e)
			debug('request error', e, res);
			result.message = e.message;
			_this.emit('request', result);
			callback(result);			
		})
		
	}
	
	rawRequest(url, emit = 'request', sendback = {}, callback) {
		var _this = this;
		if(!isFunction(callback)) {
			callback = function(){};
		}
		
		debug('raw request', url);
		
		var result = {
			success: false,
			url,
			sendback
		};
		
		return fetch(url, { mode: 'cors' })
			.then(r => {
				return r.json();
			})
			.then(data => {
				debug('request result', data);
				result.success = true;
				Object.assign(result, data);
				if(emit) {
					_this.emit(emit, result);
				}
				callback(null, result);
				return result;
			})
		.catch(e => {
			//console.error('error fetching', e)
			debug('request error', e);
			result.message = e.message;
			if(emit) {
				_this.emit(emit, result);
			}
			callback(result);
			return  result;			
		})
		// end request
	}
	
	page(opts) {
		let url = snowUI.api.uri + snowUI.api[opts.list] + '/' + opts.action;
		let newopts = { ...opts };
		delete newopts.path;
		delete newopts.page;
		url += toQuery(newopts);
		debug(opts.list + ' request', url);
		this.rawRequest(url);
	}
	
	grab(opts, emit, callback) {
		let url = snowUI.host + ':' + snowUI.port + snowUI.api.uri + snowUI.api[opts.list] + '/' + opts.action;
		let newopts = { ...opts };
		delete newopts.path;
		delete newopts.page;
		url += toQuery(newopts);
		console.log(opts.list, url);
		return this.rawRequest(url, emit, { ...opts }, callback);
	}
	
}

export default new Gab()

function toQuery(obj) {
	let ret = '?';
	forEach(obj, function(v, k) {
		ret += k + '=' + v + '&';
	});
	return ret;
}
