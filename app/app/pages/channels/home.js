import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardMedia, CardText, CardTitle, FlatButton, FontIcon, IconButton, Paper } from 'material-ui';
import { Styles } from '../../common/styles';
import moment from 'moment';
import { ColorMe } from 'app/common/utils';
import Video from '../../common/components/video5';
import { each as Each } from 'lodash';

let debug = Debug('lodge:app:pages:channels:home');

export default class Home extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Home';
		this.state = {
			loading: true,
			channels: []
		};
		
		this.doRequestCommand = this.doRequestCommand.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Home',  this.props);
		this.getChannels();
		this.props.Sockets.io.on('channels', (data) => {
			//debug('### STATUS ###', data);
			this.setState({
				channels: data.channels
			});
		});
	}
	
	componentWillUnmount() {

	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  Channels Home got props', props);
		this.getChannels();
	}
	
	doRequestCommand(url) {
		Gab.rawRequest(url, 'nowhere')
		.then(data => {
			if(data.success) {
				this.props.appState({
					newalert: {
						style: 'success',
						html: 'Command Success',
						show: true
					}
				});
			} else {
				this.props.appState({
					newalert: {
						style: 'danger',
						html: 'Command Failed',
						show: true
					}
				});
			}
		})
		.catch(e => {
			this.props.appState({
				newalert: {
					style: 'danger',
					html: 'Command Failed',
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
		
		let channels = this.state.channels.map((c) => {
		
			var text = '<p>';
			text += 'state: ' + c.state.current + '</span><br />| ';
			if(c.links) {
				Each(c.links, (l,ii) => {
					if(ii == 'local' || ii == 'http') {
						text += '<a href="' + l + '">' + ii + '</a> | ';
					} else {
						l.forEach((li, il) => {
							text += '<a href="' + li + '">' + ii + '</a> | ';
						});
					}
				});
			}
			text+= '</p>';
			
			let buttons = c.commands.request.map((cc, i) => {
				return (<FlatButton key={cc.name+i} label={cc.label} onClick={()=>{this.doRequestCommand(cc.link)}} />)
			});
			const style = {
				width: '100%',
				height: 300,
				padding: 20,
			};
			return (<div  className="col-xs-12 col-md-6" style={{paddingRight:2, paddingLeft:2 }} >
				
					<Card >
						<CardHeader
							title={c.channel}
							subtitle={<a href={c.link} >{c.link}</a>}
							avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor}  >dvr</FontIcon>}
						/>
						<CardMedia style={{ background: ColorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor }}>
							<div id="vid-box" style={{ position: 'relative', width: '100%' }} >
								<Video source={c.links.hls[0] || c.link} style={{ margin: 'auto'  }}  />
							</div>
						</CardMedia>	
						<CardTitle title={c.playing.name} subtitle={c.playing.duration} style={{ paddingLeft1: 0 }} />
						<CardText>
							<div dangerouslySetInnerHTML={{ __html: text }} />		
						</CardText>
								
						
						<CardActions>
							{buttons}
						</CardActions>
				</Card>
			
			</div>);
			
		});
		debug('## render  ##  Channels Home render', this.props, this.state);
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


Home.getInitialData2 = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Channels HOME ###', params);
	return ret
}
