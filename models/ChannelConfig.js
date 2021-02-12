var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ChannelConfig Model
 * ==================
 */

var ChannelConfig = new keystone.List('ChannelConfig', {
	autokey: { from: 'name', path: 'slug', unique: true },
	track: true,
});

ChannelConfig.add({
	name: { type: Types.Text, required: true, initial: true },
	config: { type: Types.Text, required: true, initial: true },
	autostart: { type: Types.Boolean, required: true, initial: true, default: false },
	preset: { type: Types.Boolean,  default: false },
});

ChannelConfig.defaultColumns = 'slug|20%, name|20%, config|50%, autostart|10%';

ChannelConfig.register();
