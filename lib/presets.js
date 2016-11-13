const _ = require('lodash');
const path = require('path');

var CHANNELS_LIST = 'WSB2:623000000:8VSB:49:52:1:MeTV:623000000:8VSB:65:68:2:LAFF:623000000:8VSB:81:84:3:WAGA5:551000000:8VSB:49:52:3:WPBA-HD:515000000:8VSB:49:52:3:WXIA11:195000000:8VSB:49:52:3:WGCL46:503000000:8VSB:49:52:3:WXIA-WX:195000000:8VSB:65:68:4:WXIA-JN:195000000:8VSB:81:84:5:WGCL46:503000000:8VSB:49:52:3:COZITV:503000000:8VSB:65:68:4:GRITTV:503000000:8VSB:81:84:5:WAGA-SD:551000000:8VSB:65:68:4:WAGA-SD:551000000:8VSB:81:84:5:APG:563000000:8VSB:33:34:1:THIS TV:563000000:8VSB:43:44:2:SHOP:563000000:8VSB:53:54:3:MOXiE:563000000:8VSB:63:64:4:Oldie:563000000:8VSB:73:74:5:Comet:563000000:8VSB:83:84:6:RetroTV:563000000:8VSB:93:94:7:LATV:563000000:8VSB:103:104:8:works:563000000:8VSB:113:114:9:Estrell:563000000:8VSB:123:124:10:94.9-3:563000000:8VSB:0:35:11:949BULL:563000000:8VSB:0:45:12:105.7FM:563000000:8VSB:0:55:13:PWR961:563000000:8VSB:0:65:14:96.1-2:563000000:8VSB:0:75:15:Patron:563000000:8VSB:0:85:16:OS87.7:563000000:8VSB:0:95:17:BIZTALK:563000000:8VSB:0:105:18:TBA:563000000:8VSB:0:35:19:TBA:563000000:8VSB:0:45:20:WJFBSD1:617000000:8VSB:49:52:3:TCT HD:617000000:8VSB:65:68:4:WATCDT:635000000:8VSB:49:52:3:WATCTOO:635000000:8VSB:65:68:4:SALSA:653000000:8VSB:113:116:7:Enlace:653000000:8VSB:97:100:6:JUCE/SOAC:653000000:8VSB:81:84:5:TCC:653000000:8VSB:65:68:4:TBN:653000000:8VSB:49:52:3';

var CHANNEL_LIST = CHANNELS_LIST.split(':');
CHANNEL_LIST = CHANNEL_LIST.filter((f,i) => {
	return (i%6 === 0 );
}).map((m)=> {
	return { name: m, label: m, link: 'http://air:7001/alvin/program/GNUTV/' + m, success: 'Channel changed to ' + m, error: 'Could not change to ' + m }
});

module.exports = function(Broadcast) {
	
	return {
		
		x11grab() {
			return {
				name: 'x11grab',
				loop: true,
				noTransition: false,
				files: [{
					name: 'x11:Fluent',
					file: ':0.0',
					inputFormat: 'x11grab',
					inputOptions: [
						'-s', '1920x1080',
						'-framerate','15',
					],
					onlyOptions: [
						'-f', 'pulse',
						'-ac','2',
						'-i','default',
						'-c:v', 'libx264',
						'-preset','ultrafast',
						//'-pix_fmt','bgr0',
						'-threads',0,
					]
				}],
				hls: {
					type: 'hls',
					name: 'x11',
					passthrough: true, // uses the stream as is / no transcoding
					hls: true
				},
				assets: [],
			}
		},
		
		videoN(n = 0, name) {
			let source = '/dev/video' + n;
			name = name || 'WebCam'+ n;
			return {
				name,
				loop: true,
				noTransition: false,
				files: [{
					name: name + ':Fluent',
					file: source,
					inputFormat: 'video4linux2',
					inputOptions: [
						'-framerate', '20',
					],
					onlyOptions: [
						'-c:v', 'libx264',
						'-preset', 'fast',
						'-pix_fmt', 'yuv420p',
						'-tune', 'zerolatency',
						//'-f', 'pulse',
						//'-ac', '2',
						//'-i', 'default',
					],
					videoFilters: {
						filter: 'scale',
						options: ['1280','720']
					},
				}],
				hls: {
					type: 'hls',
					name: name || 'WebCam'+ n,
					passthrough: true, // uses the stream as is / no transcoding
					hls: true
				},
				assets: [],
			}
		},
		
		tv() {
			return {
				name: 'TV',
				hls: {
					type: 'hls',
					name: 'Air',
					useSource: 'AirTv',
					passthrough: true,
					progress: false,
					hls: true
				},
				assets: [
					{
						type: 'udpSink',
						port: 13334,
						host: '10.10.10.87',
						name: 'AirTv',
						playSource: true,
					},
					{
						type: 'udpStream',
						port: 13332,
						host: '10.10.10.87',
						name: 'streamAir',
						autoPlay: true
					}
				],
				requestCommands: CHANNEL_LIST,
			}
		},
		/*
		writeOver(text = 'hello') {
			return {
				files: [path.join(Broadcast.get('module root'), 'lib/assets/river.mp4')],
				videoFilters: {
					filter: 'drawtext',
					options: {
						fontfile: '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
						text: text,
						fontcolor: 'white',
						fontsize: 24,
						box: 1,
						boxcolor: 'black@0.75',
						boxborderw: 5,
						x: '(w-text_w)/2',
						y: '(h-text_h)/2'
					}
				},
			}
		}
		* */
	}
	
}
