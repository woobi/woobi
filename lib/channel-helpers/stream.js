module.exports = function(Broadcast) {
	return function (opts) {
		return new Promise((resolve, reject) => {
			this.streams.push(Broadcast.Source.Stream(opts, (err, stream) => {
				if(err) {
					return reject(err);
				}
				// add the source if not explicitly told not to
				if(opts.playSource !== false) {
					this.debug(this.channel + ' - ' + 'Add Stream Sink to Sources');
					this.addSource(stream);
				}
				this.end.push({name: stream.name, end: stream.end});
				return resolve(stream);
			}));
		});
	}
}
