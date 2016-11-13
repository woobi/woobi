import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardMedia, CardText, Checkbox, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn, Toggle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe, cleanFileName } from '../../common/utils';
import { find as Find } from 'lodash';
import VideoController from '../../common/components/videoController';
import Video from '../../common/components/video5';
import stringify from 'stringify-object';
import { StickyContainer, Sticky } from 'react-sticky';

let debug = Debug('woobi:app:pages:tvshows:show');

export default class Show extends React.Component {
	constructor(props) {
		super(props)
		
		let show = {};
		let channels = [];
		if(props.initialData) {
			if (props.initialData.show) {	
				show = props.initialData.show.show || {};
				channels = props.initialData.show.channels || [];
				this._skipMount = true;
			}
		}
		this.displayName = 'Show';
		let channel = false;
		let chanel = channels.find((c, i) => { 
			if ((c.channel ==  'movieChannel' && !this.props.params.recent) || (c.channel ==  'recentMovies' && this.props.params.recent)) {
				return true;	
			}
			return false
		});
		let play = false;
		if (chanel) {
			play = chanel.link;
			
		}
		this.state = {
			loading: true,
			show,
			channels,
			channel: chanel,
			play,
			episode: false,
			creating: false
		};
		
		this._autoPlay = false; 
		
		this.gotShow = this.gotShow.bind(this);
		this.createChannel = this.createChannel.bind(this);
		this.gotChannel = this.gotChannel.bind(this);
		this._update = true;		
		
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Show',  this.props);
		if(!this._skipMount) {
			this.getShow();
		}
		this._skipMount = false;
		//this.props.Sockets.io.on('tvshow:'+ this.state.show.imdb, this.gotShow);

	}
	
	componentWillUnmount() {
		//this.props.Sockets.io.removeListener('tvshow:' + this.state.show.imdb, this.gotShow);
		if(this.state.channel) {
			this.props.Sockets.io.on(this.state.channel.channel, this.gotChannel);
		}
		if(document) document.body.style.background = this.props.theme.baseTheme.palette.canvasColor;
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## TVShows got props', props);
		if(props.params.imdb !== this.state.show.imdb) { 
			this.getShow(props.params.imdb);
		}
	}	
	
