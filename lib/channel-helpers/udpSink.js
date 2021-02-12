module.exports = function(Broadcast) {
	return function (opts) {
		return new Promise((resolve, reject) => {
			this.udpSinks.push(Broadcast.Source.UDP(opts, (err, udp) => {
				if(err) {
					return reject(err);
				}
				// add the source if not explicitly told not to
				if(opts.playSource !== false) {
					this.debug(this.channel + ' - ' + 'Add UDP Sink to Sources');
					this.addSource(udp);
				}
				this.end.push({name: udp.name, end: udp.end});
				this.links.udpSink.push('udp://' + (opts.host || Broadcast.host) + ':' + udp.port);
				return resolve(udp);
			}));
		});
	}
}
