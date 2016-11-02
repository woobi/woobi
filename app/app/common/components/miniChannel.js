import React from 'react';
import Debug from 'debug';
import Gab from '../gab';
import { Card, CardActions, CardHeader, CardMedia, CardText, CardTitle, FlatButton, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn, Tabs, Tab } from 'material-ui';
import { Styles } from '../styles';
import moment from 'moment';
import { ColorMe, naturalSort } from '../utils';
import Video from './video5';
import VideoProgress from './videoProgress';
import { each as Each, map as Map, sortBy, isObject, find } from 'lodash';
import SwipeableViews from 'react-swipeable-views';
import CopyToClipboard from 'react-copy-to-clipboard';
import { find as Find } from 'lodash';

let debug = Debug('lodge:app:common:components:miniChannel');

export default class miniChannel extends React.Component {
	constructor(props) {
		super(props)
		
		let channel ={
			playing: {},
		};
		if(props.channel) { 
			channel = props.channel;			
		}	
		debug(channel)
		this.displayName = 'Home';
		this.state = {
			channel,
			slideIndex: 2,
		};
		
		this._update = true;
		this.doRequestCommand = this.doRequestCommand.bind(this);
		//this.gotChannels = this.gotChannels.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Home',  this.props);
		//this.props.Sockets.io.on('channels', this.gotChannels);
	}
	
	gotChannels(data) {
		//debug('### STATUS ###', data);
		var asset = _.find(data.channels, { channel: this.state.channel.channel });
		if(asset) {
			this._update = true;
			this.setState({
				channel: asset,
			});
		}
	}
	
	componentWillUnmount() {
		//this.props.Sockets.io.removeListener('channels', this.gotChannels);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  Channel ', props);
		if(props.channel) {
			if(props.channel.playing.name !== this.state.channel.playing.name) {
				this._update = true;
				this.setState({
					channel: props.channel
				});
				return 
			}
		}
		this._update = false;
	}	
	
