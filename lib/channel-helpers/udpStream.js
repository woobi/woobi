const _ = require('lodash');
/**
 * @module
 * @param {*} Broadcast 
 * 
 * Return a new UDP stream piping broad\caster
 */
module.exports = function(Broadcast) {
	/**
	 * Return a new UPD stream attached to the broadcaster
	 * @param {Object} opts - options object
	 */
	return function udpStream(opts) {
		return new Promise((resolve, reject) => {
				this.debug(this.channel + ' - ' + 'add udpStream');
				this.udpStreams.push(new Broadcast.Stream.UDP(
					_.defaults(opts, { 
						channel: this.channel, 
						port: Broadcast.channelPort++,  
						stream: this.output, 
						autoPlay: true, 
						streamOptions: { end: false }
					}), (err, udp) => {
						this.debug(this.channel + ' - ' + 'done with udpStream', err);
						if(err) {
							return reject(err);
						} 
						// the link to the stream
						this.links.udpStream.push('udp://' + (opts.host || Broadcast.host) + ':' + udp.port);
						// play the stream if it gets restarted
						this.streamRestart.push(udp.play);
						this.end.push({name: udp.name, end: udp.end});
						return resolve(udp);
					})
				);
		});
	}
}
