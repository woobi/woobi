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
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Timers',  this.props);
	}
	
	componentWillUnmount ( ) {
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Timers got props', props);
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
		let sort = this.props.location.query.sortTimersBy || 'start';
		if ( sort === 'nextToAir' ) sort = 'start';
		if (this.props.timers) {
			
			ret =  sortBy( this.props.timers, [ sort ] ).map( ( obj, i ) => {
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
			return (<div style={{ padding: '0 0px' }}>
				<div style={{ position: 'absolute', top: 15, right: 0, width: 100, height: 50 }}>
					<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'name' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/timers/', query: {sortTimersBy: 'name'}, page: 'Timers by name'}); } }>sort_by_alpha</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'start' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/timers/', query: {sortTimersBy: 'nextToAir'}, page: 'Timers by next to air'}); } } >access_time</FontIcon>
				</div>
				{ret}
			</div>);
			
		}
		return (<div style={{ padding: '0 0px' }}>
			{ret}
		</div>);
	}
	
}

Timers.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Timers ###',  params);
	return {}
}