	shouldComponentUpdate() {
		if(this._update === true) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	doRequestCommand(link) {
		Gab.emit('snackbar', {
			style: 'warning',
			html: 'Command in progress',
			open: true,
			onRequestClose: () => {}
		});
		Gab.rawRequest(link.link, false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: link.success || 'Command Success',
					open: true,
					onRequestClose: () => {}
				});
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: link.error || 'Command Failed',
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: link.error || 'Command Failed',
				open: true,
				onRequestClose: () => {}
			});
		});
	}
	
	handleChange(slideIndex) {
		this._update = true;
		this.setState({
			slideIndex,
		});
	}
	
	dialog(row, col) {
		let c = this.state.channel;
		let s = c.sources[row];
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
				{s.metadata.description}<br /> 
				<RaisedButton style={buttonStyleP} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play" onClick={(e) => {
					e.preventDefault();
					Gab.emit('dialog open', { open: false });
					Gab.emit('confirm open', {
						title: s.name +  "",
						answer:(yesno) => { 
							Gab.emit('confirm open', { open: false });
							if(yesno) {
								this.doRequestCommand({
									success: 'Program ' + s.name + ' pushed to front.',
									error: 'Failed to push program ' + s.name + '.',
									link: '/alvin/unshift/' + c.channel + '/index/' +  row	
								}); 
							}
							//Gab.emit('dialog open', { open: true });
						},
						open: true,
						noText: 'Cancel',
						yesText: 'Please Play', 
						html: 'This will stop the current stream and play <b>' + s.name + '</b>.  It could take a couple minutes for your stream to show the change.  Continue?'
					})
				}} />
				
				{history ? <span /> : <span><IconButton title="Remove this program from the source queue" style={buttonStyle} key="del" primary={true}  children={<FontIcon style={{ }} className="material-icons" color={Styles.Colors.orange600} hoverColor={Styles.Colors.redA400} >remove_from_queue</FontIcon>}
						onClick={(e) => {
							e.preventDefault();
							Gab.emit('dialog open', { open: false });
							Gab.emit('confirm open', {
								title: s.name +  "",
								answer:(yesno) => { 
									Gab.emit('confirm open', { open: false });
									if(yesno) {
										this.doRequestCommand({
											success: 'Source  ' + s.name + ' removed from queue.',
											error: 'Failed to remove source  ' + s.name + ' from queue.',
											link: '/alvin/shift/' + c.channel + '/index/' +  s.position
										}); 
									} else {
										Gab.emit('dialog open', { open: true });
									}
								},
								open: true,
								noText: 'Cancel',
								yesText: 'Yes, remove from queue',
								html: 'This will <b>REMOVE  </b>' + s.name + '.  Continue?'
							})
						}} 
					/>
					<IconButton title="Skip this Program" disabled={true} style={buttonStyle} key="skip"  secondary={true}  >
						<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blue600} >pause</FontIcon>
					</IconButton>
				</span>}												

			</div>),
			title: s.name +  "",
			answer:(yesno) => { 
				Gab.emit('dialog open', { open: false });
			},
			open: true,
			noText: 'Close'
		});
	}
	
	list(list, history = false) {
		let c = this.state.channel;
		
		let sourceMap = list.map((s, iii) => {
				return (<TableRow>
				<TableRowColumn style={{ width: 40 }}>{s.position}</TableRowColumn>
				<TableRowColumn style={{ cursor: 'pointer' }}>{s.name}</TableRowColumn>
			</TableRow>)
		});
		
		
		
		return (
			<CardText expandable={true}>		
				<Table
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
							<TableHeaderColumn style={{ width: 40 }}>#</TableHeaderColumn>
							<TableHeaderColumn>Name</TableHeaderColumn>
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
			</CardText>
		);
	}
	
	render() { 
		debug('## render  ##  Channel render', this.props, this.state);
		
		let c = this.state.channel;
		
		if(!c.commands) {
			return (<Card><div>Loading Channel {c.channel}</div> </Card>);
		}
		
		var links = [];
		
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
		
		if(c.links) {
			Each(c.links, (l,ii) => {
				if(ii == 'local' || ii == 'unicast') {
					links.push(
						<CopyToClipboard key={ii} text={l} onCopy={()=>{Gab.emit('snackbar',{ open: true, html: 'Link copied to clipboard.'});}}>
							<FlatButton label={ii} />
						</CopyToClipboard>
					);
				} else {
					l.forEach((li, il) => {
						links.push(
						<CopyToClipboard  key={ii + il} text={li} onCopy={()=>{Gab.emit('snackbar',{ open: true, html: 'Link copied to clipboard.'});}}>
							<FlatButton label={ii} />
						</CopyToClipboard>
					);
					});
				}
			});
		}
		
		// cycle through the commands first
		let buttons = c.commands.request.map((cc, i) => {
			return (<FlatButton key={cc.name+i} label={cc.label} onClick={()=>{
				Gab.emit('confirm open', {
					html:"If you switch between HD and SD feeds the channel may need to be restarted for HLS feeds to continue. You can switch back to the original feed type and a restart is not required. ",
					title:"Change to channel " + cc.name +  "?",
					answer:(yesno) => { 
						if (yesno === true) this.doRequestCommand(cc); 
						Gab.emit('confirm open', { open: false });
					},
					open: true,
					yesText: 'Change Channel',
					noText: 'Cancel'
				});
			}} />)
		});
		
		let newC = { name: 'RESTART', label: 'RESTART CHANNEL', link: '/alvin/restart/channel/' + c.channel, success: 'Channel ' + c.channel + ' restarting fresh. ', error: 'Could not restart ' + c.channel };
		let newC2 = { name: 'RESTART', label: 'RESTART CHANNEL', link: '/alvin/restart2/channel/' + c.channel, success: 'Channel ' + c.channel + ' restarting with current source list.', error: 'Could not restart ' + c.channel };
		let newStop = { name: 'KILL', label: 'REMOVE CHANNEL', link: '/alvin/kill/channel/' + c.channel, success: 'Channel ' + c.channel + ' stopping. ', error: 'Could not stop ' + c.channel };
		buttons.unshift(<FlatButton key={newStop.name} label={newStop.label} onClick={()=>{
			Gab.emit('dialog open', {
				title:"Remove Channel",
				answer:() => { 
					Gab.emit('dialog open', { open: false });
				},
				open: true,
				noText: 'Cancel',
				component: (<div>
					<p>This will stop the channel and remove it completely.  Continue?</p>
					<RaisedButton style={buttonStyleP} key="fresh"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Remove Channel" onClick={(e) => {
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('confirm open', {
							title:  "ATTENTION",
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									this.doRequestCommand(newStop); 
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Yes, REMOVE channel', 
							html: 'Are you sure you want to stop and remove this channel completely.  Continue?'
						})
					}} />
					<RaisedButton style={buttonStyle} key="clodes"  secondary={true}  label="Cancel" onClick={(e) => {
						e.preventDefault();						
						Gab.emit('dialog open', { open: false });
					}} />
				</div>)
			});
		}} />);
		buttons.unshift(<FlatButton key={newC.name} label={newC.label} onClick={()=>{
			Gab.emit('dialog open', {
				html:"Do you want to restart this channel?<br />Any HLS feeds will lose its saved stream.",
				title:"Restart Channel?",
				answer:() => { 
					Gab.emit('dialog open', { open: false });
				},
				open: true,
				noText: 'Cancel',
				component: (<div>
					<p>Do you want to restart this channel?<br />Any HLS feeds will lose its saved stream</p>
					<RaisedButton style={buttonStyleP} key="fresh"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Fresh State" onClick={(e) => {
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('confirm open', {
							title: newC.name +  "",
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									this.doRequestCommand(newC); 
								}else {
									Gab.emit('dialog open', { open: true });
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Restart Fresh', 
							html: 'This will stop the channel and start over with the initial options.  Continue?</b>'
						})
					}} />
					<RaisedButton style={buttonStyleP} key="save"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Save State" onClick={(e) => {
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('confirm open', {
							title: newC2.name +  "",
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									this.doRequestCommand(newC2); 
								}else {
									Gab.emit('dialog open', { open: true });
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Restart with Current State', 
							html: 'This will stop the channel and restart with the current source list.  Continue?</b>'
						})
					}} />
					<RaisedButton style={buttonStyle} key="clodes"  secondary={true}  label="Cancel" onClick={(e) => {
						e.preventDefault();						
						Gab.emit('dialog open', { open: false });
					}} />
				</div>)
			});
		}} />)
		
		const styles = {
			headline: {
				fontSize: 24,
				paddingTop: 16,
				marginBottom: 12,
				fontWeight: 400,
			},
			slide: {
				padding: 0,
			},
		};
		let art = '/images/fanart.jpg';
		let banner =  "url('/images/banner.jpg')no-repeat  center top";
		let bgSize = 'cover';
		if(c.playing.metadata.art) {
			var asset = Find(c.playing.metadata.art, { type: 'fanart' });
			if(asset) art = encodeURI(snowUI.artStringReplace(asset.url));
			var asset2 = Find(c.playing.metadata.art, { type: 'banner' });
			if(asset2) {
				banner = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "')no-repeat center 15%";
			} else if(asset) {
				banner = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')no-repeat center 15%";
				bgSize = '100%';
			}
		}
		
		let meta = {};
		Object.keys(c.playing.metadata).reverse().forEach(function(key) {
			meta[key] = c.playing.metadata[key];
		});
		
		let keys = Object.keys(meta);
		
		return (<div  className="col-xs-12 col-md-6" style={{paddingRight:5, paddingLeft:5, marginBottom: 15 }} >
				
			<Card zDepth={1}>
				<CardHeader
					style={{ overflow: 'hidden', background: banner, backgroundSize: bgSize }}
					subtitle={c.channel}
					title={<span>On Air: <b>{c.playing.name}</b></span>}
					avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor}  >dvr</FontIcon>}
					actAsExpander={true}
					showExpandableButton={true}
				/>
				<CardText expandable={true} style={{padding: 0}} >	
					<CardMedia style={{ background: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor }}>
						<div id="vid-box" style={{ position: 'relative', width: '100%' }} >
							<Video source={c.links.hls[0] || c.link} style={{ margin: 'auto'  }} poster={art}  mute={false} channel={c} doRequestCommand={this.doRequestCommand} />
						</div>
					</CardMedia>	
					 <Tabs
						onChange={this.handleChange}
						value={this.state.slideIndex}
					>
						<Tab label="Links" value={0} icon={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >link</FontIcon>} />
						<Tab label="Queue" value={1} icon={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >subscriptions</FontIcon>} />
						<Tab label="On Air" value={2} icon={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >airplay</FontIcon>} />
						<Tab label="Commands" value={3} icon={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >perm_data_setting</FontIcon>} />
						
						<Tab label="History" value={4} icon={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >track_changes</FontIcon>} />
					</Tabs>
					<SwipeableViews
						onChangeIndex={this.handleChange}
						index={this.state.slideIndex}
					>
						<div style={styles.slide}>
							<Card zDepth={0}>
								<CardText expandable={false}>
									{links }		
								</CardText>
							</Card>
						</div>
						
						<div style={styles.slide}>
							<Card zDepth={0}>							
								<CardHeader 
									subtitle={c.sources.length + ' sources  in queue'}
									title={<span>Up Next: {((c.sources.length > 1) ? c.sources[1].name : 'end')}</span>}
									actAsExpander={true}
									showExpandableButton={true}
								/>
								{this.list(c.sources)}
							</Card>
						</div>
						
						<div>
							<Card zDepth={0}>
								<CardHeader 
									subtitle={meta.description}
									title={<span><VideoProgress channel={c.channel} Sockets={this.props.Sockets} data={c.playing} /><br /><b>{c.playing.name}</b></span>}
									actAsExpander={true}
									showExpandableButton={true}
									
								/>
								<CardText expandable={true}>		
									
									<Table
										fixedHeader={false}
										selectable={true}
										multiSelectable={false}
										onCellClick={(row, col) => {
											Gab.emit('dialog open', {
												html: meta[keys[row]],
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
											deselectOnClickaway={false}
											showRowHover={true}
											stripedRows={false}
										>
										  
											{Map(meta, (s,k) => {
													return (<TableRow>
													<TableRowColumn>{k}</TableRowColumn>
													<TableRowColumn>{s ? s : 'UA'}</TableRowColumn>
												</TableRow>)
											})}
											
										</TableBody>
									</Table>
								</CardText>
							</Card>
						</div>
						
						<div style={styles.slide}>
							<Card zDepth={0}>
								<CardText expandable={false}>
									<CardActions>
										{buttons}
									</CardActions>
								</CardText>
							</Card>	

						</div>
						
						<div style={styles.slide}>
							<Card zDepth={0}>							
								<CardHeader 
									title={c.history.length + ' programs in history'}
									actAsExpander={true}
									showExpandableButton={true}
								/>
								{this.list(c.history, true)}
							</Card>
						</div>
					</SwipeableViews>	
				</CardText>	
			</Card>			
		</div>);
	}
	
}


miniChannel.getInitialData = function(params) {
	
	let ret = {
		channel: {
			action: 'channels',
			params
		}
	}
	console.log('### RUN getInitialData Channels HOME ###',  params);
	return ret
}
