const _ = require('lodash');
/** 
 * Manage broadcast channels
 * @module helper-hls 
 * 
 * */
module.exports = function(Broadcast) {
	/**
	 * Create a HLS Broadcast stream
	 * @param {Object} opts - options object
	 */
	return function (opts) {
		return new Promise((resolve, reject) => {
				var run = (again = false) => {
					this.hls = Broadcast.Stream.HLS(_.defaults(opts, { source: this.output, channel: this.channel }), (err, hls) => {
						if(err) {
							this.debug(this.id + ' - ' + 'ERROR creating HLS stream',  err);
							return reject(err);
						} else {
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
