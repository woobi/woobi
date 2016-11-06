var keystone = require('keystone');
var Types = keystone.Field.Types;
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var _ = require('lodash');
var debug = require('debug')('snowstreams:model:Fluent');
var async = require('async');
var Broadcast = require('../snowstreams');
var moment = require('moment');
var filesize = require('file-size');
 
/**
 * SourceCategory Model
 * ==================
 */

var Fluent = new keystone.List('Fluent', {
	track: true,
	hidden: true
});

Fluent.add({
	state: { type: Types.Select, options: 'ready , failed, playing, paused, stopped', default: 'ready' },
	source: { type: Types.Text, required: true, initial: true },
	name:  { type: Types.Text, required: true, initial: true },
	ext: Types.Text ,
	log: Types.TextArray ,
	
	codec: {
		audio: Types.Text ,
		audio_long: Types.Text ,
		video: Types.Text,
		video_long: Types.Text 
	},
	options: {
		input: Types.TextArray ,
		output: Types.TextArray ,
		format: Types.Text,
		only: { type: Boolean, default: false },
		onlyOptions: Types.TextArray,
		passthrough: { type: Boolean, default: false },
		hls: Types.TextArray,
	},
	progress: {
		"frames": Types.Number,
		"currentFps": Types.Number,
		"currentKbps": Types.Number,
		"targetSize": Types.Number,
		"timemark": Types.Text,
		"percent": Types.Number,
	},
	runtime: Types.Number ,
	size: Types.Number ,
	bitrate: Types.Number ,
	source: { type: Types.Relationship, ref: 'Channel', required: true, initial:true, many: true}
});
Fluent.schema.pre('save', function(go) {
	var doc = this;
	debug('Fluent pre save');
	if(doc.scan) {
		Fluent.schema.statics.addCodec(doc, go);
	}
});

Fluent.schema.statics.addCodec = function addCodec(doc, finished) {
	async.series([function(next) {
		doc.scan = false;
		doc.ext = _.trimLeft(path.extname(doc.file), '.');
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
				
				Broadcast.notify('File-log', { message: msg });
			}
			next();
		});// end ffprobe
		
	}],function(err) {
		//debug(doc);
		Broadcast.notify('File-log', { done: true });
		if(_.isFunction(finished)) {
			finished();
		} else {
			doc.update(doc, function(err, newdoc) {
				if(err)debug(err);
			})
		}
	});
};

Fluent.schema.post('save', function() {
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




Fluent.defaultColumns = 'name, ext|20%, source|20%, codec';

Fluent.relationship({ ref: 'Source', path: 'files' });

Fluent.register();

var escapeShell = function(cmd) {
  return cmd.replace(/\'/g, "'\\''");
};

