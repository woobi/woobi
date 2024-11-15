var debug = require('debug')('woobi:stream:io');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
/**
 * @module Broadcast/Stream 
 * @param {*} Broadcast 
 */
module.exports = function(Broadcast) {

    return IO;
    /**
 * Returns an input and output stream
 * 
 * the input is passed through ffmpeg and a textfile is overlayed
 * add and remove text to change the output
 * 
 * ####Example:
 *     Broadcast.Stream.io(textfile)
 * 
 * @param {string} [textfile] a file to read for text to display on screen, false for plain in/out streams
 * @return {stream} throttled passthrough stream   
 * @api public
 */
	 function IO(textfile) {
		
		if (!(this instanceof IO)) return new IO(textfile);
		
		var ret = {
            input: new Broadcast.Stream.bridge(),
            output: new Broadcast.Stream.bridge()
        }

        if(!textfile) {
            /* since no text file just return standard streams */
            debug( 'Broadcaster Overlay skipped');
            ret.input.pipe(ret.output);
            return ret;
        } else {
            debug( 'Broadcaster Overlay streaming from Fluent');
            this.ffmpeg = ffmpeg(ret.input, {
                stdoutLines: 0,
                logger: true
            });
            this.ffmpeg.videoFilters({
                filter: 'drawtext',
                options: {
                    //fontfile: '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
                    textfile,
                    reload: 1,
                    fontfile: path.join(Broadcast.get('module root'), 'lib','assets','Chalkboy.ttf'), 
                    fontcolor: 'white',
                    fontsize: 50,
                    box: 1,
                    boxcolor: 'black',
                    boxborderw: 25,
                    x: '(w-text_w)/2',
                    y: '(h-text_h)-10'
                }
            })
            .addOption("-c:a copy")
            .addOption("-c:v libx264")
            .addOption("-bsf:v h264_mp4toannexb")
            .addOption("-tune zerolatency")
            .addOption("-map 0:v:0")
            .addOption("-map 0:a:0")
            .addOption("-movflags faststart")
            .addOption("-profile ultrafast")
            .addOption("-strict experimental");
            this.ffmpeg.format('mpegts');
            this.ffmpeg.stream(ret.output, {end: false});
            this.ffmpeg.on('start', (cmd) => {
				debug('Start Overlay Fluent stream', cmd);
			})
			// end event
			this.ffmpeg.on('end', () => {
				debug( 'Broadcaster Overlay has finished streaming from Fluent');
				this.end = false;	
			})
			// error event
			this.ffmpeg.on('error', (err) => {
				debug( 'Broadcaster Overlay message: ' + err.message);
                /* wait for a few and try again */
                setTimeout(() => {
                    //this.ffmpeg.stream(ret.output, {end: false});
                }, 7500)
			})
			this.ffmpeg.on('stderr', function(err) {
				debug(err);		
			})
            return ret;
        }
	}
}
