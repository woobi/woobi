var keystone = require('keystone');
var Types = keystone.Field.Types;
var debug = require('debug')('snowstreams:model:ProgramArgument');
var async= require('async');
var _ = require('lodash');

/**
 * SourceCategory Model
 * ==================
 */

var ProgramArgument = new keystone.List('ProgramArgument', {
	map: { 'name': 'anchor'},
	autokey: { path: 'slug', from: '_id', unique: true },
	drilldown: 'program',
	hidden: true
});

ProgramArgument.add({
	argument: { type: Types.Text, initial: true },
	anchor: { type: Types.Text, required: true, initial: true },
	program: { type: Types.Relationship, ref: 'Program' },
	command: { type: Types.Text, noedit: true },
});

ProgramArgument.schema.post('save', function() {
	ProgramArgument.schema.statics.postSave(this);
});

ProgramArgument.schema.statics.postSave = function postSave(doc, pull) {
	var arg = doc;
	if(!pull) {
		keystone.list('Program').model.update({_id: arg.program},{ $addToSet: { arguments: arg._id }}, function(err) {
			if(err) debug('ProgramArgument err', err);	
		}); 
	} else {
		keystone.list('Program').model.update({ _id: arg.program },{ $pull: { arguments: arg._id } });
	} 
};

ProgramArgument.schema.statics.preSavePost = function preSavePost(doc, cb) {
	if(doc.program) {
		keystone.list('Program').model.findOne({_id: doc.program}).exec(function(err, program) {
			if(err) return debug(err)
			if(!program) return;
			var command;
			if(program.type !== 'internal') {
				command = program.program + ' ' + doc.argument;
			} else {
				command = program.program + '(' + doc.argument + ')';
			}
			doc.update({command: command},function(err, nd) {
				if(_.isFunction(cb)) {
					cb();
				}
			});
		});
	}
};

ProgramArgument.schema.pre('save', function(go) {
	var doc = this;
	
	async.series([function(next) {
		
		if(doc.program) {
			keystone.list('Program').model.findOne({_id: doc.program}).exec(function(err, program) {
				if(err) next();
				if(!program) next();
				//debug(argss, argss.program)
				if(program.type !== 'internal') {
					doc.command = program.program + ' ' + doc.argument;
				} else {
					doc.command = program.program + '(' + doc.argument + ')';
				}
				next();
			});
		} else {
			next();
		}
	},function(next) {
		if(_.isArray(doc.source)) {
			//debug(doc.source)
			next();
		} else {
			next();
		}
	}],function(err) {
		go();
	});
}); 
 
ProgramArgument.schema.virtual('cmd').get(function () {
	var doc = this;
	if(program.type !== 'internal') {
		return program.program + ' ' + doc.argument;
	} else {
		return program.program + '(' + doc.argument + ')';
	}
});

ProgramArgument.relationship({ ref: 'Program', path: 'arguments' });

ProgramArgument.defaultColumns = ' anchor, command, program';
ProgramArgument.register();
