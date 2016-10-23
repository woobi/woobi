import React from 'react';
import { Avatar, FontIcon, IconButton, Table as TTable, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui';
import { Styles } from '../styles';
import { isObject, isFunction, isString } from 'lodash';

import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:table');

export class Table extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Table';		
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	render() {
		
		debug('## TABLE Props render ##', this.props);
		
		var Fields = this.props.fields;
		
		if(isString(Fields)) {
			var Fields = Fields.split(',').map(f => ({ field: f.trim(), label: f.trim() }));
		}
		
		let body = this.props.list.map((tile, k) => {
			
			let cols = Fields.map(field => {
				if(!isObject(field.props)) {
					field.props = {};
				}
				// check for a print function else just display the field
				let print = tile[field.field];
				if (isFunction(field.print)) {
					print = field.print(tile[field.field], this.props, tile);
				}
				return (<TableRowColumn { ...this.props.tableRowColumnProps } style={field.style || {}} { ...field.props } >{print}</TableRowColumn>);
			});
			
			return( <TableRow { ...this.props.tableRowProps }>
				{cols}
			</TableRow>);
		});
		
		let headers = Fields.map(field => {
			if(!isObject(field.headerProps)) {
				field.headerProps = {};
			}
			return (<TableHeaderColumn  { ...this.props.tableHeaderColumnProps } style={field.style || {}} { ...field.headerProps } >{field.label}</TableHeaderColumn>);
		});
		let header = (<TableHeader { ...this.props.tableHeaderProps }	>
			<TableRow { ...this.props.tableRowProps } >
				{headers}
			</TableRow>
		</TableHeader>);
		
		debug('## render DeviceTable ##', this.props, '## body ##', body);
		return (<div className="table-responsive">
			<TTable { ...this.props.tableProps }	>
				{header}
				<TableBody { ...this.props.tableBodyProps } >
					{body}
				</TableBody>
			</TTable>
		</div>);
	}
}

const small = {
	width: '5%'
}
const large = {
	width: '44%'
}
const standard = {
	width: '18%'
}
Table.defaultProps = {
	assets: {},
	list: [],
	theme: {}, 
	style: {},
	fields: [
		{ 
			field: 'name',
			//style: large,
			label: 'Name', 
			print: (v, props, obj) => (<div style={{ width: '100%' }} >
				<div style={{  }} >
					<div style={{ width: '100%', overflow: 'hidden', height: '25px', padding: 5 }} >
						<a
							href={"/devices/" + obj.slug} 
							onClick={ e => {
								e.preventDefault();
								props.goTo({ 
									page: 'Device', 
									path: '/devices/' + obj.slug, 
									searchTerms: { 
										device: obj.slug 
									} 
								}); 
							}} 
						>
							{v}
						</a>
					</div>
					<div style={{ maxWidth: '80%', height: '15px', padding: 5, fontSize: 11, overflow: 'hidden', color: props.theme.baseTheme.palette.alternateTextColor }} >
						<div dangerouslySetInnerHTML={{ __html: typeof obj.description == 'object' ? obj.description.brief.html : '' }} />
					</div>	
				</div>
			</div>)
		},
		{ field: 'brand', style: { width: '14%' } , label: 'Brand' , print: (v, props, obj) => { return findByProp(props.assets.brands, '_id', v).name } },
		{ field: 'chip', style: standard, label: 'Chip' , print: (v, props) => { return findByProp(props.assets.chips, '_id', v).name } },
		{ field: 'roms', headerProps: { style: { width: small.width, paddingLeft: 0, paddingRight: 0, textAlign: 'center' }}, props: { style: { width: small.width, textAlign: 'center' }},label: 'ROMS' , print: (v, props) => { return v.length; } },
		{ field: 'howtos', headerProps: { style: { width: small.width, paddingLeft: 0, paddingRight: 0, textAlign: 'center' }}, props: { style: { width: small.width, textAlign: 'center' }},label: 'How Tos' , print: (v) => { return v.length; } },
		{ field: 'tools', headerProps: { style: { width: small.width, paddingLeft: 0, paddingRight: 0, textAlign: 'center' }}, props: { style: { width: small.width, textAlign: 'center' }},label: 'Tools' , print: (v) => { return v.length; } },
	],
	tableProps: {
		fixedHeader: true,
		fixedFooter: true,
		selectable: false,
		multiSelectable: false,
		height: false,
	},
	tableHeaderProps: {
		displaySelectAll: false,
		enableSelectAll: false,
		adjustForCheckbox: false,
	},
	tableRowProps: {},
    tableBodyProps: {
		stripedRows: false,
		showRowHover: true,
		deselectOnClickaway: true,
		displayRowCheckbox: false,
	},
	tableRowColumnProps: {},
	tableFooterProps: {},
	tableHeaderColumnProps: {}
};

Table.childContextTypes = {
    muiTheme: React.PropTypes.object
};

export default Table;

function findByProp(list, prop, value) {
		
	//debug("FIND BY PROP", list, prop, value);
	
	if(!list) {
		return false;
	}

	var found = list.find(item => {
		if(!item) return false;
		if(item[prop] === value) {
			return true;
		}
		return false;
	});
	//debug('##FOUND##', found);
	if(!found) found = {};
	return found;
}

