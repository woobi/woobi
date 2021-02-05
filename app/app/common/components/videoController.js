import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon, RaisedButton } from 'material-ui';
import { Styles } from '../styles';
import { ColorMe } from 'app/common/utils';
import Gab from '../gab';

let debug = Debug('woobi:app:common:components:videoController'); 
	
export default class VideoController extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'VideoController Component'	
		this.state = {};
		//update bit
		
		this.source = props.source ? props.source : this.props.channel.link;
		
		this._update = false;
		this.buttonStyle = { fontSize: '18px', margin: '0 auto',  width: 40, height: 40, padding: 0};
	}
	
	doRequestCommand(link) {
		Gab.emit('snackbar', {
			style: 'warning',
			html: 'Command in progress',
			open: true,
			onRequestClose: () => {}
		});
		Gab.rawRequest(link.link, false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: data.message || link.success || 'Command Success',
					open: true,
					onRequestClose: () => {}
				});
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error || link.error || 'Command Failed',
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: data.error ||  link.error || 'Command Failed',
				open: true,
				onRequestClose: () => {}
			});
		});
	}
	
	killChannel() {
		Gab.emit('snackbar', {
			style: 'warning',
			html: "Removing channel",
			open: true,
			onRequestClose: () => {}
		});
		Gab.emit('dialog2', { open: false });
		Gab.emit(this.emitter, { action: 'stop' });
		Gab.rawRequest(snowUI.api.uri + '/kill/channel/' + this.props.channel.channel, false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: data.message,
					open: true,
					autoHideDuration: 5000,
					onRequestClose: () => {}
				});
								
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
			if (typeof this.props.onKill === 'function') {
				this.props.onKill();
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: e,
				open: true,
				onRequestClose: () => {}
			});
		});
	}
	
	playOnChannel(num) {
		Gab.emit('dialog2', { open: false });
		Gab.rawRequest(snowUI.api.uri + '/jump/' + this.props.channel.channel +  '/' + num, false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: data.message,
					open: true,
					autoHideDuration: 5000,
					onRequestClose: () => {}
				});
				this._update = true;
				this.setState({
					play: channel.link
				});				
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
			
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: e,
				open: true,
				onRequestClose: () => {}
			});
			Gab.emit('dialog2 open', { open: false });
		});
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
								this.doRequestCommand({
									success: 'Playing ' + this.props.channel.prev.name,
									error: 'Failed to play ' + this.props.channel.prev.name,
									link: snowUI.api.uri + '/unshift/' + this.props.channel.channel + '/history/' +  this._history.value
								}); 
							}
						},
						open: true,
						noText: 'Cancel',
						yesText: 'Play Prev', 
						component: (<div>
							<p>Select the source to play.  The current source will be stopped and your selection started.</p>
							<p>The queue will cycle as normal.  It may take a couple minutes for your player to catch up.</p>
							<select ref={(input) => this._history = input} >
								{this.props.channel.history.map((c, i) => {
									return (<option value={i}>{c.name}</option>);
								})}
							</select>
							
						</div>)
					})
			}} >
				<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >skip_previous</FontIcon>
			</IconButton>
		)

	}
	
	nextButton() {
		let buttonStyle = this.buttonStyle;
		//let iconStyle={styles.smallIcon}
		return (
			<IconButton title="Pick Source" style={buttonStyle} key="next"  secondary={true} onClick={(e) => {
					e.preventDefault();
					Gab.emit('confirm open', {
						title: "Play another source?",
						answer:(yesno) => { 
							Gab.emit('confirm open', { open: false });
							if(yesno) {
								this.doRequestCommand({
									success: 'Playing ' + this.props.channel.sources[this._nextsource.value].name,
									error: 'Failed to play ' + this.props.channel.sources[this._nextsource.value].name,
									link: snowUI.api.uri + '/jump/' + this.props.channel.channel + '/' + this._nextsource.value
								}); 
							} 
						},
						open: true,
						noText: 'Cancel',
						yesText: 'Play ', 
						component: (<div>
							<p>Select the source to play.  The current source will be stopped and your selection started.</p>
							<p>The queue will cycle as normal.  It may take a couple minutes for your player to catch up.</p>
							<select ref={(input) => this._nextsource = input} style={{border:'none',backgroundColor:'#ef6c00',color:'#fff',padding:10}} >
								{this.props.channel.sources.filter((f,i) => (i>0)).map((c, i) => {
									return (<option value={i+1} style={{padding:10}}>{c.name}</option>);
								})}
							</select>
							
						</div>)
					})
				}} >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >skip_next</FontIcon>
				</IconButton>
		)

	}
	
	playButton() {
		return (<IconButton title="Play"   style={this.buttonStyle} key="play"  secondary={true} onClick={(e) => { this.run('play') }} >
			<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >play_arrow</FontIcon>
		</IconButton>);
	}
	
	pauseButton() {
		return (<IconButton title="Pause"  style={this.buttonStyle} key="pause"  secondary={true} onClick={(e) => { this.run('pause') }} >
			<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >pause</FontIcon>
		</IconButton>);
	}
	
	restartButton() {
		let c = this.props.channel;
		let newC = { name: 'RebootChannel', label: 'REBOOT CHANNEL', link: snowUI.api.uri + '/restart/channel/' + c.channel , success: 'Channel ' + c.channel + ' restarting fresh. ', error: 'Could not restart ' + c.channel };
		let newC2 = { name: 'ModifyChannel', label: 'MODIFY CHANNEL', link: snowUI.api.uri + '/restart/channel/' + c.channel + '?passthrough=no', success: 'Channel ' + c.channel + ' restarting with current source list.', error: 'Could not restart ' + c.channel };
		let newC3 = { name: 'ModifyChannel', label: 'MODIFY CHANNEL', link: snowUI.api.uri + '/restart/channel/' + c.channel + '?passthrough=yes', success: 'Channel ' + c.channel + ' restarting with current source list.', error: 'Could not restart ' + c.channel, onSuccess: () => {} };
		const buttonStyle = {
			margin: '30 0 0 12',
			borderRadius: 0,
			float: 'right',
		};
		const buttonStyleP = {
			margin: '30 12 0 0',
			borderRadius: 0,
			float: 'left',
			color: 'white',
		};
		return (<IconButton title="Restart Channel" style={this.buttonStyle} key="restart"  secondary={true} onClick={(e) => {
			Gab.emit('dialog open', {
				title:"Reboot Channel?",
				answer:() => { 
					Gab.emit('dialog open', { open: false });
				},
				open: true,
				noText: 'Cancel',
				component: (<div>
					<p>Do you want to reboot this channel?<br />All feeds will be lost and start over.</p><p>  If you are having issues with audio or video you can try rebooting with transcoding enabled.</p>
					<RaisedButton style={buttonStyleP} key="fresh"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Reboot Channel" onClick={(e) => {
						
						
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						if (c.sources.length < 2) {
							this.doRequestCommand(newC);
							return;
						}
						Gab.emit('dialog2 open', {
							title: newC.label +  "",
							open: true,
							answer:(yesno) => { 
								Gab.emit('dialog2 open', { open: false });
							},
							component: (<div>
								<p>This will stop the channel and reboot.  </p><p>You can start with a clean queue or keep your current one.</p>
								<RaisedButton style={buttonStyleP} key="fresh"  secondary={false} buttonStyle={{ borderRadius: 0,  }}  overlayStyle={{ borderRadius: 0 }}  label="Start Fresh" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand(newC);	
								}} />
								<RaisedButton style={buttonStyleP} key="stale"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Keep Queue" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand({ ...newC, link: newC.link + '?keepQueue=yes' });	
								}} />
								<RaisedButton style={buttonStyle} key="staler"  primary={true} buttonStyle={{  borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Back" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									Gab.emit('dialog open', { open: true });
								}} />
							</div>)	
						})
						
						
					}} />
					
					<RaisedButton style={buttonStyleP} key="save"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="with Transcoding" onClick={(e) => {
						
						
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						if (c.sources.length < 2) {
							this.doRequestCommand(newC2);
							return;
						}
						Gab.emit('dialog2 open', {
							title: newC2.label +  "",
							open: true,
							answer:(yesno) => { 
								Gab.emit('dialog2 open', { open: false });
							},
							component: (<div>
								<p>This will stop the channel and reboot. <br />The HLS stream will be transcoded with <code>-codec:v libx264</code> and <code>-codec:a  aac</code> and format as <code>mpegts</code>.  </p><p>You can start with a clean queue or keep your current one.</p>
								<RaisedButton style={buttonStyleP} key="fresh"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Start Fresh" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand(newC2);	
								}} />
								<RaisedButton style={buttonStyleP} key="stale"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Keep Queue" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand({ ...newC2, link: newC2.link + '&keepQueue=yes' });	
								}} />
								<RaisedButton style={buttonStyle} key="staler"  primary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Back" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									Gab.emit('dialog open', { open: true });
								}} />
							</div>)
						});
						
					}} />
					<RaisedButton style={buttonStyleP} key="pass"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="with Passthrough" onClick={(e) => {
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						if (c.sources.length < 2) {
							this.doRequestCommand(newC3);
							return;
						}
						Gab.emit('dialog2 open', {
							title: newC3.label +  "",
							open: true,
							answer:(yesno) => { 
								Gab.emit('dialog2 open', { open: false });
							},
							component: (<div>
								<p>This will stop the channel and reboot using the video as is. </p><p>  You can start with a clean queue or keep your current one.</p>
								<RaisedButton style={buttonStyleP} key="fresh"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Start Fresh" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand(newC3);	
								}} />
								<RaisedButton style={buttonStyleP} key="stale"  secondary={false} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Keep Queue" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									this.doRequestCommand({ ...newC3, link: newC3.link + '&keepQueue=yes' });	
								}} />
								<RaisedButton style={buttonStyle} key="staler"  primary={true} buttonStyle={{ borderRadius: 0 }}  overlayStyle={{ borderRadius: 0 }}  label="Back" onClick={(e) => {
									e.preventDefault();
									Gab.emit('dialog2 open', { open: false });
									Gab.emit('dialog open', { open: true });
								}} />
							</div>)	
						})
					}} />
					
				</div>)
			});
		}}  >
			<FontIcon style={{ }} className="material-icons"  color={Styles.Colors.amber500}  hoverColor={Styles.Colors.amber900} >settings_backup_restore</FontIcon>
		</IconButton>);
	}
	
	killButton() {
		return (<IconButton title="Kill Channel" style={this.buttonStyle} key="kill"  secondary={false} onClick={(e) => { 
			e.preventDefault();
				Gab.emit('confirm open', {
					title: "Kill Channel?",
					answer:(yesno) => { 
						Gab.emit('confirm open', { open: false });
						if(yesno) {
							this.killChannel();
						} 
					},
					open: true,
					noText: 'Cancel',
					yesText: 'Kill Channel', 
					html: 'This will remove the channel.  Continue?'
				})
		}} >
			<FontIcon style={{ }} className="material-icons" color={Styles.Colors.amber600} hoverColor={Styles.Colors.red600} >visibility_off</FontIcon>
		</IconButton>);
	}
	
	destroyButton() {
		return (<IconButton title="Destroy Player" style={this.buttonStyle} key="destroy"  secondary={false} onClick={(e) => { 
			e.preventDefault();
				Gab.emit('confirm open', {
					title: "Destroy Player?",
					answer:(yesno) => { 
						Gab.emit('confirm open', { open: false });
						if(yesno) {
							this.run('destroy');
						} 
					},
					open: true,
					noText: 'Cancel',
					yesText: 'Destroy Player', 
					html: 'This will Destroy the player.  Continue?'
				})
		}} >
			<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >remove_from_queue</FontIcon>
		</IconButton>);
	}
	
	reloadButton() {
		return (<IconButton title="Reload Player" style={this.buttonStyle} key="reload"  secondary={false} onClick={(e) => { 
			e.preventDefault();
				Gab.emit('confirm open', {
					title: "Reload Player?",
					answer:(yesno) => { 
						Gab.emit('confirm open', { open: false });
						if(yesno) {
							this.run('load');
						} 
					},
					open: true,
					noText: 'Cancel',
					yesText: 'Reload Player', 
					html: 'This will reload the player with the current program.  It may restart a couple minutes in the past.  Continue?'
				})
		}} >
			<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >refresh</FontIcon>
		</IconButton>);
	}
	
	stopButton() {
		return (<IconButton title="Stop Playing" style={this.buttonStyle} key="stop"  secondary={false} onClick={(e) => { this.run('stop') }} >
			<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blue600} hoverColor={Styles.Colors.blue600} >stop</FontIcon>
		</IconButton>);
	}
	
	run(action) {
		let data = {
			action,
			source: this.source
		}
		debug('Gab emit', this.source, data);
		let lookFor = 'on' + action.charAt(0).toUpperCase() + action.slice(1);
		if (typeof this.props[lookFor] == 'function') {
			this.props[lookFor]();
		}
		Gab.emit(this.source, data);
	}
	
	render() {
		debug('## RENDER ## Controls',  this.props);					
		let ret = <span />;
		if (this.props.channel.channel) {
			ret = (<div>
				{!this.props.prev ? <span /> : this.prevButton()}
				{!this.props.next ? <span /> : this.nextButton()}
				{!this.props.play ? <span /> : this.playButton()}
				{!this.props.pause ? <span /> : this.pauseButton()}
				{!this.props.stop ? <span /> : this.stopButton()}
				{!this.props.reload ? <span /> : this.reloadButton()}
				{!this.props.restart ? <span /> : this.restartButton()}
				{!this.props.kill ? <span /> : this.killButton()}
			</div>);
		} else {
			ret = (<div>
				{!this.props.play ? <span /> : this.playButton()}
				{!this.props.pause ? <span /> : this.pauseButton()}
				{!this.props.stop ? <span /> : this.stopButton()}
				{!this.props.reload ? <span /> : this.reloadButton()}
			</div>);
		}	
		return (
			<div style={{  width: this.props.width,  ...this.props.style }}>
				{ret}
			</div>
		);		
	}
}

VideoController.defaultProps = {
	channel: {
		prev: {},
		next: {},
		playing: {},
		metadata: {},
	},
	destroy: false,
	kill: false,
	prev: true,
	next: true,
	play: true,
	pause: true,
	stop: true,
	reload: true,
	restart: true
};
