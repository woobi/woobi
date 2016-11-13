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

var debug = require('debug')('woobi:source:program');
var _ = require('lodash');
var stream = require('stream');
var Pass = stream.PassThrough;
var spawn = require('child_process').spawn
var Respawn = require('respawn');
var bufferStream = require('../node-streams/leaky');

module.exports = function(Broadcast) {
	
	return function Program(options, callback) {
		
		if (!(this instanceof Program)) return new Program(options, callback);
		
		debug('program start', options);
		var _this = this;
		var ran = 0;
		var started = 0;
		
		var opts = options;
		
		debug('program checks');
				
		if(!_.isFunction(callback)) {
			debug('program no callback');
			var callback = function(){}
		}
		if(!_.isString(opts.name)) {
			callback('name must be a String');
			return;
		}
		
		if(!_.isString(opts.program)) {
			callback('there must be a program ' + opts.program);
			return;
		}
		
		this.name = opts.name || Broadcast.randomName();
		this.stdin = Broadcast.isReadableStream(opts.stdin) ? opts.stdin : false;
		
		debug(opts.program + ' ' + opts.arg);
		
		if(!_.isArray(opts.arg) && _.isObject(opts.arg)) {
			
			opts.arg = opts.arg.argument.split(' ').filter((v) => { return v !== '' });
		
		} else if (_.isString(opts.arg)) {
			
			opts.arg = opts.arg.split(' ').filter((v) => { return v !== '' });
		
		} 
		
		this.options = opts;
		
		// provide a restart argument
		this.redo = (cmd, cmd2) => {
			if(this.options.redo) {
				var opts = _.clone(this.options);
				var arg =  opts.redo.replace('##CMD##', cmd);				
				opts.arg = arg.replace('##CMD2##', cmd2);
				return opts;
			} else {
				return false;
			}
		}
		
		debug('create program')
		return useSource.call(this, opts);

		//  set the correct run parameters and program
		function useSource(opts) {
			
			var Asset = this;
			Asset.pid = 0;
			Asset.spawn = false;
			Asset.stream = false;
			Asset.command = [opts.program].concat(opts.arg);
			Asset.respawn = opts.respawn;
			Asset.restart = opts.restart;
			
			// asset stop function
			Asset.end = (pass, cb) => {
				
				debug('check for program stream');
				var Asset = this;
				
				if(_.isObject(Asset.monitor) && _.isFunction(Asset.monitor.stop)) {
					debug('stop program monitor');
					Asset.monitor.stop();
				}
				if(Broadcast.isReadableStream(Asset.stream) && _.isFunction(Asset.spawn.kill)) {
					debug('stop program spawn');
					Asset.spawn.kill();
				}	
			
				Broadcast.notify('status', Broadcast.socketListeners.status());
				
				debug('stop program done');
				
				if(_.isFunction(cb)) {
					cb(null, pass);
				}
				
			};
			
			debug('program passed tests... running program');
			
			var endStream;
			
			var doneWithSetup = (err, asset) => {
				Broadcast.streams[asset.name] = asset.stream;
				Broadcast.notify('status', Broadcast.socketListeners.status());
				callback(err, asset)
			}
			
			if(opts.respawn) {	
				
				debug('runAgainAgain');
				runAgainAgain(stream, this, doneWithSetup);
			
			} else {
				
				debug('run once');
				runOnce(stream, this, doneWithSetup);				
			}
			
			return this;
			
		}
		
		function runOnce(stream, Asset, cb) {
			
			var opts = Asset.options;
			debug(opts.program, opts.arg);
					
			var runProgram = Asset.spawn = spawn(opts.program, opts.arg);
			if(this.stdin) {
					this.stdin.pipe(runProgram.stdin);
			}
			runProgram.stderr.on('data', function (data) {
				Asset.log = ('stderr: ' + data);
				if(opts.debug) debug('stderr: ' + data);
			});
			
			if(Broadcast.isReadableStream(runProgram.stdout)) {
				
				debug(opts.program + ' produced a readable stream');
				
				//var limited = ratelimit(runProgram.stdout, 250 * 1024);
				Asset.log = (opts.program + ' produced a readable stream');
				Asset.stream = runProgram.stdout.pipe(new bufferStream({'highWaterMark':7, 'objectMode': true}));
				Asset.pid = runProgram.pid;
				runProgram.on('close', function (code) {
					debug(Asset.log)
					debug('program quit ' + opts.program + ' ' + code);
				});
				runProgram.on('error', (err) => {
					debug(err);
					debug('program quit ' + opts.program + ' ' + code);
				});
								
				cb(null, Asset);
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
				kill: opts.kill || 20000, // wait 30s before force killing after stopping
			});
			monitor.on('start', function () {
				debug(Asset.name + ' -  start');
				
				started = 1;
			});
			monitor.on('stdout', function (data) {			
				
			});
			monitor.on('spawn', function (child) {
				// this emits on a respawn
				debug(Asset.name + ' -  spawn event', Broadcast.isReadableStream(process.stdout), Broadcast.isReadableStream(Asset.stream));
				
				if(!Broadcast.isReadableStream(process.stdout) || !Broadcast.isReadableStream(Asset.stream)) {
					debug('we have an invalid stream');
					Asset.crash();
					return;
				}
				
				var spawned = monitor.child;
				if(this.stdin) {
					this.stdin.pipe(spawned.stdin);
				}
				spawned.stdout.pipe(Asset.stream, { end: false} );
				Asset.pid = spawned.pid;
				Asset.spawn = spawned;
				Broadcast.notify('status', Broadcast.socketListeners.status());
				cb(null, Asset);
			});
			
			monitor.on('stderr', function (data) {
				Asset.log = ('stderr: ' + data);
				//debug('stderr: ' + data);
				Asset.log = (opts.name + ' stderr: ' + data);
				//Broadcast.talk('source error', { error: 'stderr: ' + data, stream: opts.name});
				//Broadcast.talk('source.' + opts.id, { error: 'stderr: ' + data, stream: opts.name});
				if(started === 0) {
					debug(Asset.name + ' - return from stderr');
					cb(null, Asset);
					started = 1;
				}
			});

			monitor.on('stop', function (code) {
				Asset.log = (this.name + ' - program respawn stopped with code ' + code);
				debug(Asset.name + ' - program respawn stopped with code ' + code);
				Asset.stream.end();
				Broadcast.notify('status', Broadcast.socketListeners.status());
				// ran = 0;
			});
			monitor.on('exit', function (code, signal) {
				debug('child process exited with code ' + code);
				debug(Asset.log);
				if(started === 0) {
					debug('return from exit')
					cb('child process exited with code ' + code, Asset);
					started = 1;
				}
				Asset.log = ('child process exited with code ' + code);
				Broadcast.notify('status', Broadcast.socketListeners.status());
				// ran = 0;
			});
			monitor.on('crash', function () {
				debug('program respawn monitor crashed');
				Asset.log = ('program respawn monitor crashed');
				debug(Asset.log);
				Asset.stream.end();
				Broadcast.removeAsset(Asset);
				Broadcast.notify('status', Broadcast.socketListeners.status());
				// ran = 0;
			});
			
			monitor.start();
			
		}
		
	}
	
}
