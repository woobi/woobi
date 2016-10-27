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
		
		let changed = (nextProps.source != this.props.source);
		this.props = nextProps;
		this.state = nextState;
		if (changed && this._update) {
			debug('clappr', this.props, nextProps);
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
			width: this.props.width,
			height: this.props.height,
			mute: this.props.mute,
			autoPlay: this.props.autoPlay,
			actualLiveTime: this.props.actualLiveTime,
			mimeType: this.props.mimeType,
			poster: this.props.poster,
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
						
		return (<div style={{ width: this.props.width, height: this.props.height, ...this.props.style }}  ref="player" />);
	}
}

Video5.propTypes = {
	video: React.PropTypes.string
};

Video5.defaultProps = {
	width: 320,
	height: 180,
	poster: '/images/fanart.jpg',
	autoPlay: false,
	actualLiveTime: false,
	mimeType: false,
	mute: true
};
