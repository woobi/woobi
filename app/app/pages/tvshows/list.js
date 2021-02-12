import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('woobi:app:pages:tvshows:home');

export default class Recent extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		if(props.initialData) {
			shows = props.initialData.shows || [];
			this._skipMount = true;
		}
		this.displayName = 'Recent';
		this.state = {
			loading: true,
			shows,
		};
		
		this.gotShows = this.gotShows.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  TVShows',  this.props);
		if(!this._skipMount) {
			this.getShows();
		}
		this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	gotShows(data) {
		this.setState({
			shows: data.tvshows,
		});
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## TVShows got props', props);
		this.getChannels();
	}	
	
	getShows() {
		this.props.Request({
			action: 'tvshows'
		})
		.then(data => {
			debug('### TVShows ###', data);
			this.setState({
				shows: data.tvshows
			});
		})
		.catch(error => {
			debug('ERROR from TVShows', error)
		});
	}
	
	render() { 
		//debug('## render  ##  Channels Home render', this.props, this.state);
		let ret = <span >Loading TVShows</span>;
		if (this.state.shows.length > -1) {
			ret =  this.state.shows.map((c, i) => {
				return (<div style={{ padding: 10 }} ><a href={"/noscript/library/tv/" + c.imdb} onClick={(e) => {
					e.preventDefault();
					this.props.goTo({
						page: c.name,
						path: '/library/tv/' + c.imdb
					});
				}} >{c.name}</a></div>)
			});
		}
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 5px' }}>
				<Card   zDepth={1}>
					<CardHeader
						title={<span>TV Shows</span>}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

Recent.getInitialData = function(params) {
	
	let ret = {
		shows: {
			action: 'tvshows'
		}
	}
	console.log('### RUN getInitialData TVShows ###',  params);
	return ret
}
