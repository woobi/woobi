var keystone = require('keystone');
var Types = keystone.Field.Types;
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var _ = require('lodash');
var debug = require('debug')('woobi:model:File');
var async = require('async');
var ss = require('../woobi');
var moment = require('moment');
var filesize = require('file-size');
 
/**
 * SourceCategory Model
 * ==================
 */

var File = new keystone.List('File', {
	track: true,
	hidden: true
});

File.add({
	file: { type: Types.Text, required: true, initial: true },
	name: { type: Types.Text, required: true, initial: true },
	ext: Types.Text ,
	codec: {
		audio: Types.Text ,
		audio_long: Types.Text ,
		video: Types.Text,
		video_long: Types.Text 
	},
	runtime: Types.Number ,
	size: Types.Number ,
	bitrate: Types.Number ,
	options: {
		inputFormat: { type: Types.Text,  initial: false,   },
		inputOptions: { type: Types.TextArray,  initial: false, },
		seek: { type: Types.Text,  initial: false,   },
		outputOptions: { type: Types.TextArray,  initial: false,  },
		videoFilters: { 
			filter: { type: Types.Text,  initial: false,  },
			options: { type: Types.TextArray,  initial: false,   },
		},
		format: { type: Types.Text,  initial: false,  },
		encode:  { type: Types.Boolean, default: false, dependsOn: {'options.user': false, 'options.stream': false} },
		stream:  { type: Types.Boolean, default: false, dependsOn: {'options.encode': false, 'options.user': false} },
		user:  { note: 'check this and leave only options empty for a passthrough stream', type: Types.Boolean, default: false, dependsOn: { 'options.encode': false, 'options.stream': false } },
		onlyOptions: { type: Types.TextArray,  initial: false, dependsOn: { 'options.user': true }  },
	},
	source: { type: Types.Relationship, ref: 'Source',   many: true}
});

File.schema.pre('save', function(go) {
	var doc = this;
	debug('File pre save');
	if(doc.scan) {
		File.schema.statics.addCodec(doc, go);
	} else {
		go();
	}
});

File.schema.statics.addCodec = function addCodec(doc, finished) {
	async.series([function(next) {
		doc.scan = false;
		doc.ext = _.trimStart(path.extname(doc.file), '.');
		var file = escapeShell(doc.file);
		
		ffmpeg.ffprobe(doc.file, function(err, meta) {
			if(err) debug(err);
			
			if(_.isObject(meta)) {
				
				if(_.isArray(meta.streams)) {
					
					for(var i=0;i<2;i++) {
						if(_.isObject(meta.streams[i])) {
							if(meta.streams[i].codec_type === 'audio') {
								doc.codec.audio = meta.streams[i].codec_name;
								doc.codec.audio_long = meta.streams[i].codec_long_name;
							} else {
								doc.codec.video = meta.streams[i].codec_name;
								doc.codec.video_long = meta.streams[i].codec_long_name;
							}
						}
					}
				}
				
				if(_.isObject(meta.format)) {
					doc.bitrate = meta.format.bit_rate;
					doc.size = meta.format.size;
					doc.runtime = meta.format.duration;
				}
				
				var time = moment.duration(doc.runtime, 'seconds');
				
				var msg = '<div >'
					+ '<div class="col-sm-12" >metadata retrieved </div>'
					+ '<div class="col-sm-12" ><b>' + doc.file + '</b></div>'
					+ '<div class="col-sm-4">' + time.hours() + ':' + time.minutes() + '.' + time.seconds() + '</div>'
					+ '<div class="col-sm-4" ><span >' + Math.floor(doc.bitrate/1024) + '</span><span > kb/s</span></div>'
					+ '<div class="col-sm-4" ><span >' + filesize(doc.size).human() + '</span></div>'
					+ '<div class="col-sm-6">' + doc.codec.video + '</div>'
					+ '<div class="col-sm-6" >' + doc.codec.audio + '</div>'
					+ '<div class="col-sm-6">' + doc.codec.video_long + '</div>'
					+ '<div class="col-sm-6" >' + doc.codec.audio_long + '</div>'
					+ '<div class="clearfix" ></div>'
					+ '<hr />'
					+ '</div>';
				
				ss.notify('File-log', { message: msg });
			}
			next();
		});// end ffprobe
		
	}],function(err) {
		//debug(doc);
		ss.notify('File-log', { done: true });
		if(_.isFunction(finished)) {
			finished();
		} else {
			doc.update(doc, function(err, newdoc) {
				if(err)debug(err);
			})
		}
	});
};

File.schema.post('save', function() {
	var doc = this;
	debug('File post save');
	if(this.source) {
		var sources = _.isArray(this.source) ? this.source : [this.source];
		_.each(sources, function(v) {
			keystone.list('Source').findOneAndUpdate({ _id: v}, {"$addToSet": { files: doc._id } }, function(err,ret) {
				//debug('added to source');
			});
		});
		
	}
});




File.defaultColumns = 'name, ext|20%, source|20%, codec';

File.relationship({ ref: 'Source', path: 'files' });

File.register();

var escapeShell = function(cmd) {
  return cmd.replace(/\'/g, "'\\''");
};

