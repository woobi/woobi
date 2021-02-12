import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import { ColorMe } from 'app/common/utils';
import Gab from '../gab';

let debug = Debug('woobi:app:common:components:video5'); 
	
export default class Video5 extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'HTML5 Video Component'	
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
			//preload: 'none',
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
			hlsjsConfig: {
				enableWorker: true
			},
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
		if (this.player) {
			if (typeof this.player[action] === 'function') {
				this.player[action]();
			}
		}
	}
	
	prevButton() {
		let buttonStyle = this.buttonStyle;
		//let iconStyle={styles.smallIcon}
		return (
			<IconButton title="Previous Program" style={buttonStyle} key="prev"  secondary={true} disabled={!this.props.channel.prev.name} onClick={(e) => {
					e.preventDefault();
					Gab.emit('confirm open', {
						title: "Play previous?",
						answer:(yesno) => { 
							Gab.emit('confirm open', { open: false });
							if(yesno) {
								this.props.doRequestCommand({
									success: 'Playing ' + this.props.channel.prev.name,
									error: 'Failed to play ' + this.props.channel.prev.name,
									link: '/alvin/unshift/' + this.props.channel.channel + '/prev/' +  this.props.channel.prev.position
								}); 
							}
						},
						open: true,
						noText: 'Cancel',
						yesText: 'Play Prev', 
						html: 'This will stop the current program and play <b>' + this.props.channel.prev.name + '</b> instead. It could take a couple minutes for your stream to show the change.  Continue?'
					})
			}} >
				<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >skip_previous</FontIcon>
			</IconButton>
		)

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
		let buttonStyle = this.buttonStyle;
		//let iconStyle={styles.smallIcon}
		return(<div style={{ paddingTop: 12, position: 'absolute', width: 36, height: '100%', left: 0, top: 0, align:'center',  margin: 'auto', background: Styles.Colors.lightBlue900, height: this.props.height }}>
			<div>
				<IconButton title="Reload Player" style={buttonStyle} key="reload"  secondary={true} onClick={(e) => { 
					e.preventDefault();
						Gab.emit('confirm open', {
							title: "Reload Player?",
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									this.player.load(this.props.source);
								} 
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Reload Player', 
							html: 'This will reload the player with the current program.  It may restart a couple minutes in the past.  Continue?'
						})
				}} >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >refresh</FontIcon>
				</IconButton>
			</div>
			
			<div style={{ paddingTop: 9 }}>
				{this.prevButton()}
			</div>
			
			<div style={{ paddingTop: 9 }}>
				<IconButton title="Next Program" style={buttonStyle} key="next"  secondary={true} onClick={(e) => {
					e.preventDefault();
					Gab.emit('confirm open', {
						title: "Play next?",
						answer:(yesno) => { 
							Gab.emit('confirm open', { open: false });
							if(yesno) {
								this.props.doRequestCommand({
									success: 'Playing ' + this.props.channel.sources[1].name,
									error: 'Failed to play ' + this.props.channel.sources[1].name,
									link: '/alvin/shift/' + this.props.channel.channel
								}); 
							} 
						},
						open: true,
						noText: 'Cancel',
						yesText: 'Play Next', 
						html: 'This will stop the current program and play <b>' + this.props.channel.sources[1].name + '</b> instead. It could take a couple minutes for your stream to show the change.  Continue?'
					})
				}} >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >skip_next</FontIcon>
				</IconButton>
			</div>
			
			
		</div>);
	}
	
	render() {
		debug('## RENDER ## Player',  this.state, this.props, this.player);					
			
		let player =  (<div style={{  width: this.props.width, height: this.props.height }}  ref="player" />);
		return (<div ref={(input) => this.curtain = input} style={{ position: 'relative'}}>
			{this.props.controls ? this.controlsLeft() : ''}
			<div style={{  width: this.props.width,  ...this.props.style }}>
				{player}
			</div>
			{this.props.controls ? this.controlsRight() : ''}
			<div className="clearfix" />
		</div>);		
	}
}

Video5.propTypes = {
	video: React.PropTypes.string
};

Video5.defaultProps = {
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
