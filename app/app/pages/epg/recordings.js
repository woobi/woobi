import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import { sortBy } from 'lodash';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu } from 'material-ui';
import Styles from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('woobi:app:pages:epg:recordings');

export default class Recordings extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Recordings';
		this.state = {
			selected: [],
		};
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Recordings',  this.props);
	}
	
	componentWillUnmount ( ) {
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Recordings got props', props);
		this._update = true;
		this.setState({ selected: [] });
	}	
	
	shouldComponentUpdate ( ) {
		debug('should recordings update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	handleExpandChange = ( expanded ) => {
		this.setState({expanded: expanded});
	};
	
	renderSchedule ( s ) {
		let fields = [
			{
				field: 'recordingTime',
				label: 'Date' ,
				style: { fontSize: 11, width: 175 }, 
				headerProps: {
					style: { width: 175,  fontSize: 11, textAlign: 'left' }
				},
				print: (v, list, obj) => {
					return (<span>{moment.unix(v).format('lll')}</span>) ;
				} 
			},
			{ 
				field: 'show',
				label: 'Show' , 
				style: { fontSize: 11 }, 
				headerProps: {
					style: {  fontSize: 11, textAlign: 'left' }
				},
				print: (v, list, obj) => {
					return (<span>{v} <br /> {obj.title}</span>) ;
				} 
			},
			{ 
				field: 'channelName',
				label: 'channel' , 
				headerProps: {
					style: {  fontSize: 11, textAlign: 'left' }
				},
				style: {  fontSize: 11 }, 
			},
		];
		return (
			<Table 
				fields={fields} 
				list={ s } 
				selected={ this.state.selected }
				tableProps= {{
					fixedHeader: true,
					fixedFooter: false,
					selectable: true,
					multiSelectable: true,
					height: this.props.window.height - 80,
					onRowSelection: (v) => {this._update = true;this.setState({ selected: v })}
				}}
				tableHeaderProps={ {
					displaySelectAll: true,
					enableSelectAll: true,
					adjustForCheckbox: true,
				}}
				tableBodyProps={ {
					stripedRows: true,
					showRowHover: true,
					deselectOnClickaway: false,
					displayRowCheckbox: true,
				}}
			/>)
			
	}
	
	render ( ) { 
		debug('## render  ##  Recordings  render', this.props, this.state);
		let ret = <span/>;
		let sort = this.props.location.query.sortRecordingsBy || 'recordingTime';
		let up = this.props.location.query.sortRecordingsDown || 'desc';
		if ( sort === 'lastToAir' ) sort = 'recordingTime';
		let menu = <span />;
		if (this.props.recordings) {
			
			ret = sortBy( this.props.recordings, [ sort ] );
			if ( up === 'desc' ) ret.reverse();

			menu = (<div style={{ padding: '0 0px' }}>
				<div style={{ position: 'absolute', top: 15, right: 0, width: 150, height: 50, zIndex: 1000 }}>
					<FontIcon className="material-icons" title="Sort by Name" hoverColor={Styles.Colors.limeA400} color={sort === 'show' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/recordings/', query: {sortRecordingsBy: 'show', sortRecordingsDown: up === 'asc' ? 'desc' : 'asc' }, page: 'Recordings by name'}); } }>sort_by_alpha</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" title="Sort by Recently Aired"  hoverColor={Styles.Colors.limeA400} color={sort === 'recordingTime' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/recordings/', query: {sortRecordingsBy: 'lastToAir', sortRecordingsDown: up === 'asc' ? 'desc' : 'asc' }, page: 'Recordings by recently aired'}); } } >access_time</FontIcon>
				</div>
				
				{this.renderSchedule( ret )}
				</div>
			);
		}
		
		return (<div style={{ padding: '0 0px',  maxHeight: this.props.window.height-80, overflow: 'hidden'  }}>
			<div className="col-xs-8 col-sm-9"  >
				{menu}
			</div>
			<div className="col-xs-4 col-sm-3" >
				<FlatButton 
					title={ "Delete Selected Programs" } 
					backgroundColor={Styles.Colors.red800}
					hoverColor={Styles.Colors.red400}
					onClick={ e=>{ this.deleteRecordings( ret, this.state.selected )}  } 
					icon={<FontIcon className="material-icons" children='delete_sweep' />}
					label={ " Delete Selected Programs " }
				/>
				<div className="" style={{ maxHeight: this.props.window.height-110, overflow: 'auto' }}>
					{this.state.selected.map(e => (<div style={{ padding: 5}}>{ret[e].show} - {ret[e].title}</div>))}
				</div>
			</div>
		</div>);
	}
	
	deleteRecordings = ( timers = [], selected = [] ) => {
		Gab.emit('confirm open', {
			title: 'Delete Recordings ',
			html: "Do you want to remove " + selected.length + "  Recordings ?",
			answer: ( yesno ) => { 
				if ( yesno) {
					Gab.emit('confirm open', { 
						style: { backgroundColor: Styles.Colors.red300 },
						title: 'This is Permanent',
						open: true,
						html: "Are you positive? This will permanently remove " + selected.length + " Recordings ",
						answer: ( yesno ) => { 
							Gab.emit('confirm open', { open: false });
							if ( yesno ) {
								const send = {
									//startTime: program.startTime, // Start date and time of listing
									//title: program.title, // name of listing
									//channel:  this.props.renderChannel.channel,
									//channelName:  this.props.renderChannel.channelName,
									//timerId: timer.timerId 
								}
								//debug('Cancel Recording Program', send);
								//this.props.deleteTimer( send ); 
								this.setState({ selected: [] });
								this._update = true;
							}
						},
						yesText: 'Permanently Delete', 
						noStyle: {
							backgroundColor: 'initial',
							labelStyle: {
								color: 'white',
							}
						},
						yesStyle: {
							backgroundColor: Styles.Colors.red800,
							labelStyle: {
								color: 'white',
							}
						}
					});
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' DELETE Recordings', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor: Styles.Colors.red800,
				labelStyle: {
					color: 'white',
				}
			}
		})
	}
	
}

Recordings.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Recordings ###',  params);
	return {}
}
