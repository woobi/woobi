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
	
	componentWillUnmount() {
		//this.props.Sockets.io.removeListener('channels', this.gotChannels);
	}
	
	componentWillReceiveProps(props) {
		//debug('## componentWillReceiveProps  ##  Channel ', props);
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
	
	shouldComponentUpdate(nextProps) {
		if(this._update  || this.props.currentTheme !== nextProps.currentTheme) {
			this._update = false;
			return true;
		}
		return false;
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
					html: data.message || link.success || 'Command Success',
					open: true,
					onRequestClose: () => {}
				});
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error || link.error || 'Command Failed',
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: data.error ||  link.error || 'Command Failed',
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
	
	dialog(row, col, source) {
		let c = this.state.channel;
		let s = source[row];
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
	
	list(list) {
		let c = this.state.channel;
		
		let sourceMap = list.map((s, iii) => {
			let poster= '/images/fanart.gif';
			if(s.metadata.thumb) {
					poster = s.metadata.thumb;
			} else if (s.metadata.art) {
				var asset = Find(s.metadata.art, { type: 'fanart' });
				if(asset) poster =snowUI.artStringReplace(asset.url);
			}
			return (<TableRow key={iii}>
				<TableRowColumn style={{ width: 40 }}>{s.position}</TableRowColumn>
				<TableRowColumn style={{ width: 64, paddingLeft: '0' }}><img src={poster} width="64" height="36"  /></TableRowColumn>
				<TableRowColumn style={{ cursor: 'pointer' }}>{s.name}</TableRowColumn>
			</TableRow>)
		});
		
			
		
		return (
			<CardText expandable={true}>		
				<Table
					fixedHeader={true}
					selectable={false}
					multiSelectable={true}
					onCellClick={(a, b) => {
						this.dialog.call(this, a, b, list);
					}}
				>
					<TableHeader
						displaySelectAll={false}
						adjustForCheckbox={false}
						enableSelectAll={false}
					>
						<TableRow>
							<TableHeaderColumn style={{ width: 40 }}>#</TableHeaderColumn>
							<TableHeaderColumn style={{ width: 64 }}></TableHeaderColumn>
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
	
	buttons(c) {
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
		// cycle through the commands first
		return c.commands.request.map((cc, i) => {
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
		
		
	}	
		
	powerButtons(c) {
		let powerButtons = [];
		let newC = { name: 'RebootChannel', label: 'REBOOT CHANNEL', link: '/alvin/restart/channel/' + c.channel , success: 'Channel ' + c.channel + ' restarting fresh. ', error: 'Could not restart ' + c.channel };
		let newC2 = { name: 'ModifyChannel', label: 'MODIFY CHANNEL', link: '/alvin/restart/channel/' + c.channel + '?passthrough=no', success: 'Channel ' + c.channel + ' restarting with current source list.', error: 'Could not restart ' + c.channel };
		let newC3 = { name: 'ModifyChannel', label: 'MODIFY CHANNEL', link: '/alvin/restart/channel/' + c.channel + '?passthrough=yes', success: 'Channel ' + c.channel + ' restarting with current source list.', error: 'Could not restart ' + c.channel, onSuccess: () => {} };
		let newStop = { name: 'KILL', label: 'REMOVE CHANNEL', link: '/alvin/kill/channel/' + c.channel, success: 'Channel ' + c.channel + ' stopping. ', error: 'Could not stop ' + c.channel };
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
		powerButtons.unshift(<IconButton key={newStop.name} label={newStop.label} title={newStop.label} onClick={()=>{
			Gab.emit('dialog open', {
				title:"Remove Channel",
				answer:() => { 
					Gab.emit('dialog open', { open: false });
				},
				open: true,
				noText: 'Cancel',
				component: (<div>
					<p>This will stop the channel and remove it completely.  Continue?</p>
					<RaisedButton style={buttonStyleP} key="freshf"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Remove Channel" onClick={(e) => {
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
		}} >
			<FontIcon style={{ }} className="material-icons"  hoverColor={Styles.Colors.red900} color={Styles.Colors.deepOrange900} >visibility_off</FontIcon>
		</IconButton>);
		powerButtons.unshift(<IconButton key={newC.name} label={newC.label}  title={newC.label}  onClick={()=>{
			Gab.emit('dialog open', {
				title:"Reboot Channel?",
				answer:() => { 
					Gab.emit('dialog open', { open: false });
				},
				open: true,
				noText: 'Cancel',
				component: (<div>
					<p>Do you want to reboot this channel?<br />All feeds will be lost and start over.</p><p>  If you are having issues with audio or video you can try rebooting with transcoding enabled.</p>
					<RaisedButton style={buttonStyleP} key="fresh"  secondary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Reboot Channel" onClick={(e) => {
						
						
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('dialog2 open', {
							title: newC.label +  "",
							open: true,
							answer:(yesno) => { 
								Gab.emit('dialog2 open', { open: false });
							},
							component: (<div>
								<p>This will stop the channel and reboot.  </p><p>You can start with a clean queue or keep your current one.</p>
								<RaisedButton style={buttonStyleP} key="fresh"  secondary={true} buttonStyle={{ borderRadius: 0,  }}  overlayStyle={{ borderRadius: 0 }}  label="Start Fresh" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand(newC);	
								}} />
								<RaisedButton style={buttonStyleP} key="stale"  secondary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Keep Queue" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand({ ...newC, link: newC.link + '?keepQueue=yes' });	
								}} />
								<RaisedButton style={buttonStyle} key="staler"  primary={true} buttonStyle={{  borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Back" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									Gab.emit('dialog open', { open: true });
								}} />
							</div>)	
						})
						
						
					}} />
					
					<RaisedButton style={buttonStyleP} key="save"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="with Transcoding" onClick={(e) => {
						
						
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('dialog2 open', {
							title: newC2.label +  "",
							open: true,
							answer:(yesno) => { 
								Gab.emit('dialog2 open', { open: false });
							},
							component: (<div>
								<p>This will stop the channel and reboot. <br />The HLS stream will be transcoded with <code>-codec:v libx264</code> and <code>-codec:a  aac</code> and format as <code>mpegts</code>.  </p><p>You can start with a clean queue or keep your current one.</p>
								<RaisedButton style={buttonStyleP} key="fresh"  secondary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Start Fresh" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand(newC2);	
								}} />
								<RaisedButton style={buttonStyleP} key="stale"  secondary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Keep Queue" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand({ ...newC2, link: newC2.link + '&keepQueue=yes' });	
								}} />
								<RaisedButton style={buttonStyle} key="staler"  primary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Back" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									Gab.emit('dialog open', { open: true });
								}} />
							</div>)
						});
						
					}} />
					<RaisedButton style={buttonStyleP} key="pass"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="with Passthrough" onClick={(e) => {
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('dialog2 open', {
							title: newC3.label +  "",
							open: true,
							answer:(yesno) => { 
								Gab.emit('dialog2 open', { open: false });
							},
							component: (<div>
								<p>This will stop the channel and reboot using the video as is. </p><p>  You can start with a clean queue or keep your current one.</p>
								<RaisedButton style={buttonStyleP} key="fresh"  secondary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Start Fresh" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand(newC3);	
								}} />
								<RaisedButton style={buttonStyleP} key="stale"  secondary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Keep Queue" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand({ ...newC3, link: newC3.link + '&keepQueue=yes' });	
								}} />
								<RaisedButton style={buttonStyle} key="staler"  primary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Back" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									Gab.emit('dialog open', { open: true });
								}} />
							</div>)	
						})
					}} />
					
				</div>)
			});
		}}  >
			<FontIcon style={{ }} className="material-icons"  color={Styles.Colors.amber500}  hoverColor={Styles.Colors.amber900} >settings_backup_restore</FontIcon>
		</IconButton>)
		
		return powerButtons;
	}
	
	render() { 
		debug('## render  ##  Channel render', this.props, this.state);
		
		let c = this.state.channel;
		
		if(!c.commands) {
			return (<Card><div>Loading Channel {c.channel}</div> </Card>);
		}
		let buttons = this.buttons(c);
		let powerButtons = this.powerButtons(c);
		
		var links = [];
				
		if(c.links) {
			Each(c.links, (l,ii) => {
				if(!Array.isArray(l)) {
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
		
		let art = '/images/fanart.gif';
		let poster ='/images/fanart.gif';
		let banner =  "url('/images/banner.jpg')no-repeat  center";
		let bgSize = 'cover';
		if(c.playing.metadata.thumb) {
				poster = c.playing.metadata.thumb;
		}
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
		
		let countRows = 0;
		
		return (<div   style={{paddingRight:0, paddingLeft:0, marginBottom: 15 }}>
				
			<Card zDepth={1} containerStyle={{ paddingBottom: 0 }} style={{ background: "url('" + art + "')no-repeat", backgroundPosition: '50%  top', backgroundSize: '100% auto' }}>
				
				<CardHeader
					style={{ overflow: 'hidden', background: this.props.theme.palette.canvasColor, opacity: '.90' }}
					subtitle={<span style={{  }}>{c.channel}</span>}
					title={<span >On Air: <b>{c.playing.name}</b></span>}
					avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor}  >dvr</FontIcon>}
					actAsExpander={true}
					showExpandableButton={true}
				/>
				<CardText expandable={true} style={{padding: 0}} >	
					<CardMedia style={{ overflow: 'hidden', background: 'transparent' }}>
						<div id="vid-box" style={{ position: 'relative', width: '100%' }} >
							<Video source={c.links.hls || c.link} style={{ margin: 'auto'  }} poster={false}  mute={false} channel={c} doRequestCommand={this.doRequestCommand} controls={true} />
						</div>
					</CardMedia>	
					 <Tabs
						onChange={this.handleChange}
						value={this.state.slideIndex}
						style={{ background: this.props.theme.palette.canvasColor, opacity: '.80' }}
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
						style={{ background: this.props.theme.palette.canvasColor }}
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
									subtitle={<p><img src={poster} width="80" height="45"  style={{ float: 'left', margin: 10 }} />{meta.description}</p>}
									title={<span><VideoProgress channel={c.channel} Sockets={this.props.Sockets} data={c.playing} /><br /><b>{c.playing.name}</b></span>}
									actAsExpander={true}
									showExpandableButton={true}
									style={{ overflow: 'hidden'  }}
								/>
								<CardText expandable={true}>		
									
									<Table
										fixedHeader={false}
										selectable={true}
										multiSelectable={false}
										onCellClick={(row, col) => {
											debug(this['row:'+row]);
											Gab.emit('dialog open', {
												html: this['row:'+row].props['data-html'],
												title: this['row:'+row].props.title,
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
											{keys.map((v,k) => {
												let s = meta[v];
												if (Array.isArray(s)) {
													return s.map(r => this.mapRow(r.url, r.type, countRows++))
												}
												return this.mapRow(s,v, countRows++);
											})}
										</TableBody>
									</Table>
								</CardText>
							</Card>
						</div>
						
						<div style={styles.slide}>
							<Card zDepth={0}>
								<CardHeader 
									title={'Commands - click arrow for additional'}
									subtitle={powerButtons}
									actAsExpander={false}
									showExpandableButton={true}
								/>
								<CardText expandable={true}>
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
	
	mapRow(s, k, row) {
		return (<TableRow key={k} style= {{ cursor: 'pointer' }} ref={(input) => this['row:'+row] = input} data-html={s} title={k}>
			<TableRowColumn>{k}</TableRowColumn>
			<TableRowColumn>{s ? s : 'UA'}</TableRowColumn>
		</TableRow>);
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
