var Woobi = require('./snowstreams');

Woobi.init({
	channelPort: 13000,
	host: 'air.woobi',
	proxy: {
		port: 7001,
		nodeadmin: false,
		host: '0.0.0.0'
	}
})
.then(() => {
		Woobi.addChannel('TV', {
			loop: true,
			// grab the tv stream sent frm another machine to our ip
			assets: [
				{
					type: 'program',
					name: 'Air',
					arg: 'gnutv -channels /home/woobi/dvb/channels.conf -out udp 10.10.10.82 13333 WAGA5',
					redo: 'gnutv -channels /home/woobi/dvb/channels.conf -out udp 10.10.10.82 13333 ##CMD##',
				},
				{
					type: 'udpSink',
					port: 13333,
					host: '10.10.10.82',
					name: 'AirTV',
				},
				{
					type: 'udpStream',
					port: 13333,
					host: '10.10.10.87',
					name: 'streamAir'
				},
				
			],
		}, (err) => {
			if(err) console.log('##ERROR##',err);
		});
});
