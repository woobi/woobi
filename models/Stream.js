var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Stream Model
 * ==========
 */

var Stream = new keystone.List('Stream', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: 'name', unique: true },
	track: true,
	hidden: true
});

Stream.add({
	name: { type: Types.Text, required: true, initial:true, unique: true },
	port: {type: Types.Number, index:true, initial:true },
	type: { type: Types.Select,  label:'type', required: true, initial: true,  options: 'custom,  file, pipe, program, udp',},
	host: { type: Types.Text, initial:true },
	file: { type: Types.Text, initial:true },
	destination: { type: Types.Text, initial:true  },
	program: { type: Types.Relationship, ref: 'Program', many: false },
	expose: { type: Types.Boolean, default: false, initial:true },
	listen: { type: Types.Boolean, default: false, initial:true },
	event: { type: Types.Text, initial:true },
	argument: { type: Types.Relationship, ref: 'ProgramArgument', many: true },
	stderror: { type: Types.Relationship, ref: 'ProgramArgument', many: true },
	stream: { type: Types.Relationship, ref: 'Stream', many: false },
	streaming: { type: Types.Boolean, default: false, initial:true, noedit: true },

});


Stream.defaultColumns = 'name, type|20%, port|20%, source';
Stream.register();
