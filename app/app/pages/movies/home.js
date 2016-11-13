import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon, IconButton, RaisedButton} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';
import VideoController from '../../common/components/videoController';
import Video from '../../common/components/video5';
import { StickyContainer, Sticky } from 'react-sticky';

let debug = Debug('lodge:app:pages:movies:movies');

export default class Movies extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		let channels = [];
		if(props.initialData) {
			shows = props.initialData.movies.movies || [];
			channels = props.initialData.movies.channels || [];
			this._skipMount = true;
		}
		let channel = false;
		let chanel = channels.find((c, i) => { 
			if ((c.channel ==  'movieChannel' && !props.params.recent) || (c.channel ==  'recentMovies' && props.params.recent)) {
				return true;	
			}
			return false
		});
		let play = false;
		if (chanel) {
			play = chanel.link;
		}
		this.displayName = 'Movies';
		this.state = {
			loading: true,
			shows,
			channels,
			channel: chanel,
			play,
			movieImages: props.movieImages
		};
		
		this.buttonStyle = { margin: '0 auto',  width: false, height: false, padding: 0};
		
		this._update = true;
		
		this.gotShows = this.gotShows.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Movies',  this.props, this.state);
		if(this.state.shows.length === 0) {
			this.getShows(this.props.params.recent);
		}
		this.props.Sockets.io.on('movies', this.gotShows);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('movies', this.gotShows);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## Movies got props', props);
		//this.getChannels();
		//this._update = true;
		if (props.params.recent !== this.props.params.recent) {
			this.getShows(props.params.recent);
		}
		if (props.movieImages !== this.state.movieImages) {
			this._update = true;
			this.setState({
				movieImages: props.movieImages
			});
		}
	}	
	
	shouldComponentUpdate() {
		debug('should movies update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShows(recent) {
		this.props.Request({
			action: recent ? 'recentmovies' : 'movies',
			limit: 50,
		})
		.then(this.gotShows)
		.catch(error => {
			debug('ERROR from Movies', error)
		});
	}
	
	gotShows(data) {
		this._update = true;
		let channel = false;
		let chanel = data.channels.find((c, i) => { 
			if ((c.channel ==  'movieChannel' && !this.props.params.recent) || (c.channel ==  'recentMovies' && this.props.params.recent)) {
				return true;	
			}
			return false
		});
		debug('got channels', data.channels, chanel);
		let play = false;
		
		if (chanel) {
			play = chanel.link;
		}
		this.setState({
			shows: data.movies,
			channels: data.channels,
			play,
			channel: chanel,
			creating: false
		});
	}
	
	createChannel() {
		debug('Create channel');
		let autostart = 'no';
		let keep = 'no';
		let start = 'yes';
		let files = this.state.shows.map(s => {
			return { name: s.name, file: s.file, progress: true }
		});
		let name = this.props.params.recent ? 'recentMovies' : ('movieChannel');
		let config = {
			name,
			files,
			loop: true,
			noTransition: true,
			hls: {
				hls: true,
				name,
				passthrough: false,
			}
		}
		Gab.rawRequest('/alvin/new/channel/?config=' + encodeURIComponent(JSON.stringify(config)) + '&keep=' + keep + '&autostart=' + autostart + '&start=' + start, false)
		.then(data => {			
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: "Channel will start playing in about 20 seconds",
					open: true,
					autoHideDuration: 20000,
					onRequestClose: () => {}
				});
				debug('New Channel', data);
				if (data.link) {
					debug('Play Video', data.link);
					this._update = true;
					this.setState({ creating: true });
					this.props.Sockets.io.once(name + ':hls', (state) => {
						debug('hls ready', state);
						this.getShows();
					});
				}
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
			
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: e,
				open: true,
				onRequestClose: () => {}
			});
			Gab.emit('dialog2 open', { open: false });
		});
	}
	
	createChannelButton() {
		return (<RaisedButton 
			style={{ margin: '5 10 0 0',	borderRadius: 0 }} 
			key="create"  
			secondary={true} 
			buttonStyle={{ borderRadius: 0, color: 'white' }}  
			overlayStyle={{ borderRadius: 0 }}  
			label="Create Channel" 
			onClick={(e) => {
				e.preventDefault();
				Gab.emit('dialog2', {
					title: "Movie Channel",
					answer:(yesno) => { 
						Gab.emit('dialog2', { open: false });
					},
					open: true,
					noText: 'Cancel',
					component: (<div>
						<p>This will create a HLS stream with encoding enabled, so Ffmpeg may use some CPU.</p>
						
						<RaisedButton style={{ margin: '10 10 0 0',	borderRadius: 0 }} key="play"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Create Channel"  onClick={() => {
							Gab.emit('dialog2', { open: false });
							Gab.emit('snackbar', {
								style: 'warning',
								html: "Creating channel.",
								open: true,
								onRequestClose: () => {}
							});
							this.createChannel();
							
						}} />
						
						<RaisedButton style={{ margin: '10 10 0 0',	borderRadius: 0 }} key="clodes"  primary={true}  label="Cancel" onClick={(e) => {
							e.preventDefault();						
							Gab.emit('dialog2', { open: false });
						}} />
						<div className="clearfix" />
						
					</div>)
				})
			}} 
		/>);
	}
	
	killChannelButton() {
		return (
			<VideoController 
				channel={this.state.channel} 
				style={{
					display: 'inline-block',
				}}
				kill={true}
				onKill={() => {
					this._update = true;
					this.setState({
						play: false,
						channel: false
					});
				}}
				destroy={true}
			/>
		);
	}
	
	video() {
		if(this.state.play) {
			let art = "url('" + '/images/fanart.jpg' + "')no-repeat center 15%";
			let bg;
			if(this.state.channel) {
				if(this.state.channel.playing.metadata.art) {
					var asset = Find(this.state.channel.playing.metadata.art, { type: 'fanart' });
					if(asset) {
						art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')no-repeat center 15%";
					} 
				}
				
			}
			let source = this.state.play;
			if (!snowUI.serverRendered) {
				bg = document.body.style.background;
			}
			return (<Sticky style={{  zIndex: 1005, background: art, width: '100%', position: 'relative', overflow: 'hidden' }} >
				{this.nowPlaying()}
				<Video  
					style={{ margin: 'auto'  }} 
					chromeless={false} 
					source={source} 
					mimeType="video/mp4"  
					width={384} 
					height={216} 
					mute={false} 
					controls={false} 
					autoPlay={false}
					//onPlay={() => { document.body.style.background = '#000'; }}
					//onPause={() => { document.body.style.background = bg; }}
					//onStop={() => { document.body.style.background = bg; }}
				 />
			</Sticky>);
		}
		return <span />;
	}
	
	fanartButton() {
		return (<IconButton title="Fanart View" style={{ zIndex: 1100, margin: '0 auto', width: false, height: false, padding: 0, position: 'fixed', top: 15, right: 10 }} key="fanart"  secondary={true} onClick={(e) => { this.props.appState({ movieImages: true }) }} >
			<FontIcon style={{ }} className="material-icons" color={this.state.movieImages ? Styles.Colors.lightGreenA700 : Styles.Colors.blue600}  >view_module</FontIcon>
		</IconButton>);
	}
	
	posterButton() {
		return (<IconButton title="Poster View" style={{ zIndex: 1100, margin: '0 auto', width: false, height: false, padding: 0, position: 'fixed', top: 15, right: 40 }} key="view"  secondary={true} onClick={(e) => { this.props.appState({ movieImages: false }) }} >
			<FontIcon style={{ }} className="material-icons" color={!this.state.movieImages ? Styles.Colors.lightGreenA700 : Styles.Colors.blue600}  >view_column</FontIcon>
		</IconButton>);
	}
	
	nowPlaying() {
		if (!this.state.channel) {
			return <span />
		}
		return (<div style={{ width: '100%', height: 50, paddingTop: 7, fontWeight: 700, textAlign: 'center', color: ColorMe(10,this.props.theme.palette.accent1Color).color, background: ColorMe(30,this.props.theme.palette.accent1Color).bgcolor, opacity: '.95' }} >
			{this.killChannelButton()}
		</div>);
	}
	
	render() { 
		//debug('## render  ##  Channels Home render', this.props, this.state);
		let ret = <span >Loading Movies</span>;
		if (this.state.shows.length > -1) {
			ret =  this.state.shows.map((c, i) => {
				let art = 'initial';
				let banner = 'initial';
				let bgSize = 'cover';
				if(c.art) {
					var asset = Find(c.art, { type: 'fanart' });
					if(asset && this.state.movieImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "') left top / 100% repeat-y fixed";
					var asset2 = Find(c.art, { type: 'poster' });
					if(asset2 && !this.state.movieImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "') no-repeat right top";
				}
				return (<div  className={this.state.movieImages ? "col-xs-12 col-sm-6 col-md-4" : "col-xs-6 col-sm-3 col-md-2"} style={{ padding: 0 }} >
					<div style={{ margin: 0, cursor: 'pointer', height: !this.state.movieImages ? 275 : 200, background: art, backgroundSize: 'cover'}}  onClick={(e) => {
						e.preventDefault();
						this.props.goTo({
							page: c.name,
							path: '/library/movies/movie/' + c.imdb
						});
					}} > 
						<Card zDepth={1}  style={{ opacity: this.state.movieImages ? '.75' : '0' }}>
							<CardHeader
								title={this.state.movieImages ? c.name : ''}
								style={{ height: 40 }}
							/>
						</Card>
					</div>
				</div>)
			});
		}
		let sub = (<div>
			{this.state.channel ? (<span>On Air: {this.state.channel.playing.name}</span>)  : !this.state.creating ? this.createChannelButton() : <span />}
		</div>);
		let tit = (<div>
			{this.state.channel ? (<span>Up Next: {this.state.channel.sources[1].name}</span>)  : <span />}
		</div>);
		return (<StickyContainer style={{ padding: '0 0px' }}>
			<div style={{ padding: '0px 0px' }}>
				<Card   zDepth={2}>
					<CardHeader
						style={{  position: 'relative', overflow: 'hidden' }}
						title={sub}
						subtitle={tit}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >movie</FontIcon>}
					/>
				</Card>
				{this.fanartButton()}
				{this.posterButton()}
				
				{this.video()}
			</div>
			{ret}
			<div className="clearfix" />
		</StickyContainer>);
	}
	
}

Movies.getInitialData = function(params) {
	
	let ret = {
		movies: {
			action: params.recent ? 'recentmovies' : 'movies'
		}
	}
	console.log('### RUN getInitialData Movies ###',  params);
	return ret
}
