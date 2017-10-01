import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import { sortBy } from 'lodash';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu, LinearProgress, MenuItem, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('woobi:app:pages:epg:channels');

export default class Timers extends React.Component {
	constructor(props) {
		super(props)
		
		this.displayName = 'Timers';
		this.state = {};
		
		this.getTimers = this.getTimers.bind(this);
		
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Timers',  this.props);
		this.getTimers();
		//this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	componentWillUnmount ( ) {
		//this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Timers got props', props);
		/*if (props.channels.length !== this.state.channels.length) {
			this.setState({
				channels: props.channels
			});
		}*/
		this._update = true;
	}	
	
	shouldComponentUpdate ( ) {
		debug('should series update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getTimers ( ) {
		this.props.Request({
			action: 'getTimers'
		})
		.then(data => {
			debug('### series data ###', data);
			this._update = true;
			this.setState({
				timers: data.timers
			});
		})
		.catch(error => {
			debug('ERROR from getSeriesTimers', error)
		});
	}
	
	handleExpandChange = ( expanded ) => {
		this.setState({expanded: expanded});
	};
	
	renderSchedule ( obj ) {
		let fields = [
			{ 
				field: 'key',
				label: 'Key' , 
			},
			{ 
				field: 'value',
				label: 'Value' , 
			},
		];
		return (<Table fields={fields} list={ Object.keys( obj ).map( ( keyName, i ) => {
			return ({ key: keyName, value: obj[keyName] })
		}) } />)
			
	}
	
	render ( ) { 
		debug('## render  ##  Timers  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Timer Data" /><br /><LinearProgress mode="indeterminate" /></div>;
		let sort = this.props.location.query.sortBy || 'start';
		if ( sort === 'nextToAir' ) sort = 'start';
		if (this.state.timers) {
			
			ret =  sortBy( this.state.timers, [ sort ] ).map( ( obj, i ) => {
				let c = obj;
				return (<div className="col-sm-12 col-md-6"  style={{ marginBottom: 5 }} key={c.id}>
					<Card expanded={this.state.expanded} onExpandChange={() => {}}>
						<CardHeader
							title={c.name}
							subtitle={moment.unix(c.startTime).format("h:mm a - ") + moment.unix(c.endTime).format("h:mm a ") + moment.unix(c.startTime).format(" dddd, MMM Do YYYY")}
							//avatar={c.logo}
							actAsExpander={true}
							showExpandableButton={true}
						/>						
						<CardText expandable={true}>
							{this.renderSchedule( c )}
						</CardText>
					</Card>
				</div>);
			});
			
		}
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 0px' }}>
			<div style={{ padding: '10px 15px' }}>
				<Toolbar>
					<ToolbarGroup firstChild={true}>
						
						<ToolbarTitle text="Timers" style={{ paddingLeft: 5 }} />
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarSeparator />
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'show' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/livetv/timers/', query: {sortBy: 'name'}, page: 'name'}); } }>sort_by_alpha</FontIcon>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'start' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/livetv/timers/', query: {sortBy: 'nextToAir'}, page: 'next to air'}); } } >access_time</FontIcon>
						<ToolbarSeparator />
         
					</ToolbarGroup>
				</Toolbar>
			</div>
			{ret}
		</div>);
	}
	
}

Timers.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Timers ###',  params);
	return {}
}
