import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import MiniChannel from '../../common/components/miniChannel';
import { Card, CardActions, CardHeader , FontIcon} from 'material-ui';
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
		};
		
		this.gotChannels = this.gotChannels.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Home',  this.props);
		if(!this._skipMount) {
			this.getChannels();
		}
		this.props.Sockets.io.on('channels', this.gotChannels);
	}
	
	gotChannels(data) {
		this.setState({
			channels: data.channels,
		});
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('channels', this.gotChannels);
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
	
	render() { 
		//debug('## render  ##  Channels Home render', this.props, this.state);
		let ret = <span/>;
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
						title={(this.state.channels.length > 0) ? <span>Channels</span> : <span >Loading Channels</span>}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
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
