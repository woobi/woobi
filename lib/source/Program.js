/**
 * Creates a stream from a program
 *
 * ####Example:
 *
 *     ss.source.program('tv1', 'dvgrab', ['-f', 'mpeg2', '-g', '0x94ccb9fffe5dc69a', '-' ], callback)
 *
 *     
 * @param {String} name
 * @param {String} program
 * @param {Array} args
 * @param {Function} callback
 * @api public
 */

var debug = require('debug')('snowstreams:source:program');
var _ = require('lodash');
var stream = require('stream');
var Pass = stream.PassThrough;
var spawn = require('child_process').spawn
var Respawn = require('respawn');

module.exports = function(Broadcast) {
	
	return function Program(options, callback) {
		
		if (!(this instanceof Program)) return new Program(options, callback);
		
		debug('program start');
		var _this = this;
		var ran = 0;
		var started = 0;
		
		var opts = options
		
		debug('program checks');
				
		if(!_.isFunction(callback)) {
			var callback = function(){}
		}
		if(!_.isString(opts.name)) {
			callback('name must be a String');
			return _this;
		}
		
		if(!_.isString(opts.program)) {
			callback('there must be a program ' + opts.program);
			return _this;
		}
		
		if(!_.isArray(opts.arg) && _.isObject(opts.arg)) {
			
			opts.arg = opts.arg.argument.split(' ').filter((v) => { return v !== '' });
		
		} else if (_.isString(opts.arg)) {
			
			opts.arg = opts.arg.split(' ').filter((v) => { return v !== '' });
		
		} 
		
		this.options = opts;
		
		// do we have a full program argument line
		debug('create program')
		// create Asset
		useSource.call(this, opts);


		function useSource(opts) {
			
			var Asset = this;
			Asset.pid = 0;
			Asset.spawn = false;
			Asset.stream = false;
			Asset.command = [opts.program].concat(opts.arg);
			Asset.respawn = opts.respawn;
			Asset.restart = opts.restart;
			
			debug('push stop to asset');
			// asset stop function
			var stopAsset = function(pass, cb) {
				
				debug('check for program stream');
				var Asset = this;
				
				if(_.isObject(Asset.monitor) && _.isFunction(Asset.monitor.stop)) {
					debug('stop program monitor');
					Asset.monitor.stop();
				}
				if(ss.isReadableStream(Asset.stream) && _.isFunction(Asset.stream.end)) {
					debug('stop program stream');
					Asset.stream.end();
				}	
				
				this.doc.streaming = false;
				this.doc.save();
				
				ss.notify('status', ss.Listen.status());
				
				debug('stop program done');
				
				if(_.isFunction(cb)) {
					cb(null, pass);
				}
				
			}.bind(Asset);
			
			debug('program passed tests... creating stream');
			var endStream;
			
			if(opts.respawn) {	
				
				debug('runAgainAgain');
				
				runAgainAgain(stream, this, cb);

				debug('run callback');
				
				callback(null, Asset);
			
			} else {
				
				debug('run once');
				
				runOnce(stream, this, cb);
				
				debug('run callback');
				
				callback(null, Asset);
			}
			
		}
		
		function runOnce(stream, Asset, cb) {
			
			var opts = Asset.options;
			debug(opts.program, opts.arg);
					
			var runProgram = Asset.spawn = spawn(opts.program, opts.arg);
			
			runProgram.stderr.on('data', function (data) {
				Asset.log = ('stderr: ' + data);
				if(opts.debug) debug('stderr: ' + data);
			});
			
			if(ss.isReadableStream(runProgram.stdout)) {
				
				debug(opts.program + ' produced a readable stream');
				
				//var limited = ratelimit(runProgram.stdout, 250 * 1024);
				Asset.log = (opts.program + ' produced a readable stream');
				Asset.stream = endStream = runProgram.stdout.pipe(new bufferStream({'highWaterMark':7, 'objectMode': true}));
				Asset.pid = runProgram.pid;
				
				// register the emitter
				ss.emitterReg('source.' + opts.id);
				
				debug('emit program action');
				ss.talk('source.' + opts.id, { action: 'start'});
				ss.notify('status', ss.Listen.status());
				
				runProgram.on('close', function (code) {
					debug('program quit ' + opts.program + ' ' + code);
					ss.talk('source.' + opts.id, { action: 'stop'});
				});
								
				cb(null, Asset.stream);
				return _this;
				
			} else {
				
				debug(opts.program + 'did not produce a readable stream');
				Asset.log = (opts.program + 'did not produce a readable stream');
				debug(runProgram);
				cb(opts.program + 'did not produce a readable stream', Asset);
				return _this;
				
			}
		}
		
		function runAgainAgain(stream, Asset, cb) {
			
			var opts = Asset.options;
			
			// generic passthrough stream to survive restart
			Asset.stream = new Pass();
			
			// respawn monitor
			debug('start monitor', Asset.command);
			var monitor = Asset.monitor = Respawn(Asset.command, {
				maxRestarts: opts.restarts || 10, // how many restarts are allowed within 60s or -1 for infinite restarts
				sleep: opts.sleep || 1000,  // time to sleep between restarts,
				kill: opts.kill || 30000, // wait 30s before force killing after stopping
			});
			monitor.start();
			monitor.on('stdout', function (data) {
				// spawn is not emitting so we hack the shit out of this
				if(ran === 0) {
					debug('spawned - in stdout')
					var spawned = monitor.child;
					spawned.stdout.pipe(new bufferStream({'highWaterMark':7, 'objectMode': true})).pipe(Asset.stream);
					Asset.pid = spawned.pid;
					Asset.spawn = spawned;
										
					// register the emitter
					ss.emitterReg('source.' + opts.id);
					ss.notify('status', ss.Listen.status());
					ran = 1;
					if(started === 1) ss.talk('source.' + opts.id, { action: 'restart'});
				}
				if(started === 0) {
					debug('return')
					cb(null, Asset.stream);
					started = 1;
					ss.talk('source.' + opts.id, { action: 'start'});
					return _this;
				}
			});
			monitor.on('spawn', function (process) {
				// this emits on a respawn
				debug('respawn from spawn event', ss.isReadableStream(process.stdout), ss.isReadableStream(Asset.stream));
				
				if(!ss.isReadableStream(process.stdout) || !ss.isReadableStream(Asset.stream)) {
					debug('we have an invalid stream');
					if(Channel) {
						Channel.crash(Asset);
					} else {
						Asset.crash();
					}
					return;
				}
				
				process.stdout.pipe(new bufferStream({'highWaterMark':7, 'objectMode': true})).pipe(Asset.stream);
				Asset.pid = process.pid;
				Asset.spawn = process;
				ss.notify('status', ss.Listen.status());
			});
			monitor.on('start', function () {
				//this doesnt emit for some reason
				debug('start');
			});
			monitor.on('stderr', function (data) {
				Asset.log = ('stderr: ' + data);
				debug('stderr: ' + data);
				Asset.log = (opts.name + ' stderr: ' + data);
				ss.talk('source error', { error: 'stderr: ' + data, stream: opts.name});
				ss.talk('source.' + opts.id, { error: 'stderr: ' + data, stream: opts.name});
				if(started === 0) {
					debug('return')
					cb('program stderr ' + data, Asset.stream);
					started = 1;
				}
			});

			monitor.on('stop', function (code) {
				Asset.log = ('program respawn stopped with code ' + code);
				debug('program respawn stopped with code ' + code);
				Asset.stream.end();
				ss.notify('status', ss.Listen.status());
				// ran = 0;
			});
			monitor.on('exit', function (code, signal) {
				debug('child process exited with code ' + code);
				if(started === 0) {
					debug('return')
					cb('child process exited with code ' + code, Asset);
					started = 1;
				}
				Asset.log = ('child process exited with code ' + code);
				ss.openSocket.emit('status', ss.Listen.status());
				// ran = 0;
			});
			monitor.on('crash', function () {
				debug('program respawn monitor crashed');
				Asset.log = ('program respawn monitor crashed');
				Asset.stream.end();
				ss.removeAsset(Asset);
				ss.openSocket.emit('status', ss.Listen.status());
				// ran = 0;
			});

		}
		
	}
	
}
