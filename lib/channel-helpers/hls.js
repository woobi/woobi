const _ = require('lodash');

module.exports = function(Broadcast) {
	return function (opts) {
		return new Promise((resolve, reject) => {
				var run = (again = false) => {
					this.hls = Broadcast.Stream.HLS(_.defaults(opts, { source: this.broadcaster, channel: this.channel }), (err, hls) => {
						if(err) {
							this.debug(this.channel + ' - ' + 'ERROR creating HLS stream',  err);
							return reject(err);
						} else {
							if(!again) {
								this.links.hls = hls.link;
								this.link = hls.link;
							}
							_.pullAllBy(this.end, [{ name: hls.name }], 'name');
							this.end.push({name: hls.name, end: hls.end});
							resolve(hls);
						}
					});
				}
				opts.crash = () => {
					run(true);
				};
				run();
		});
	}
}
