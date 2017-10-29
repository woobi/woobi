import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import { sortBy, filter as Filter, find as Find } from 'lodash';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText, DropDownMenu, FlatButton, FontIcon, IconButton, IconMenu, LinearProgress, MenuItem, Toggle, Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import RenderScheduled from './components/scheduled.js';

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
		let component = (
			<Table 
				fields={fields} 
				list={ Object.keys( obj ).map( ( keyName, i ) => {
						return ({ key: keyName, value: obj[keyName] })
					}) 
				} 
				tableProps= {{
					fixedHeader: true,
					fixedFooter: false,
					selectable: false,
					multiSelectable: false,
					height: false,
				}}
			/>
		);
		Gab.emit('dialog open', {
			title:" Series Information",
			component,
			open: true,
			close: true			
		});	
	}
	
	render ( ) { 
		debug('## render  ##  Series  render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><span style={{ color: 'white' }} children="Preparing Series Data" /><br /><LinearProgress mode="indeterminate" /></div>;
		let sort = this.props.location.query.sortSeriesBy || 'show';
		if ( sort === 'nextToAir' ) sort = 'start';
		if (this.props.series) {
			
			ret = sortBy( this.props.series, [ sort ] ).map( ( obj, i ) => {
				let c = obj;
				let time = moment.unix( c.start ).format( "LLLL ");
				let list = Filter( this.props.timers, ( t ) => ( t.name == obj.showName ) );
				let innerList = (<div>
					<h5 style={{ padding: 0, margin: '10 0 10 0' }} >Scheduled Recordings</h5>
					<RenderScheduled  fixedHeader={true} fixedFooter={false} program={{ title: c.showName }} list={list} channels={this.props.channels} onRowSelection={( i ) => {
							let programId = list[i].programId;
							let channel = Find( this.props.channels, (v) => ( v.channelId == list[i].channelId ));
							//debug(programId, list[i])
							if( channel ) this.props.goTo({ path: '/tv/channel/' + channel.channel + '/' + programId, page: 'Program Info' } );
					}} /> 
					
				</div>);
				return (
					<div className="col-sm-12 col-md-6"  style={{ marginBottom: 10 }}  key={c.id}>
						
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
								{innerList}
								
								<FlatButton onClick={()=>(this.renderSchedule( c ))} label="Key/Value Pairs" title="View stored information key/value pairs" />
							</CardText>

						</Card>
					</div>
				);
			});
			
			
			return (<div style={{ padding: '0 0px' }}>
				<div style={{ position: 'absolute', top: 15, right: 0, width: 200, height: 50 }}>
					
					<FontIcon className="material-icons" title="Sort by Name" hoverColor={Styles.Colors.limeA400} color={sort === 'show' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/season-passes/', query: {sortSeriesBy: 'show'}, page: 'Season Passes'}); } }>sort_by_alpha</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" title="Sort by time" hoverColor={Styles.Colors.limeA400} color={sort === 'start' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/season-passes/', query: {sortSeriesBy: 'nextToAir'}, page: 'Season Passes'}); } } >access_time</FontIcon>
					<span> &nbsp; </span>
					<FontIcon className="material-icons" title="View Scheduled" hoverColor={Styles.Colors.limeA400} color={'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/scheduled/', query: {sortTimersBy: this.props.location.query.sortSeriesBy}, page: 'Scheduled'}) } } >dvr</FontIcon>
					<span> &nbsp; </span>
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
