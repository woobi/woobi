import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import { uniq, sortBy } from 'lodash';
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
		//this.setState({ selected: [] });
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
		let rows = [];
		let lastday = ''
		s.forEach( ( r, k ) => {
			let day = moment.unix(r.recordingTime).format("dddd MMMM Do");
			if ( day != lastday ) {
				lastday = day;
				if ( rows.length === 0 ) {
					rows.push(<div style={{ padding: 5, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 35, fontSize: 18, fontWeight: 700, margin: '0 0 10 0' }} >{lastday}</div>);
				} else {
					rows.push(<div style={{ padding: 5, position: 'sticky', width: '100%', marginTop: 40,  top: 0, left: 0, backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 35, fontSize: 18, fontWeight: 700, margin: '30 0 20 0' }} >{lastday}</div>);
				}
			}
			
			const tow = (<div 
					onClick={( ) =>  {  
						let { selected } = this.state;
						if ( selected.indexOf(k) > -1 ) {
							selected.splice(selected.indexOf(k), 1);
						} else {
							selected = uniq([ ...selected, k ])
						}
						this.setState({ selected }); 
						this._update = true; 
					}} 
					style={{ background: ( this.state.selected.indexOf(k) < 0 ) ? 'none' : ColorMe( 15, this.props.theme.baseTheme.palette.canvasColor ).bgcolor, cursor: 'pointer', marginBottom: 5, padding: 5, borderBottom: '1px solid ' + ColorMe( 5, this.props.theme.baseTheme.palette.canvasColor ).bgcolor }} 
				>
					{moment.unix(r.recordingTime).format("LT")} - <span style={{ fontWeight: 700, fontSize: 16 }}>{r.show}</span> - {r.channelName} <br /><b>{r.title}</b> <br /> {r.plot}
				</div>)
			
			rows.push(tow);
		});
		
		return rows;
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
				{this.renderSchedule( ret )}
				</div>
			);
		}
		
		let deletes = (<FlatButton 
					title={ "Delete Selected Recordings" } 
					backgroundColor={Styles.Colors.red800}
					hoverColor={Styles.Colors.red400}
					onClick={ e=>{ this.deleteRecordings( ret, this.state.selected ) }  } 
					icon={<FontIcon className="material-icons" children='delete_sweep' />}
					label={ " Delete Selected Recordings " }
					style={{ float: 'right' }}
				/>)
		let h = ( this.state.selected.length > 0 ) ? 85 : 65
		return (<div style={{ padding: '0 0px',  maxHeight: this.props.window.height-65, overflow: 'hidden'  }}>
			<div style={{ position: 'absolute', top: 15, right: 0, width: 150, height: 50, zIndex: 1400 }}>
					<FontIcon className="material-icons" title="Sort by Name" hoverColor={Styles.Colors.limeA400} color={sort === 'show' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/recordings/', query: {sortRecordingsBy: 'show', sortRecordingsDown: up === 'asc' ? 'desc' : 'asc' }, page: 'Recordings by name'}); } }>sort_by_alpha</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" title="Sort by Recently Aired"  hoverColor={Styles.Colors.limeA400} color={sort === 'recordingTime' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/recordings/', query: {sortRecordingsBy: 'lastToAir', sortRecordingsDown: up === 'asc' ? 'desc' : 'asc' }, page: 'Recordings by recently aired'}); } } >access_time</FontIcon>
				</div>
			{this.state.selected.length > 0 ? deletes : <span />}
			<div className="col-xs-12"  style={{ maxHeight: this.props.window.height - h, overflow: 'auto' }}>
				{menu}
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
