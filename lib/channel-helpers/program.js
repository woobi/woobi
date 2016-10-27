module.exports = function(Broadcast) {
	return function (opts) {
		return new Promise((resolve, reject) => {
			this.programs.push(Broadcast.addProgram(opts.name, opts, (err, prog) => {
				if(err) {
					return reject(err);
				}
				if(_.isFunction(prog.options.callback)) {
					prog.options.callback.call(this, prog);
				}
				this.end.push({name: prog.name, end: prog.end});
				return resolve(program);
			}));
		});
	}
}