import Gab from '../common/gab';
import debugging from 'debug';
let	debug = debugging('woobi:app:lib:socketFunctions');

let randomNumber = Math.random;

function options() {
	 
	var exports = {};
	
	exports.trapResponse = function(socket, callback) {
		
		var unique = 'AB' + Math.round(randomNumber() * 10000) + '::' + (Date.now());
		
		socket.once(unique, callback);
		
		return unique;
	}
	exports.trap = exports.trapResponse;
	
	exports.grab = function(request, emitTo = 'json') {
		debug('get ' + request.action, request);
		var promise = new Promise((resolve, reject) => {
			
			this.io.emit(request.action, Object.assign({ 
				iden: this.trap(this.io, talk)
			}, request));
			
			function talk(data) {
				debug('GRAB route got a result', data);
				Gab.emit(emitTo, data);
				if(data.success) {
					resolve(data);
				} else {
					reject(data)
				}
			}
  
		});
		
		return promise;
		
	}
	
	exports.addEvent = function(event, emitTo) {
		debug('add Event', event);
		this.io.emit('add', Object.assign({ 
			list: 'Event',
			iden: this.trap(this.io, talk)
		}, event));
		function talk(data) {
			debug('addEvent got a result', data);
			Gab.emit(emitTo, data);
		}
	};
	
	return exports;
	
}

export default options;
