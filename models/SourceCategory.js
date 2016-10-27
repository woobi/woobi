var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * SourceCategory Model
 * ==================
 */

var SourceCategory = new keystone.List('SourceCategory', {
	autokey: { from: 'name', path: 'slug', unique: true }
});

SourceCategory.add({
	name: { type: Types.Text, required: true, initial: true },
	source: { type: Types.Relationship, ref: 'Source' }
});

SourceCategory.relationship({ ref: 'Source', path: 'categories' });

SourceCategory.register();
