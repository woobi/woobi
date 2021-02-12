import React from 'react';
import { Avatar, FontIcon, IconButton, Table as TTable, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui';
import { Styles } from '../styles';
import { isObject, isFunction, isString } from 'lodash';
import moment from 'moment';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import debugging from 'debug';
let	debug = debugging('woobi:app:common:components:table');

export class Table extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Table';		
		this.nextDay = false;
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
			
			return( <TableRow selected={this.props.selected.indexOf(k) !== -1} { ...this.props.tableRowProps }>
				{cols}
			</TableRow>);
		});
		
		let headers = Fields.map(field => {
			if(!isObject(field.headerProps)) {
				field.headerProps = {};
			}
			return (<TableHeaderColumn  { ...this.props.tableHeaderColumnProps }  { ...field.headerProps }  >{field.label}</TableHeaderColumn>);
		});
		
		let header = (<TableHeader { ...this.props.tableHeaderProps }	>
			<TableRow { ...this.props.tableRowProps } >
				{headers}
			</TableRow>
		</TableHeader>);
		
		let footer = (<TableFooter { ...this.props.tableFooterProps }	>
			<TableRow { ...this.props.tableFooterRowProps } >
				{headers}
			</TableRow>
		</TableFooter>);
			
		let tProps = { ...this.props.tableProps }
		return (
			<div className=""  >
				<TTable { ...tProps }	>
					{tProps.fixedHeader ? header : <span />}
					<TableBody { ...this.props.tableBodyProps } >
						{body}
					</TableBody>
					{tProps.fixedFooter ? footer : <span />}
				</TTable>
			</div>
		);
	}
}

const small = {
	width: 115
}
const large = {
	//width: '70%'
}
const standard = {
	width: '18%'
}

Table.defaultProps = {
	assets: {},
	list: [],
	selected: [],
	theme: {}, 
	style: {},
	nextDay: false,
	day: moment().format('D'),
	fields: [],
	tableProps: {
		fixedHeader: false,
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
