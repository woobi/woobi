import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import { sortBy } from 'lodash';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu, LinearProgress, MenuItem, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('woobi:app:pages:epg:series');

export default class Series extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Series';
		this.state = {};
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Series',  this.props);
	}
	
	componentWillUnmount ( ) {
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Series got props', props);
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
		debug('## render  ##  Series  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Series Data" /><br /><LinearProgress mode="indeterminate" /></div>;
		let sort = this.props.location.query.sortSeriesBy || 'show';
		if ( sort === 'nextToAir' ) sort = 'start';
		if (this.props.series) {
			
			ret = sortBy( this.props.series, [ sort ] ).map( ( obj, i ) => {
				let c = obj;
				let time = moment.unix( c.start ).format( "h:mm a ");
				return (<div className="col-sm-12 col-md-6"  style={{ marginBottom: 5 }}  key={c.id}>
					
					<Card expanded={this.state.expanded} onExpandChange={() => {
						//const s = moment.utc().unix();
						//const f = moment.utc().add(1, 'days').unix();
						//this.getEntries( c.id, s, f );
					}}>
						<CardHeader
							title={c.name}
							subtitle={c.runType === '1' ? 'New Episodes   |   ' + time : 'All Episodes   |   ' + time }
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
					<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'show' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/series/', query: {sortSeriesBy: 'show'}, page: 'Series by name'}); } }>sort_by_alpha</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={sort === 'start' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/series/', query: {sortSeriesBy: 'nextToAir'}, page: 'Series by next to air'}); } } >access_time</FontIcon>
				</div>
				{ret}
				</div>
			);
		}
		
		return (<div style={{ padding: '0 0px' }}>
			{ret}
		</div>);
	}
	
}

Series.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Series ###',  params);
	return {}
}
