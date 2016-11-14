import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon, IconButton} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';

let debug = Debug('woobi:app:pages:tvshows:home');

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
			tvImages: props.tvImages
		};
		
		this.buttonStyle = { margin: '0 auto', width: false, height: false, padding: 0};
		
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
		if (props.tvImages !== this.state.tvImages) {
			this._update = true;
			this.setState({
				tvImages: props.tvImages
			});
		}
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
	
	fanartButton() {
		return (<IconButton title="Fanart View" style={{ zIndex: 1101, margin: '0 auto', width: false, height: false, padding: 0, position: 'fixed', top: 15, right: 10 }} key="fanart"  secondary={true} onClick={(e) => { this.props.appState({ tvImages: true }) }} >
			<FontIcon style={{ }} className="material-icons" color={this.state.tvImages ? Styles.Colors.lightGreenA700 : Styles.Colors.blue600}  >view_stream</FontIcon>
		</IconButton>);
	}
	
	posterButton() {
		return (<IconButton title="Poster View" style={{ zIndex: 1101, margin: '0 auto', width: false, height: false, padding: 0, position: 'fixed', top: 15, right: 40 }} key="view"  secondary={true} onClick={(e) => { this.props.appState({ tvImages: false }) }} >
			<FontIcon style={{ }} className="material-icons" color={!this.state.tvImages ? Styles.Colors.lightGreenA700 : Styles.Colors.blue600}  >view_column</FontIcon>
		</IconButton>);
	}
	
	render() { 
		debug('## render  ##  TV Shows Home render', this.props, this.state);
		let ret = <span >Loading TVShows</span>;
		if (this.state.shows.length > -1) {
			ret =  this.state.shows.map((c, i) => {
				let art = 'transparent';
				let banner = 'initial';
				let bgSize = 'cover';
				if(c.art) {
					var asset = Find(c.art, { type: 'fanart' });
					if(asset && this.state.tvImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')left top / 100% no-repeat fixed";
					var asset2 = Find(c.art, { type: 'poster' });
					if(asset2 && !this.state.tvImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "')  no-repeat right top";
				}
				return (<div  className={this.state.tvImages ? "col-xs-12 col-sm-6 col-md-4" : "col-xs-6 col-sm-3 col-md-2"} style={{ padding: 0 }} >
					<div style={{ margin: 0, cursor: 'pointer', height: !this.state.tvImages ? 285 : 200, background: art, backgroundSize: 'cover'}}  onClick={(e) => {
						e.preventDefault();
						this.props.goTo({
							page: c.name,
							path: '/library/tv/' + c.imdb
						});
					}} > 
						<Card zDepth={1}  style={{ opacity: this.state.tvImages ? '.75' : '0' }}>
							<CardHeader
								title={this.state.tvImages ? c.name : ''}
								style={{ height: 40 }}
							/>
						</Card>
					</div>
				</div>)
			});
		}
		let sub = (<div>
			{this.fanartButton()}
			{this.posterButton()}
		</div>);
		return (<div style={{ padding: '0 0px' }}>
			<div style={{ padding: '0px 0px' }}>
				<Card   zDepth={2}>
					<CardHeader
						style={{ overflow: 'hidden', position: 'relative' }}
						title={sub}
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