	shouldComponentUpdate() {
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShow(imdb) {
		this.props.Request({
			action: 'tvshow',
			type: 'imdb',
			imdb: imdb || this.props.params.imdb
		})
		.then(this.gotShow)
		.catch(error => {
			debug('ERROR from TV Show', error)
		});
	}
	
	gotShow(data) {
		this._update = true;
		let channel = false;
		let chanel = data.channels.find((c, i) => { 
			if (c.channel ==  'tvShow@' + cleanFileName(data.show.title || '')) {
				return true;	
			}
			return false
		});
		let play = false;
		
		if (chanel) {
			play = chanel.link;
			// listen for updates
			this.props.Sockets.io.removeListener(chanel.channel, this.gotChannel);
			this.props.Sockets.io.on(chanel.channel, this.gotChannel);
		}
		this.setState({
			show: data.show,
			channels: data.channels,
			play,
			channel: chanel,
			creating: false
		});	
	}
	
	gotChannel(data) {
		debug('Got Channel update', data);
		if (typeof data === 'object') {
			this._update = true;
			this.setState({
				channel: data.channel,
			});
		}
	}
	
	pushToChannel(channel, show) {
		Gab.emit('dialog2', { open: false });
		let name = cleanFileName(show.name);
		let config = {
			name,
			file: show.file,
			progress: true,
			metadata: show
		}
		Gab.rawRequest('/alvin/unshift/' + channel.channel + '/file/' + encodeURIComponent(JSON.stringify(config)), false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: data.message,
					open: true,
					autoHideDuration: 5000,
					onRequestClose: () => {}
				});
				this._update = true;
				this.setState({
					play: channel.link
				});				
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
		
	createChannel(useShow) {
		let show = this.state.show;
		debug('Create channel', show);
		let autostart = 'no';
		let keep = 'no';
		let start = 'yes';
		let end = [];
		let bit = useShow ? false : true;
		let check = useShow || {};
		let files = show.episodes.filter(s => {
			if (s.name === check.name) {
				bit = true;
			}
			if (!bit) {
				end.push(s);
				return false;
			}
			return true;
		}).map(s => {
			return { name: s.name, file: s.file, progress: true }
		});
		files = files.concat(end);
		let name = cleanFileName('tvShow@' + show.name);
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
			//Gab.emit('snackbar', { open: false });
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
					this.setState({ creating: true, episode: false });
					this.props.Sockets.io.once(name + ':hls', (state) => {
						debug('hls ready', state);
						this._autoPlay = true;
						this.getShow(this.props.params.imdb);
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
	
	dialog(row, col) {
		let c = this.state.show;
		let s = c.episodes[row];
		debug(s);
		const buttonStyle = {
			margin: '30 0 0 12',
			borderRadius: 0,
			float: 'right',
		};
		const buttonStyleP = {
			margin: '30 12 0 0',
			borderRadius: 0,
			float: 'left',
			color: 'white',
		};
		Gab.emit('dialog open', {
			component: (<div>
				
				
				<b>Season {s.season} Episode {s.episode}</b><br />
				<p>{s.description}</p> 
				<p><br />{s.filename}</p>
				{!this.state.channel ? <span /> : <RaisedButton style={buttonStyleP} key="play"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play" onClick={e => {
						Gab.emit('dialog', { open: false });
						this.pushToChannel(this.state.channel, s);	
				}} />}
				{this.state.channel ? <span /> : <RaisedButton style={buttonStyleP} key="play"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play" onClick={e => {
						Gab.emit('dialog', { open: false });
						this._update = true;
						this._autoPlay = true;
						this.setState({
							play: encodeURI(snowUI.videoStringReplace(s.file)),
							episode: s,
						});	
				}} />}
				{!this.state.channels ? <span /> : <RaisedButton style={buttonStyleP} key="addto"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Push" onClick={e => {
						Gab.emit('dialog', { open: false });
						Gab.emit('dialog2', {
							title: s.name +  "",
							answer:(yesno) => { 
								Gab.emit('dialog2', { open: false });
								if(yesno) {
									
								} else {
									Gab.emit('dialog', { open: true });
								}
							},
							open: true,
							closeText: 'Cancel',
							component: (<div>
								<p>Play this video on a channel now.  The current program will be stopped and played after.</p>
								{this.state.channels.map(chan => {
									return (<RaisedButton style={{ margin: '10 10 0 0',	borderRadius: 0 }} key={chan.channel}  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label={chan.channel} onClick={()=>{ this.pushToChannel(chan, s); }} />);
								})}
							</div>)
						});
				}} />}
				{this.state.channel ? <span /> : <RaisedButton style={buttonStyleP} key="create"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Channel" onClick={(e) => {
					e.preventDefault();
					Gab.emit('dialog', { open: false });
					Gab.emit('dialog2', {
						title: s.name +  "",
						answer:(yesno) => { 
							Gab.emit('dialog2', { open: false });
							if(yesno) {
								
							} else {
								Gab.emit('dialog', { open: true });
							}
						},
						open: true,
						closeText: false,
						component: (<div>
							<p>Some files can not be streamed directly.  You can create a channel to convert those files so they can be viewed everywhere.  This will create a HLS stream with encoding enabled, so Ffmpeg may use some CPU.</p>
							
							<RaisedButton style={buttonStyleP} key="play"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Create Channel"  onClick={() => {
								Gab.emit('dialog2', { open: false });
								Gab.emit('snackbar', {
									style: 'warning',
									html: "Creating channel.",
									open: true,
									onRequestClose: () => {}
								});
								this.createChannel(s);
								
							}} />
							
							<RaisedButton style={buttonStyle} key="clodes"  primary={true}  label="Cancel" onClick={(e) => {
								e.preventDefault();						
								Gab.emit('dialog2', { open: false });
								Gab.emit('dialog', { open: true });
							}} />
							<div className="clearfix" />
							
						</div>)
					})
				}} />}
				<RaisedButton style={buttonStyleP} key="info"  primary={true}  label="Info" onClick={(e) => {
					e.preventDefault();						
					this.props.goTo({
						page: s.name,
						path: '/library/tv/episode/' + s.idShow + '/' + s.episodeID
					});
				}} />
				<div className="clearfix" style={{ height: 20, width:1}} />
				
							
			</div>),
			title: s.name +  "",
			answer:(yesno) => { 
				Gab.emit('dialog', { open: false });
			},
			open: true,
			closeText: 'Close'
		});
	}
	
	fixAudio(s,e,t) {
		debug(s,e)
		this.setState({
			fixAudio: e
		});
	}
	
	list(list) {
		let c = this.state.show;
		let poster= '/images/fanart.jpg';
		
		let sourceMap = list.map((s, iii) => {
			if(s.thumb) {
				poster = s.thumb;
			}
			return (<TableRow style={{ background: this.props.theme.palette.canvasColor, opacity: '0.80', fontWeight: 'bold' }}>
				<TableRowColumn style={{ width: 100 }}>S{s.season}E{s.episode}</TableRowColumn>
				<TableRowColumn style={{ width: 64, paddingLeft: '0' }}><img src={poster} width="64" height="36"  /></TableRowColumn>
				<TableRowColumn style={{ cursor: 'pointer' }}>{s.name}</TableRowColumn>
			</TableRow>)
		});
		
		let art = '';
		let banner = 'initial';
		if(c.thumb) {
			art = "url('" + encodeURI(c.thumb) + "')   no-repeat center fixed " + this.props.theme.palette.canvasColor;
		
		} else if(c.art) {
			var asset = Find(c.art, { type: 'fanart' , media_type: 'tvshow' });
			if(asset) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')   no-repeat center fixed " + this.props.theme.palette.canvasColor;
		}
		
		if (!this._skipMount) {
			//document.body.style.backgroundColor = this.props.theme.pallete.canvasColor;
			document.body.style.background = art;
			document.body.style.backgroundSize = 'cover';
		}
		
		return (
				<Table
					style={{ background: 'transparent' }}
					fixedHeader={true}
					selectable={false}
					multiSelectable={true}
					onCellClick={this.dialog.bind(this)}
				>
					<TableHeader
						displaySelectAll={false}
						adjustForCheckbox={false}
						enableSelectAll={false}
					>
						<TableRow>
							<TableHeaderColumn style={{ width: 100 }}></TableHeaderColumn>
							<TableHeaderColumn></TableHeaderColumn>
						</TableRow>
					</TableHeader>
					<TableBody
						displayRowCheckbox={false}
						deselectOnClickaway={true}
						showRowHover={true}
						stripedRows={false}
						
					>
						{sourceMap}
					</TableBody>
				</Table>
		);
	}
	
	video() {
		if(this.state.play) {
			let art = '/images/fanart.gif';
			let bg;
			if(this.state.episode.thumb) {
				art = this.state.episode.thumb;
			} else if (this.state.episode.art) {
				var asset = Find(this.state.episode.art, { type: 'fanart', media_type: 'tvshow' });
				if(asset) art =  encodeURI(snowUI.artStringReplace(asset.url));
			} else if (this.state.channel) {
				var asset = Find(this.state.channel.playing.metadata.art, { type: 'fanart', media_type: 'tvshow'  });
				if(asset) art =  encodeURI(snowUI.artStringReplace(asset.url));
			}
			let source = this.state.play;
			if (!snowUI.serverRendered) {
				bg = document.body.style.background;
			}
			let play = this._autoPlay === true ? true : false;
			this._autoPlay = false;
			return (<Sticky style={{ width: '100%', position: 'relative', zIndex: 1100, textAlign: 'center'}} >
				{this.killChannelButton()}
				<Video  
					style={{ margin: 'auto'  }} 
					chromeless={false} 
					source={source} 
					mimeType="video/mp4"  
					width={384} 
					height={216} 
					mute={false} 
					controls={false} 
					autoPlay={play}
					listenTo={this.state.show.name + ":video"} 
					onPlay={() => { document.body.style.background = '#000'; }}
					onPause={() => { document.body.style.background = bg; }}
					onStop={() => { document.body.style.background = bg; }}
				 />
			</Sticky>);
		}
		return <span />;
	}
	
	nowPlaying() {
		let playing = this.state.episode ? this.state.episode.name :  this.state.channel ? this.state.channel.playing.name : false;
		if (!playing) {
			return <span />
		}
		return (<div style={{ width: '100%', height: 50, paddingTop: 15, fontWeight: 700, textAlign: 'center', color: ColorMe(10,this.props.theme.palette.accent1Color).color, background: ColorMe(20,this.props.theme.palette.accent1Color).bgcolor, opacity: '.85' }} >
			On Air: {playing}
		</div>);
	}
	
	render() { 
		debug('## render  ##  TV Show render', this.props, this.state);
		let ret = this.state.show.name ? this.list(this.state.show.episodes) : <Card ></Card>;
		let head = this.state.show.name ? this.state.show.name : 'Loading TV Show';
		
		//return <div>{ret}</div>;
		return (<StickyContainer style={{ padding: '0 0px' }}>
			<div style={{ padding: '0px 0px' }}>
				<Card   zDepth={1} style={{}} initiallyExpanded={this.state.play == ''} style={{ overflow: 'hidden', background: this.props.theme.palette.canvasColor, opacity: '.85' }}>
					<CardHeader 
						
						title={this.state.show.description}
						avatar={<FontIcon style={{fontSize:'42px', cursor: 'pointer'}} className="material-icons" onClick={(e) => {this.props.goTo({page: 'TV Shows', path: '/library/tv'})}} color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color} title={'Return to TV Shows'} >backspace</FontIcon>}
						actAsExpander={false}
						showExpandableButton={false}
					/>
					
				</Card>
				{this.nowPlaying()}
				{this.video()}
			</div>
			<div style={{ textAlign: 'center' }}>
				{this.state.channel ? <span /> : !this.state.creating ? this.createChannelButton() : <span />}
			</div>
			<div style={{ padding: '0 20px' }}>{ret}</div>
			<div className="clearfix" style={{ height: 50 }} />
		</StickyContainer>);
	}
	
	createChannelButton() {
		return (<RaisedButton 
			style={{ margin: '10 10 0 0',	borderRadius: 0 }} 
			key="create"  
			secondary={true} 
			buttonStyle={{ borderRadius: 0, color: 'white' }}  
			overlayStyle={{ borderRadius: 0 }}  
			label="Create Channel" 
			onClick={(e) => {
				e.preventDefault();
				Gab.emit('dialog2', {
					title: this.state.show.name +  "",
					answer:(yesno) => { 
						Gab.emit('dialog2', { open: false });
						if(yesno) {
							
						}
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
		return (<div style={{ width: '100%', height: 50, paddingTop: 7, fontWeight: 700, textAlign: 'center', color: ColorMe(10,this.props.theme.palette.accent1Color).color, background: ColorMe(30,this.props.theme.palette.accent1Color).bgcolor, opacity: '.95' }} >
			<VideoController 
				channel={this.state.channel} 
				source={this.state.play}
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
		</div>);
	}
	
}

Show.getInitialData = function(params) {
	
	let ret = {
		show: {
			action: 'tvshow',
			type: 'imdb',
			imdb: params.imdb
		}
	}
	console.log('### RUN getInitialData TV Show ###',  params);
	return ret
}
