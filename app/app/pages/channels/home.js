import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import MiniChannel from '../../common/components/miniChannel';
import AddChannel from '../../common/components/addChannel';

import { Card, CardActions, CardHeader , FlatButton, FontIcon} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';

let debug = Debug('lodge:app:pages:channels:home');

export default class Home extends React.Component {
	constructor(props) {
		super(props)
		
		let channels = [];
		if(props.initialData) {
			channels = props.initialData.channels || [];
			this._skipMount = true;
		}
		this.displayName = 'Home';
		this.state = {
			loading: true,
			channels,
			saved: [],
			presets: []
		};
		
		this.gotChannels = this.gotChannels.bind(this);
		this.listenForPresets = this.listenForPresets.bind(this);
		this.manageChannel = this.manageChannel.bind(this);
		
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Home',  this.props);
		if(!this._skipMount) {
			this.getChannels();
		}
		this.props.Sockets.io.on('channels', this.gotChannels);
		this.props.Sockets.io.on('presets', this.listenForPresets);
		this.props.Sockets.io.emit('presets');
	}
	
	listenForPresets(presets) {
		debug('Got listenForPresets', presets);
		this.setState({ ...presets });
	}
	
	
	gotChannels(data) {
		this.setState({
			channels: data.channels,
		});
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('channels', this.gotChannels);
		this.props.Sockets.io.removeListener('presets', this.listenForPresets);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  Channels Home got props', props);
		this.getChannels();
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
	
	addChannel() {
		return (<AddChannel { ...this.state } theme={this.props.theme} goTo={this.props.goTo} />);
	}
	
	manageChannel() {
		return (<div>
			<FlatButton  label={"Add Channel"} onClick={()=>{
				this.props.goTo({
					path: '/channels/add',
					page: 'Add Channel'
				});
			}} />
			{this.state.saved.map((r, i) => {
				return (<div className="clearfix" style={{ background: ColorMe((i%2 === 0 ? 10: 20), this.props.theme.palette.canvasColor).bgcolor, color: ColorMe((i%2 === 0 ? 10: 20), this.props.theme.palette.canvasColor).color}}>
					<div style={{ float: 'left', width: 35, margin: 5, padding: 5, cursor: 'pointer'  }} children={<FontIcon className="material-icons" children="edit" />} onClick={() => {
						this.setState({ update: i, add: r.type, current: r });
					}}/>
					<div style={{ float: 'left', width: 35, margin: 5, padding: 5, cursor: 'pointer'  }} children=<FontIcon className="material-icons" children="delete_forever" /> onClick={() => {
						Gab.emit('confirm open', {
							html: 'Remove Saved Config ' + r.name + '?',
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									//this.props.removeSource(i);
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Yes, REMOVE Config', 
						})
							
					}}/>
					<div style={{ float: 'left', margin: 5, padding: 5  }} children={!r.autostart ? <FontIcon className="material-icons" color={this.props.theme.palette.disabledColor} children="queue_play_next" /> : <FontIcon className="material-icons" children="queue_play_next" color={Styles.Colors.lightGreenA400} />} />
					<div style={{ float: 'left', margin: 5, padding: 5  }} children={r.name} />
				</div>);
		})}
		</div>);
	}
	
	goToChannel() {
		return (<div><FlatButton  label={"View Channels"} onClick={()=>{
			this.props.goTo({
				path: '/channels/',
				page: 'Channels'
			});
		}} /><FlatButton  label={"Manage Channels"} onClick={()=>{
			this.props.goTo({
				path: '/channels/manage',
				page: 'Manage Channels'
			});
		}} /></div>)	
			
	}
	
	render() { 
		debug('## render  ##  Channels Home render', this.props, this.state);
		let ret = [<span />];
		if (this.state.channels.length > 0) {
			ret =  this.state.channels.map((c, i) => {
				return (<MiniChannel key={i} { ...this.props } channel={c} />)
			});
		}
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 0px' }}>
				<Card   zDepth={1}>
					<CardHeader
						style={{ overflow: 'hidden' }}
						//title={(this.state.channels.length > 0) ? <span>Channels</span> : <span >Loading Channels</span>}
						title={this.goToChannel.call(this)}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
			</div>
			{this.props.params.action === 'manage' ? this.manageChannel() : this.props.params.action === 'add' ? this.addChannel() : this.renderChannelList(ret)}
		</div>);
	}
	
	renderChannelList(list) {
		if(this.props.desktop !== 'xs') {
			var list2=[];
			list = list.filter((v,i) => {
				if(i%2 === 0) {
					return true;
				} else {
					list2.push(v);
					return false;
				}
			});
			return (<div>
				<div style={{ padding: '10px 10px 10px 0' }} className="col-sm-6" children={list} />
				<div style={{ padding: '10px 0px 10px 10px' }} className="col-sm-6" children={list2}  />
			</div>);
			
		} else {
			return (<div children={list} />);
		}
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
