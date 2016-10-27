var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Broadcast Model
 * ==========
 */

var Channel = new keystone.List('Channel', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: 'name', unique: true },
	track: true
});

Channel.add({
	name: { type: Types.Text, required: true, initial:true, unique: true },
	source: { type: Types.Relationship, ref: 'Source', many: true},
	stream: { type: Types.Relationship, ref: 'Stream', many: false },
	streaming: { type: Types.Boolean, default: false, initial:true },
	loop: { type: Types.Boolean, default: false, initial:true },
	filler: { type: Types.Relationship, ref: 'Source', many: true },
	programs: { type: Types.Relationship, ref: 'Program', many: true },
	expose: { type: Types.Boolean, default: false, initial:true }	
	
});


Channel.defaultColumns = 'name, stream|20%, streaming|20%, source|20%';
Channel.register();
