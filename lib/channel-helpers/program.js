/** 
 * Manage broadcast channels
 * @module helper-program 
 * 
 * */
module.exports = function(Broadcast) {
	/**
	 * Add a program to sources
	 * @param {Object} opts - options object
	 */
	return function (opts) {
		return new Promise((resolve, reject) => {
			this.programs.push(Broadcast.addProgram(opts.name, opts, (err, prog) => {
				if(err) {
					return reject(err);
				}
				if(typeof prog.options.callback === 'function') {
					prog.options.callback.call(this, prog);
				}
				this.end.push({name: prog.name, end: prog.end});
				return resolve(prog);
			}));
		});
	}
}
