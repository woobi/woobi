import React from 'react';
import moment from 'moment';
import Debug from 'debug';
import Gab from '../../common/gab';
import Table from '../../common/components/table';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText , FlatButton, FontIcon, Toggle} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('woobi:app:pages:epg:channels');

export default class Series extends React.Component {
	constructor(props) {
		super(props)
		
		this.displayName = 'Series';
		this.state = {
			entries: {},
			series: []
		};
		
		this.getSeries = this.getSeries.bind(this);
		
	}
	
	componentDidMount ( ) {
		debug('######### componentDidMount  ##  Series',  this.props);
		this.getSeries();
		//this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	componentWillUnmount ( ) {
		//this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## Series got props', props);
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
	
	getSeries ( ) {
		this.props.Request({
			action: 'getSeriesTimers'
		})
		.then(data => {
			debug('### series data ###', data);
			this._update = true;
			this.setState({
				series: data.series
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
		debug('## render  ##  Series  render', this.props, this.state);
		let ret = <span >Loading Series</span>;
		if (this.state.series) {
			
			ret =  this.state.series.map( ( obj, i ) => {
				let c = obj;
				return (<div className="col-sm-12 col-md-6"  style={{ marginBottom: 5 }}>
					<Card expanded={this.state.expanded} onExpandChange={() => {
						//const s = moment.utc().unix();
						//const f = moment.utc().add(1, 'days').unix();
						//this.getEntries( c.id, s, f );
					}}>
						<CardHeader
							title={c.name}
							subtitle={c.runType === '1' ? 'New Episodes' : 'New and Repeat Episodes'}
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
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 5px' }}>
				<Card   zDepth={1}>
					<CardHeader
						title={<span>Series</span>}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

Series.getInitialData = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Series ###',  params);
	return {}
}
