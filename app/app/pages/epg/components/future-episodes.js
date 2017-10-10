import React, { PureComponent } from "react";
import Debug from 'debug';
import { Styles } from '../../../common/styles';
import moment from 'moment';
import Table from '../../../common/components/table';
import { FlatButton, Divider, FontIcon, IconButton } from 'material-ui';
import { isObject, find as Find, filter as Filter } from 'lodash';

let debug = Debug('woobi:app:pages:epg:components:future-episodes');

export default class FutureEpisodes extends PureComponent {
	constructor( props, context ) {
		super( props, context );
		
	}	
	render ( ) {
			
		let fields = [
			{ 
				field: 'startTime', 
				style: { width: 115, fontSize: 11  },
				headerProps: {
					style: { width: 115, height: 20, fontSize: 11, textAlign: 'left' }
				}, 
				label: 'Time' , 
				print: (v, props, obj) => { 
					let div = (<div style={{ position: 'relative', width: '100%', height: 18,  marginTop: -15, marginLeft: -23, padding: '2px 0px 0px 5px'}}>{moment.unix(v).format('ddd MMM Do')}</div>);
					return <div>{div}{moment.unix(v).format('h:mm a')}</div> 
				} 
			},
			{ 
				field: 'title',  
				label: 'Program',
				style: { fontSize: 11 },
				headerProps: {
					style: { height: 20, fontSize: 11, textAlign: 'left' }
				},  
				print: (v, props, obj) => { 
					return <div>{v}<br /> { obj.episode }</div> 
				}
			},	
			{ 
				field: 'channelName',  
				label: 'Channel', 
				style: { fontSize: 11 }, 
				headerProps: {
					style: { width: 115, height: 20, fontSize: 11, textAlign: 'left' }
				}, 
			},
		];
		return (
			<Table 
				fields={fields}
				headerStyle={{
					padding: 0,
					height: 24,
					textAlign: 'left'
				}} 
				list={ this.props.list }
				tableProps={ { 
					style: { background: 'none', fontSize: 11 },
					fixedHeader: false,
					fixedFooter: true,
					height: this.props.height,
					selectable: true ,
					onRowSelection: this.props.onRowSelection 
				} }
				
				tableRowColumnProps={{
					style: { fontSize: 11 },
				}}
				footerStyle={{
						height: 24,
						textAlign: 'left'
				}}
				tableRowProps={ { 
					style: { cursor: 'pointer', fontSize: 11 },
					displayBorder: false,
					selectable: true,
					
				} }
				tableHeaderColumnProps ={ {
					style: {
						height: 24,
					}
				} }
				tableHeaderProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterRowProps = { {
					style: {
						padding: 0,
						height: 24,
					}
				} }
			 />
		);	
		
	}
}


FutureEpisodes.defaultProps = {
	onRowSelection: ()=>{},
	list: [],
	height: 'auto'
}
