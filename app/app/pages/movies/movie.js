import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe, Random, cleanFileName } from '../../common/utils';
import { map } from 'lodash';
import { find as Find } from 'lodash';
import VideoController from '../../common/components/videoController';
import Video from '../../common/components/video5';
import stringify from 'stringify-object';
import { StickyContainer, Sticky } from 'react-sticky';

let debug = Debug('woobi:app:pages:movies:movie');

export default class Show extends React.Component {
	constructor(props) {
		super(props)

		let show = {};
		let channels = [];
		if (props.initialData) {
			if (props.initialData.movie) {
				show = props.initialData.movie.show || {};
				channels = props.initialData.movie.channels || [];
				this._skipMount = true;
			}
		}
		this.displayName = 'Show Movie';
		let channel = channels.find((c, i) => { 
			if ((c.channel ==  'movieChannel' && !this.props.params.recent) || (c.channel ==  'recentMovies' && this.props.params.recent)) {
				return true;	
			}
			return false
		});
		let play = false;
		if (channel) {
			play = channel.link;
		}
		this.state = {
			loading: true,
			show,
			channels,
			channel,
			play,
		};
		
		this._autoPlay = false;
		this._update = true;
		
		this.gotShow = this.gotShow.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Show Movie',  this.props);
		if(!this._skipMount) {
			this.getShow();
		} else {
			this.getShow()
			.catch(e => {
				debug('Error with get movie', e);
			});
		}
		this._skipMount = false;
		this.props.Sockets.io.on('movie', this.gotShow);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('movie', this.gotShow);
		if (this.state.channel) {
			this.props.Sockets.io.removeListener(this.state.channel.channel, this.gotChannel);
		}
		document.body.style.background = this.props.theme.baseTheme.palette.canvasColor;
	}
	
