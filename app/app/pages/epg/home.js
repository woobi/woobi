import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon, IconButton} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';

let debug = Debug('woobi:app:pages:epg:home');

export default class EPG extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		if(props.initialData) {
			debug('got props initialData');
			//shows = props.initialData.shows.tvshows || [];
			this._skipMount = true;
		}
		this.displayName = 'EPG';
		this.state = {
			loading: true,
			//shows,
			//tvImages: props.tvImages
		};
		
		this.buttonStyle = { margin: '0 auto', width: false, height: false, padding: 0};
		
		this._update = true;
		
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  EPG HOME',  this.props, this.state);
		
		//this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	componentWillUnmount() {
		//this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## EPG got props', props);
		//this.getChannels();
		
	}	
	
	shouldComponentUpdate() {
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	render() { 
		debug('## render  ##  EPG Home render', this.props, this.state);
		let ret = <span >Loading EPG</span>;
		
		return (<div style={{ padding: '0 0px' }}>
			<div style={{ padding: '0px 0px' }}>
				<Card   zDepth={2}>
					<CardHeader
						style={{ overflow: 'hidden', position: 'relative' }}
						title={'EPG'}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >line_style</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

EPG.getInitialData = function(params) {
	
	let ret = {
		shows: {
			action: 'epg'
		}
	}
	console.log('### RUN getInitialData EPG ###',  params);
	return ret
}
