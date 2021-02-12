import React, { PureComponent } from "react";
import Debug from 'debug';
import { Styles } from '../../../common/styles';
import moment from 'moment';
import Table from '../../../common/components/table';
import { FlatButton, Divider, FontIcon, IconButton } from 'material-ui';
import { isObject, find as Find, filter as Filter } from 'lodash';

let debug = Debug('woobi:app:pages:epg:components:scheduled');

export default class Scheduled extends PureComponent {
	constructor( props, context ) {
		super( props, context );
		
	}
	
	render ( ) {
		//debug('renderScheduled', program.title, this.props.timers, Filter( this.props.timers, ( t ) => { t.name.replace( '(R)', '' ).trim() == program.title.replace( '(R)', '' ).trim()  } ))
		
		const { list, program, channels, futureEpisodes, onRowSelection, height } = this.props;
		
		let fields = [
			{ 
				field: 'startTime', 
				style: { width: 115, fontSize: 11  } , 
				label: 'Time' , 
				headerProps: {
					style: { width: 115, height: 20, fontSize: 11, textAlign: 'left' }
				},
				print: (v, props, obj) => { 
					if (!v && obj.recordingTime ) v = obj.recordingTime;
					let div = (<div style={{ position: 'relative', width: '100%', height: 18,  marginTop: -15, marginLeft: -23, padding: '2px 0px 0px 5px'}}>{moment.unix(v).format('ddd MMM Do')}</div>);
					return <div>{div}{moment.unix(v).format('h:mm a')}</div> 
				} 
			},
			{ 
				field: 'programId',  
				label: 'Program',
				style: { fontSize: 11 }, 
				headerProps: { 
					style: { height: 20, fontSize: 11, textAlign: 'left' }
				},
				print: (v, props, obj) => { 
					const p = Find( futureEpisodes, b => ( b.programId == v ) ) || {}
					return <div> { p.episode || obj.title || p.title }</div> 
				}
			},	
			{ 
				field: 'channelId',  
				label: 'Channel', 
				style: { fontSize: 11 },
				headerProps: {
					style: { height: 20, fontSize: 11, textAlign: 'left' }
				},
				print: (v, props, obj) => { 
					const p = Find( channels, b => ( b.channelId == v ) ) || {}
					return <div> { p.channelName }</div> 
				}  
			},
		];
		
		return (
			<Table 
				fields={fields} 
				list={ list }
				tableProps={ { 
					style: { background: 'none', fontSize: 11 },
					fixedHeader: this.props.fixedHeader,
					fixedFooter: this.props.fixedFooter,
					multiSelectable: false,
					height: height,
					selectable: true ,
					onRowSelection: onRowSelection
				} }
				
				tableRowColumnProps={{
					style: { fontSize: 11 },
				}}
				footerStyle={{
					height: 24,
					textAlign: 'left'
				}}
				footerStyle={{
					height: 24,
					textAlign: 'left'
				}}
				tableRowProps={ { 
					style: { cursor: 'pointer', fontSize: 11 },
					displayBorder: false,
					selectable: true
				} }
				tableHeaderColumnProps ={ {
					style: {
						height: 24,
					}
				} }
				tableHeaderProps ={ {
					adjustForCheckbox: false,
					displaySelectAll: false,
					enableSelectAll: false,
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



Scheduled.defaultProps = {
	onRowSelection: ()=>{},
	list: [],
	height: 'auto',
	fixedHeader: false,
	fixedFooter: true,
	futureEpisodes: [],
}