	componentWillReceiveProps(props) {
		debug('##  ## Movie got props', this.state);
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
			action: 'movie',
			type: 'imdb',
			imdb: imdb || this.props.params.imdb
		})
		.then(this.gotShow)
		.catch(error => {
			debug('ERROR from Movie', error)
		});
	}
	
	gotShow(data) {
		let play = false;
		let channel = data.channels.find((c, i) => { 
			if (c.channel ==  'movie@' + cleanFileName(data.movie.title || '')) {
				return true;	
			}
			return false
		});
		if (channel) {
			play = channel.link;
			// listen for updates
			this.props.Sockets.io.removeListener(channel.channel, this.gotChannel);
			this.props.Sockets.io.on(channel.channel, this.gotChannel);
		}
		this._update = true;
		this.setState({
			show: data.movie,
			channels: data.channels,
			play,
			channel
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
		Gab.rawRequest(snowUI.api.uri + '/unshift/' + channel.channel + '/file/' + encodeURIComponent(JSON.stringify(config)), false)
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
		
	createChannel() {
		let show = this.state.show;
		debug('Create channel', show);
		let autostart = 'no';
		let keep = 'no';
		let start = 'yes';
		let file =  { name: show.name, file: show.file, progress: true, metadata: show };
		let name = cleanFileName('movie@' + show.name);
		let config = {
			name,
			file,
			loop: true,
			noTransition: true,
			hls: {
				hls: true,
				name,
				passthrough: false,
			}
		}
		Gab.rawRequest(snowUI.api.uri + '/new/channel/?config=' + encodeURIComponent(JSON.stringify(config)) + '&keep=' + keep + '&autostart=' + autostart + '&start=' + start, false)
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
					this.setState({ creating: true });
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
	
	list(list) {
		let c = this.state.show;
		let s = c;
		let lll = { ...list };
		delete lll.art;
		let sourceMap = map(lll, (s, k) => {
				return (<TableRow>
				<TableRowColumn key={k} style={{ width: 200 }}>{k}</TableRowColumn>
				<TableRowColumn key={k} style={{ cursor: 'pointer' }}>{s}</TableRowColumn>
			</TableRow>)
		});
		
		let art = '';
		if(c.art) {
			if (this.props.desktop === 'xs') {
				var asset = Find(c.art, { type: 'poster' });
			} else {
				var asset = Find(c.art, { type: 'fanart' });
			}
			if(asset) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')   50% top / 100% repeat-y fixed" + this.props.theme.palette.canvasColor;
			
			if (!this._skipMount) {
				debug(art, this._skipMount)
				document.body.style.background = art;
				//document.body.style.backgroundSize = 'cover';
			}
		}
		
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
	
		let keys = Object.keys(c);
		
		return (
			<CardText expandable={false}>		
				<Table
					style={{ background: 'transparent' }}
					fixedHeader={true}
					selectable={false}
					multiSelectable={true}
					onCellClick={(row, col) => {
						debug(row, col, s[keys[row]])
						Gab.emit('dialog open', {
							html: s[keys[row]],
							title: keys[row],
							answer:(yesno) => { 
								Gab.emit('dialog open', { open: false });
							},
							open: true,
							noText: 'Close'
						});
					}}
				>
					<TableBody
						displayRowCheckbox={false}
						deselectOnClickaway={true}
						showRowHover={true}
						stripedRows={false}
					>
						{sourceMap}
					</TableBody>
				</Table>
			</CardText>
		);
	}
	
	dialog() {
		let c = this.state.show;
		let s = c;
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
				<p>{s.filename}</p>
				{!this.state.channel ? <span /> : <RaisedButton style={buttonStyleP} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play" onClick={e => {
						Gab.emit('dialog', { open: false });
						this.pushToChannel(this.state.channel, s);	
				}} />}
				{this.state.channel ? <span /> : <RaisedButton style={buttonStyleP} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play" onClick={e => {
						Gab.emit('dialog', { open: false });
						this._update = true;
						this._autoPlay = true;
						this.setState({
							play: snowUI.videoStringReplace(s.file),
						});	
				}} />}
				{!this.state.channels ? <span /> : <RaisedButton style={buttonStyleP} key="addto"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Push" onClick={e => {
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
				{this.state.channel ? <span /> : <RaisedButton style={buttonStyleP} key="create"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Channel" onClick={(e) => {
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
							
							<RaisedButton style={buttonStyleP} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Create Channel"  onClick={() => {
								Gab.emit('dialog2', { open: false });
								Gab.emit('snackbar', {
									style: 'warning',
									html: "Creating channel.",
									open: true,
									onRequestClose: () => {}
								});
								this.setState({ creating: true });
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
	
	video() {
		if(this.state.play) {
			let art = '/images/fanart.gif';
			let bg;
			if(this.state.show.thumb) {
				art = this.state.show.thumb;
			} else if (this.state.show.art) {
				var asset = Find(this.state.show.art, { type: 'fanart', media_type: 'tvshow' });
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
					onPlay={() => { 
						document.body.style.background = '#000';
					}}
					onPause={() => { 
						document.body.style.background = bg;
						if (!this.state.channel) {
							this._update = true;
							this.setState({ play: false });
							Gab.emit('snackbar', {
								style: 'warning',
								html: "You can not pause a direct stream",
								open: true,
								autoHideDuration: 10000,
							});
						}
					}}
					onStop={() => { 
						document.body.style.background = bg;
						if (!this.state.channel) {
							this._update = true;
							this.setState({ play: false });
						}
					}}
				 />
			</Sticky>);
		}
		return <span />;
	}
	
	render() { 
		debug('## render  ##  Movie render', this.props, this.state);
		let ret = this.state.show.title ? this.list(this.state.show) : <Card ></Card>;
		let head = this.state.show.title ? this.state.show.title : 'Loading Movie';
		
		//return <div>{ret}</div>;
		return (<StickyContainer style={{ padding: '0 5px' }}>
			<div style={{ padding: '10px 5px' }}>
				<Card   zDepth={1}>
					<CardHeader
						style={{ overflow: 'hidden' }}
						title={this.state.show.description}
						avatar={<FontIcon style={{fontSize:'42px', cursor: 'pointer'}} className="material-icons" onClick={(e) => {this.props.goTo({page: 'Movies', path: '/library/movies'})}}  color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color} title={'Return to Movies'} >backspace</FontIcon>}
					/>
				</Card>
				{this.video()}
			</div>
			<div style={{ textAlign: 'center' }}>
				{this.state.channel ? <span /> : !this.state.play && !this.state.creating ? this.createChannelButton() : <span />}
			</div>
			<div style={{ padding: '0 20px' }}>{ret}</div>
			<div className="clearfix" />
		</StickyContainer>);
	}
	
	createChannelButton() {
		return (<RaisedButton 
			style={{ margin: '10 10 0 0',	borderRadius: 0 }} 
			key="play"  
			secondary={false} 
			buttonStyle={{ borderRadius: 0, color: 'white' }}  
			label="Play Options" 
			onClick={this.dialog.bind(this)} 
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
				pause={this.state.channel ? true : false}
				kill={this.state.channel ? true : false}
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
		movie: {
			action: 'movie',
			type: 'imdb',
			imdb: params.imdb
		}
	}
	console.log('### RUN getInitialData Movie ###',  params);
	return ret
}
