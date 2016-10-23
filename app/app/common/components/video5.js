import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import { ColorMe } from 'app/common/utils';


let debug = Debug('lodge:app:common:components:video5'); 
	
export default class Video5 extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'HTML5 Video Component'	
		this.state = {};
		
		//update bit
		this._update = false;
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		debug('clappr', this.props, nextProps);
		let changed = (nextProps.source != this.props.source);
		this.props = nextProps;
		this.state = nextState;
		if (changed && this._update) {
			this.change(nextProps.source);
		}
		return false;
	}

	componentDidMount() {
		this.change(this.props.source);
		this._update = true;
		
	}

	componentWillUnmount() {
		this.destroyPlayer();
	}

	destroyPlayer() {
		if (this.player) {
			this.player.destroy();
		}
		this.player = null;
	}

	change(source) {
		if (this.player) {
			this.destroyPlayer();
		}
		this.player = new Clappr.Player({
			parent: this.refs.player,
			source: source,
			preload: 'none',
			width: this.props.width || '320',
			height: this.props.height || '180',
			mute: this.props.mute || true,
			autoPlay: this.props.autoPlay || false,
			actualLiveTime: this.props.actualLiveTime || true,
			mimeType: this.props.mimeType || false,
			poster: this.props.poster || 'http://clappr.io/poster.png',
			hlsjsConfig: {
				enableWorker: true
			},
			events: {
				onReady: function() {  }, //Fired when the player is ready on startup
				onResize: function() {  },//Fired when player resizes
				onPlay: function() {  },//Fired when player starts to play
				onPause: function() {  },//Fired when player pauses
				onStop: function() {  },//Fired when player stops
				onEnded: function() {  },//Fired when player ends the video
				onSeek: function() {  },//Fired when player seeks the video
				onError: function(err) { 
						console.error(err, 'Error playing video');
				},//Fired when player receives an error
				onTimeUpdate: function() {  },//Fired when the time is updated on player
				onVolumeUpdate: function() {  },//Fired when player updates its volume
			}
		});
	}
	
	render() {
		debug('## RENDER ## Player',  this.state, this.props);
						
		return (
			<div>
				<div ref="player"></div>
			</div>
		);
	}
}

Video5.propTypes = {
	video: React.PropTypes.string
};

