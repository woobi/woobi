import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardMedia, CardText, CardTitle, FlatButton, FontIcon, IconButton, Paper, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn } from 'material-ui';
import { Styles } from '../../common/styles';
import moment from 'moment';
import { ColorMe, naturalSort } from 'app/common/utils';
import Video from '../../common/components/video5';
import { each as Each, map as Map } from 'lodash';


let debug = Debug('lodge:app:pages:channels:home');

export default class Home extends React.Component {
	constructor(props) {
		super(props)
		
		let channels = [];
		let names = [];
		let progress = {};
		if(props.initialData) {
			channels = props.initialData.channels || [];
			names = channels.map(c => { progress[c.channel] = c.playing.progress; return c.channel });
			this._skipMount = true;
		}
		this.displayName = 'Home';
		this.state = {
			loading: true,
			channels,
			names,
			progress
		};
		
		this.doRequestCommand = this.doRequestCommand.bind(this);
		this.gotChannels = this.gotChannels.bind(this);
		this.listenForProgress = this.listenForProgress.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Home',  this.props);
		if(!this._skipMount) {
			this.getChannels();
		}
		this.props.Sockets.io.on('channels', this.gotChannels);
		this.props.Sockets.io.on('progress report', this.listenForProgress);
	}
	
	gotChannels(data) {
		//debug('### STATUS ###', data);
		var progress = {};
		this.setState({
			channels: data.channels,
			names: data.channels.map(c => { progress[c.channel] = c.playing.progress; return c.channel }),
			progress
		});
	}
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('channels', this.gotChannels);
		this.props.Sockets.io.removeListener('progress report', this.listenForProgress);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  Channels Home got props', props);
		this.getChannels();
	}
	
	listenForProgress(who) {
		// debug('Got progress report', who.channel);
		if(this.state.names.indexOf(who.channel) > -1) {
			//debug('use progress report', who);
			var progress = { ...this.state.progress };
			progress[who.channel] = who.progress;
			this.setState({ progress });
		}
				
	}
	
	
	doRequestCommand(link) {
		Gab.rawRequest(link.link, 'nowhere')
		.then(data => {
			if(data.success) {
				this.props.appState({
					newalert: {
						style: 'success',
						html: link.success || 'Command Success',
						show: true
					}
				});
			} else {
				this.props.appState({
					newalert: {
						style: 'danger',
						html: link.error || 'Command Failed',
						show: true
					}
				});
			}
		})
		.catch(e => {
			this.props.appState({
				newalert: {
					style: 'danger',
					html: link.error || 'Command Failed',
					show: true
				}
			});
		});
	}
	
	getChannels() {
		this.props.Request({
			action: 'channels'
		})
		.then(data => {
			debug('### got channels ###', data);
			this.setState({
				channels: data.channels
			});
		})
		.catch(error => {
			debug('ERROR from channels', error)
		});
	}
	
	render() { 
		//debug('## render  ##  Channels Home render', this.props, this.state);
		
		let channels = this.state.channels.map((c) => {
		
			var text = [];
			if(c.links) {
				Each(c.links, (l,ii) => {
					if(ii == 'local' || ii == 'unicast') {
						text.push(<FlatButton key={ii} label={ii} href={l} />);
					} else {
						l.forEach((li, il) => {
							text.push(<FlatButton key={ii + il} label={ii} href={li} />);
						});
					}
				});
			}
			
			let buttons = c.commands.request.map((cc, i) => {
				return (<FlatButton key={cc.name+i} label={cc.label} onClick={()=>{
					this.props.appState({
						newconfirm: {
							html:"If you switch between HD and SD feeds the channel may need to be restarted for HLS feeds to continue. You can switch back to the original feed type and a restart is not required. ",
							title:"Change to channel " + cc.name +  "?",
							answer:() => { this.doRequestCommand(cc) },
							open: true,
							yesText: 'Change Channel',
							noText: 'Cancel'
						}
					});
				}} />)
			});
			
			let newC = { name: 'RESTART', label: 'RESTART CHANNEL', link: '/alvin/restart/channel/' + c.channel, success: 'Channel ' + c.channel + ' restarted ', error: 'Could not restart ' + c.channel };
			
			buttons.unshift(<FlatButton key={newC.name} label={newC.label} onClick={()=>{
				this.props.appState({
					newconfirm: {
						html:"Do you want to restart this channel?<br />Any HLS feeds will lose its saved stream.",
						title:"Confirm",
						answer:() => { this.doRequestCommand(newC) },
						open: true,
						yesText: 'Restart Channel',
						noText: 'Cancel'
					}
				});
			}} />)
		
			const style = {
				width: '100%',
				height: 300,
				padding: 20,
			};
			let art = '/images/fanart.jpg';
			if(c.playing.metadata.art) {
				art = c.playing.metadata.art.replace('<thumb>','').replace('</thumb>','');
			}
			
			let progress = this.state.progress[c.channel];
			if(progress) {
				
				progress = <span>{progress.timemark + ' of ' + Math.round(c.playing.duration) + ' min @ ' + progress.currentKbps + ' kbps'}</span>;
				
			} else {
				progress = <span />;
			}
			return (<div  className="col-xs-12 col-md-6" style={{paddingRight:2, paddingLeft:2 }} >
				
				<Card >
					<CardHeader
						title={c.channel}
						subtitle={<a href={c.link} >{c.link}</a>}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor}  >dvr</FontIcon>}
					/>
					<CardMedia style={{ background: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor }}>
						<div id="vid-box" style={{ position: 'relative', width: '100%' }} >
							<Video source={c.links.hls[0] || c.link} style={{ margin: 'auto'  }} poster={art}  />
						</div>
					</CardMedia>	
					<Card>
						<CardHeader 
							title={c.playing.name}
							subtitle={progress}
							avatar={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >subscriptions</FontIcon>}

							actAsExpander={true}
							showExpandableButton={true}
						/>
						<CardText expandable={true}>		
							<Table
								fixedHeader={false}
								selectable={false}
								multiSelectable={false}
							>
								
								<TableBody
									displayRowCheckbox={false}
									deselectOnClickaway={false}
									showRowHover={true}
									stripedRows={false}
								>
								  
									{Map(c.playing.metadata.sort(naturalSort), (s,k) => {
											return (<TableRow>
											<TableRowColumn>{k}</TableRowColumn>
											<TableRowColumn>{s ? s : 'UA'}</TableRowColumn>
										</TableRow>)
									})}
									
								</TableBody>
							</Table>
						</CardText>
					</Card>
					
					<Card>
						<CardHeader 
							title={'Links'}
							avatar={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >live_tv</FontIcon>}

							actAsExpander={true}
							showExpandableButton={true}
						/>
						<CardText expandable={true}>
							{text }		
						</CardText>
					</Card>
					
					<Card>
						<CardHeader 
							title={"Sources"}
							subtitle={"View the sources"}
							avatar={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >surround_sound</FontIcon>}

							actAsExpander={true}
							showExpandableButton={true}
						/>
					
						<CardText expandable={true}>		
							<Table
								fixedHeader={true}
								selectable={true}
								multiSelectable={true}
							>
								<TableHeader
									displaySelectAll={true}
									adjustForCheckbox={true}
									enableSelectAll={true}
								>
									<TableRow>
										<TableHeaderColumn style={{ width: 40 }}>#</TableHeaderColumn>
										<TableHeaderColumn>Name</TableHeaderColumn>
									</TableRow>
								</TableHeader>
								<TableBody
									displayRowCheckbox={true}
									deselectOnClickaway={true}
									showRowHover={true}
									stripedRows={false}
								>
								  
									{c.sources.map(s => {
											return (<TableRow>
											<TableRowColumn style={{ width: 40 }}>{s.position}</TableRowColumn>
											<TableRowColumn>{s.name}</TableRowColumn>
										</TableRow>)
									})}
									
								</TableBody>
							</Table>
						</CardText>
					</Card>
					
					<Card>
						<CardHeader 
							title={"Commands"}
							subtitle={"Manage the channel"}
							avatar={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >perm_data_setting</FontIcon>}

							actAsExpander={true}
							showExpandableButton={true}
						/>
					
						<CardText expandable={true}>
							<CardActions>
								{buttons}
							</CardActions>
						</CardText>
					</Card>	
				</Card>
			
			</div>);
			
		});
		
		return (<div style={{ padding: '0 20px' }}>
				<Card style={{paddingRight:0, paddingLeft:0}} >
					<CardHeader 
						title={"Channels"}
						subtitle={"Available streams"}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={Styles.Colors.lightBlue700} hoverColor={Styles.Colors.amber500} >live_tv</FontIcon>}
					/>				
					
				</Card>
				<br />
				{channels}
		</div>);
		
	}
}


Home.getInitialData = function(params) {
	
	let ret = {
		channels: {
			action: 'channels'
		}
	}
	console.log('### RUN getInitialData Channels HOME ###',  params);
	return ret
}
