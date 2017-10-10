import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import { ColorMe } from 'app/common/utils';
import Gab from '../gab';

let debug = Debug('woobi:app:common:components:videoGeneric'); 
	
export default class VideoGeneric extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'HTML5 Generic Video Component'	
		this.state = {};
		
		//update bit
		this._update = false;
		this.run = this.run.bind(this);
		this.doSomething = this.doSomething.bind(this);
		this.curtain = null;
				
		this.buttonStyle = { margin: '0 auto',  width: 36, height: 36, padding: 0};
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		
		let changed = (nextProps.source != this.props.source);		
		if (changed) {
			debug('clappr', this.props, nextProps);
			this.props = nextProps;
			this.change(nextProps.source);
			return true;
		}
		//debug('video5 should NOT update');
		return false;
	}

	componentDidMount() {
		//debug('video5 didMount');
		this.change(this.props.source);
		this._update = true;
		
	}

	componentWillUnmount() {
		this.destroyPlayer();
		Gab.removeListener(this.props.source, this.doSomething);
	}
	
	doSomething(data) {
		debug('## doSomething ##', data);
		if (data.action) {
			 this.run(data.action);
		}
	}
	
	destroyPlayer() {
		if (this.player) {
			this.player.destroy();
		}
		this.player = null;
	}
	
	stop() {
		if (this.player) {
			this.player.stop();
		}
	}

	change(source) {
		if (this.player) {
			this.destroyPlayer();
		}
		Gab.removeListener(source, this.doSomething);
		debug('listen on', source);
		Gab.on(source, this.doSomething);
		this.player = new Clappr.Player({
			parent: this.refs.player,
			source: source,
			//preload: 'auto',
			chromeless: this.props.chromeless,
			width: this.props.width,
			height: this.props.height,
			mute: this.props.mute,
			autoPlay: this.props.autoPlay,
			actualLiveTime: this.props.actualLiveTime,
			mimeType: this.props.mimeType,
			//poster: this.props.poster,
			//plugins: [ChromecastPlugin],
			maxBufferLength: 240,
			events: {
				onReady: () => { }, //Fired when the player is ready on startup
				onResize: () => {  },//Fired when player resizes
				onPlay: () => { 
					if (typeof this.props.onPlay === 'function') {
						//debug('onplay prop');
						this.props.onPlay()
					}
					this.curtain.style.backgroundColor = 'black';
				},//Fired when player starts to play
				onPause:  () => {  
					if (typeof this.props.onPause === 'function') {
						this.props.onPause()
					}
					this.curtain.style.backgroundColor = 'initial';
				},//Fired when player pauses
				onStop: () => {  
					if (typeof this.props.onStop === 'function') {
						this.props.onStop()
					}
					this.curtain.style.backgroundColor = 'initial';
				},//Fired when player stops
				onEnded:  () => {  
					if (typeof this.props.onEnded === 'function') {
						this.props.onEnded()
					}
					this.curtain.style.backgroundColor = 'initial';
				},//Fired when player ends the video
				onSeek: () => {  },//Fired when player seeks the video
				onError: (err) => { 
					if (typeof this.props.onError === 'function') {
						this.props.onError()
					}
					if(err.error) debug(err, 'Error playing video: ' + err.error);
				},//Fired when player receives an error
				onTimeUpdate: (time) => {  
					//debug(time);
				},//Fired when the time is updated on player
				onVolumeUpdate: () => {  },//Fired when player updates its volume
			}
		});
	}
	
	run(action) {
		debug(this.player, action)
		if (this.player) {
			if (typeof this.player[action] === 'function') {
				this.player[action]();
			}
		}
	}
	
	controlsRight() {
		let buttonStyle = this.buttonStyle;
		//let iconStyle={styles.smallIcon}
		let playing = this.player && this.player.playing();
		return(<div style={{ paddingTop: 12, position: 'absolute', width: 36, height: '100%', right: 0, top: 0,  align:'center',  margin: 'auto', background: Styles.Colors.lightBlue900, height: this.props.height }}>
			<div style={{  }}>
				<IconButton title="Stop Playing" style={buttonStyle} key="stop"  secondary={true} onClick={(e) => { this.run('stop') }} >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >stop</FontIcon>
				</IconButton>
			</div>
			<div style={{ paddingTop: 9 }}>
				<IconButton title="Play"   style={buttonStyle} key="play"  secondary={true} onClick={(e) => { this.run('play') }} >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >play_arrow</FontIcon>
				</IconButton>
			</div>
			<div style={{ paddingTop: 9 }}>
				<IconButton title="Pause"  style={buttonStyle} key="pause"  secondary={true} onClick={(e) => { this.run('pause') }} >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >pause</FontIcon>
				</IconButton>
			</div>
		</div>);
	}
	
	controlsLeft() {
		
	}
	
	render() {
		debug('## RENDER ## Player',  this.state, this.props, this.player);					
			
		let player =  (<div style={{  width: this.props.width, height: this.props.height }}  ref="player" />);
		return (<div ref={(input) => this.curtain = input} style={{ position: 'relative'}}>
			<div style={{  width: this.props.width,  ...this.props.style }}>
				{player}
			</div>
			{this.props.controls ? this.controlsRight() : ''}
			<div className="clearfix" />
		</div>);		
	}
}

VideoGeneric.propTypes = {
	video: React.PropTypes.string
};

VideoGeneric.defaultProps = {
	width: 288,
	height: 162,
	poster: false,
	autoPlay: false,
	actualLiveTime: false,
	mimeType: false,
	mute: false,
	channel: {
		prev: {}
	},
	controls: false,
	listenTo: false,
	chromeless: false
};
