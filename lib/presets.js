const _ = require('lodash');
const path = require('path');

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
