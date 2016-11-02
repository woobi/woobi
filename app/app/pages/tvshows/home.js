import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';

let debug = Debug('lodge:app:pages:tvshows:home');

export default class TVShows extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		if(props.initialData) {
			debug('got props initialData');
			shows = props.initialData.shows.tvshows || [];
			this._skipMount = true;
		}
		this.displayName = 'TVShows';
		this.state = {
			loading: true,
			shows,
		};
		
		this._update = true;
		
		this.gotShows = this.gotShows.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  TVShows',  this.props, this.state);
		if(this.state.shows.length === 0) {
			this.getShows();
		}
		this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## TVShows got props', props);
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
			action: 'tvshows'
		})
		.then(this.gotShows)
		.catch(error => {
			debug('ERROR from TVShows', error)
		});
	}
	
	gotShows(data) {
		this._update = true;
		this.setState({
			shows: data.tvshows,
		});
	}
	
	render() { 
		debug('## render  ##  TV Shows Home render', this.props, this.state);
		let ret = <span >Loading TVShows</span>;
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
							path: '/library/tv/' + c.imdb
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
						title={<span>TV Shows</span>}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

TVShows.getInitialData = function(params) {
	
	let ret = {
		shows: {
			action: 'tvshows'
		}
	}
	console.log('### RUN getInitialData TVShows ###',  params);
	return ret
}
