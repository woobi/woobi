import React from 'react';
import { Avatar, FontIcon, IconButton, Table as TTable, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui';
import { Styles } from '../styles';
import { isObject, isFunction, isString } from 'lodash';
import moment from 'moment';

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
	theme: {}, 
	style: {},
	nextDay: false,
	day: moment().format('D'),
	fields: [
		{ 
			field: 'startTime', 
			style: small , 
			label: 'Time' , 
			print: (v, props, obj) => { 
				let div = <span />;
				if (!props.nextDay  && moment.unix(v).format('D') !== props.day) {
					div = (<div style={{ position: 'relative', width: '100%', height: 18, backgroundColor: '#ccc', marginTop: -15, marginLeft: -25, padding: '2px px px 5px'}}>{moment.unix(v).format('dddd')}</div>);
					props.nextDay = true;
				}
				return <div>{div}{moment.unix(v).format('h:mm a')}</div> 
			} 
		},
		{ field: 'title', style: large, label: 'Show'  },
	],
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

