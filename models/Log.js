var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Log Model
 * ==================
 */

var Log = new keystone.List('Log', {
	//autokey: { from: 'name', path: 'slug', unique: true },
	track: true,
	map: { name: 'from' }
});

Log.add({
	from: { type: Types.Text, required: true, initial: true },
	entry: String ,
	type: { type: Types.Select, options: 'info, error, warning' },
	from: String,
	logger: String,
	source: { type: Types.Relationship, ref: 'Source' },
	program: { type: Types.Relationship, ref: 'Program' },
	channel: { type: Types.Relationship, ref: 'Channel' },
	stream: { type: Types.Relationship, ref: 'Stream' }
	
});

Log.register();
