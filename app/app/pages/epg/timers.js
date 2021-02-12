import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import { uniq, sortBy, find } from 'lodash';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu, LinearProgress, MenuItem, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('woobi:app:pages:epg:scheduled');

export default class Timers extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Timers';
		this.state = {
			selected: []
		};	
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Timers',  this.props);
	}
	
	componentWillUnmount ( ) {
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Timers got props', props);
		this._update = true;
		// this.setState({ selected: [] });
	}	
	
	shouldComponentUpdate ( ) {
		debug('should Timers update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	handleExpandChange = ( expanded ) => {
		this.setState({expanded: expanded});
	};
	
	renderSchedule = ( s ) => {
		let rows = [];
		let lastday = ''
		s.forEach( ( r, k ) => {
			let day = moment.unix(r.startTime).format("dddd MMMM Do");
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
					{moment.unix(r.startTime).format("LT")} - <strong>{r.name}</strong> - {find(this.props.channels, ['channelId', r.channelId]).channelName} <br /> {r.info}
				</div>)
			
			rows.push(tow);
		});
		
		return rows;
	}
	
	render ( ) { 
		debug('## render  ##  Timers  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Timer Data" /><br /><LinearProgress mode="indeterminate" /></div>;
		let sort = this.props.location.query.sortTimersBy || 'start';
		if ( sort === 'nextToAir' ) sort = 'start';
		let up = this.props.location.query.sortTimersDown || 'asc';
		let menu = <span />;
		if (this.props.timers) {
			
			ret = sortBy( this.props.timers, [ sort ] );
			if ( up === 'desc' ) ret.reverse();

			menu = (<div style={{ padding: '0 0px' }}>
				
				
				{this.renderSchedule( ret )}
				</div>
			);
		}
		
		let deletes = (<FlatButton 
					title={ "Delete Selected Timers" } 
					backgroundColor={Styles.Colors.red800}
					hoverColor={Styles.Colors.red400}
					onClick={ e=>{ this.deleteTimers( ret, this.state.selected ) }  } 
					icon={<FontIcon className="material-icons" children='delete_sweep' />}
					label={ " Delete Selected Timers " }
					style={{ float: 'right' }}
				/>)
		let h = ( this.state.selected.length > 0 ) ? 85 : 65
		return (<div style={{ padding: '0 0px',  maxHeight: this.props.window.height-65, overflow: 'hidden'  }}>
			<div style={{ position: 'absolute', top: 15, right: 0, width: 150, height: 50, zIndex: 1000 }}>
				<FontIcon className="material-icons" title=" Sort by Name" hoverColor={Styles.Colors.limeA400} color={sort === 'name' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/scheduled/', query: {sortTimersBy: 'name', sortTimersDown: up === 'asc' ? 'desc' : 'asc'  }, page: 'Scheduled'}); } }>sort_by_alpha</FontIcon>
				<span> &nbsp; </span>
				<FontIcon className="material-icons" title="Sort by time" hoverColor={Styles.Colors.limeA400} color={sort === 'start' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/scheduled/', query: {sortTimersBy: 'nextToAir', sortTimersDown: up === 'asc' ? 'desc' : 'asc'  }, page: 'Scheduled'}); } } >access_time</FontIcon>
				<span> &nbsp; </span>
				<FontIcon className="material-icons" title="View Season Passes" hoverColor={Styles.Colors.limeA400} color={ 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/season-passes/', query: {sortSeriesBy: this.props.location.query.sortTimersBy}, page: 'Season Passes '}); } } >dvr</FontIcon>
			</div>
			{this.state.selected.length > 0 ? deletes : <span />}
			<div className="col-xs-12"  style={{ height: this.props.window.height - h, overflow: 'auto' }}>
				{menu}
			</div>
		</div>);
	}
	
	deleteTimers = ( timers = [], selected = [] ) => {
		Gab.emit('confirm open', {
			title: 'Cancel Timers',
			html: "Do you want to remove " + selected.length + " scheduled timers?",
			answer: ( yesno ) => { 
				if ( yesno) {
					Gab.emit('confirm open', { 
						style: { backgroundColor: Styles.Colors.red300 },
						title: 'This is Permanent',
						open: true,
						html: "Are you positive? This will permanently remove " + selected.length + " scheduled timers",
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
			yesText: ' DELETE Timer', 
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

Timers.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Timers ###',  params);
	return {}
}
