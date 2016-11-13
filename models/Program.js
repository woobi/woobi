var keystone = require('keystone');
var Types = keystone.Field.Types;
var debug = require('debug')('woobi:model:Program');
var async= require('async');
var _ = require('lodash');

/**
 * Stream Model
 * ==========
 */

var Program = new keystone.List('Program', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: 'name', unique: true },
	track: true,
	hidden: true
}); 
 
Program.add({
	name: { type: Types.Text, required: true, initial:true, unique: true },
	type: { type: Types.Select,  label:'type', initial:true, default: 'shell',  options: [{ value: 'shell', label: 'shell program' },{ value: 'internal', label: 'internal program' },{ value: 'fluent-ffmpeg', label: 'fluent-ffmpegS' }] },
	stderror: { type: Types.Relationship, ref: 'ProgramArgument', many: true,  dependsOn: {type: 'shell'} },
	program: { type: Types.Text,  initial:true},
	arguments: { type: Types.Relationship, ref: 'ProgramArgument', many: true },
	expose: { type: Types.Boolean, default: false, initial:true },
});

Program.schema.post('save', function() {
	var doc = this;
	/*
	_.each(this.arguments, function(id) {
		keystone.list('ProgramArgument').model.findOne({_id: id}, function(err, doc) {
			
			
		});
	});
	*/
});

Program.relationship({ ref: 'ProgramArgument', path: 'program' });
Program.defaultColumns = 'name, program|20%, type';
Program.register();
