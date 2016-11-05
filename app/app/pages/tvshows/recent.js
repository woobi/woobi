import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';

let debug = Debug('lodge:app:pages:tvshows:recent');

export default class RecentEpisodes extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		if(props.initialData) {
			debug('got props initialData');
			shows = props.initialData.recentshows || [];
			this._skipMount = true;
		}
		this.displayName = 'RecentEpisodes';
		this.state = {
			loading: true,
			shows,
		};
		
		this._update = true;
		
		this.gotShows = this.gotShows.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  RecentEpisodes',  this.props, this.state);
		if(this.state.shows.length === 0) {
			this.getShows();
		}
		this.props.Sockets.io.on('recentshows', this.gotShows);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('recentshows', this.gotShows);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## RecentEpisodes got props', props);
		//this.getChannels();
	}	
	
	shouldComponentUpdate() {
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShows() {
		this.props.Request({
			action: 'recentshows'
		})
		.then(this.gotShows)
		.catch(error => {
			debug('ERROR from RecentEpisodes', error)
		});
	}
	
	gotShows(data) {
		this._update = true;
		this.setState({
			shows: data.recentshows,
		});
	}
	
	render() { 
		debug('## render  ##  RecentEpisodes Home render', this.props, this.state);
		let ret = <span >Loading Recent Episodes</span>;
		if (this.state.shows.length > -1) {
			ret =  this.state.shows.map((c, i) => {
				let art = 'initial';
				let banner = 'initial';
				let bgSize = 'cover';
				if(c.art) {
					var asset = Find(c.art, { type: 'fanart' });
					if(asset && this.props.tvImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')no-repeat left top";
					var asset2 = Find(c.art, { type: 'banner' });
					if(asset2 && this.props.tvBanners) banner = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "')no-repeat left top";
				}
				return (<div  className="col-xs-12 col-sm-6 col-md-4" style={{ padding: 10, cursor: 'pointer', height: 150, background: art, backgroundSize: 'cover'}}  onClick={(e) => {
						e.preventDefault();
						this.props.goTo({
							page: c.name,
							path: '/library/tv/episode/' + c.idShow + '/' + c.episodeID
						});
					}} > 
					<Card zDepth={1}  style={{ opacity: '.85' }}>
						<CardHeader
							title={banner === 'initial' ? c.name : ''}
							avatar7={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
							style={{ height: 60, background: banner, backgroundSize: bgSize }}
						/>
					</Card>
				</div>)
			});
		}
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 0px' }}>
				<Card   zDepth={1}>
					<CardHeader
						style={{ overflow: 'hidden' }}
						title={<span>Recent Episodes</span>}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

RecentEpisodes.getInitialData = function(params) {
	
	let ret = {
		recentshows: {
			action: 'recentshows'
		}
	}
	console.log('### RUN getInitialData RecentShows ###',  params);
	return ret
}
