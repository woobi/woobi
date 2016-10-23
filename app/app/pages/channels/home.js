import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { FontIcon, IconButton, Paper } from 'material-ui';
import { Styles } from '../../common/styles';
import moment from 'moment';
import { ColorMe } from 'app/common/utils';
import Video from '../../common/components/video5';

let debug = Debug('lodge:app:pages:channels:home');

export default class Home extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Home';
		this.state = {
			loading: true,
			
		};
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Home',  this.props);
		
	}
	
	componentWillUnmount() {

	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  Channels Home got props', props);
		this.setState({ games: props.games || [] });
		 
	}
	
	render() { 
		debug('## render  ##  Channels Home render', this.props, this.state);
		return (<div style={{ padding: '0 20px' }}>
				<span>Home</span>
				<div style={{
					position: 'absolute',
					right: 100,
					top: 100,
					width: 330,
					height: 400,
				}} >
					<Video source="http://snowwhite:7001/video/TV.m3u8" />
					<br />
					<Video source="http://snowwhite:7001/alvin/channel/2/play.mp4"  /> 
				</div>	
		</div>);
		
	}
}


Home.getInitialData2 = function(params) {
	
	let ret = {}
	console.log('### RUN getInitialData Channels HOME ###', params);
	return ret
}
