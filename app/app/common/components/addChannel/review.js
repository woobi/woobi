import React from 'react';
import Debug from 'debug'
import { Checkbox, FlatButton, FontIcon, RaisedButton } from 'material-ui';
import { Styles } from '../../styles';
import Gab from '../../gab';

let debug = Debug('lodge:app:common:components:addChannel:review'); 
	
export default class addChannelReview extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannelReview Component';
		this.state = {}
	}
	
	render() {
		debug('## RENDER ## addChannelReview',  this.state, this.props);
		let channel2 = { ...this.props };
		let channel = {
			name: channel2.name,
			out: channel2.output ? channel2.out : false,
			loop: channel2.loop,
			noTransition: channel2.noTransition,
			assets: channel2.assets,
			files: channel2.files,
			hls: channel2.hls.hls ? channel2.hls : false,
			requestCommands: channel2.requestCommands,
			socketCommands: channel2.socketCommands
		}
		let channels = JSON.stringify(channel, null, 4)
		return (<div>
			<div> Review </div>
			<div style={{ height: 15 }} />
			<Checkbox
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="save" />}
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="save" />}
				label="Save this config"
				checked={this.props.keep}
				onCheck={(el, value) => { this.props.setValue({ 'keep': value, 'start': value === false ? true : this.props.start, 'start': value === false ? true : this.props.start }); }}
			/>
			{this.props.keep ? <Checkbox
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="android" />}
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="android" />}
				label="Start on boot"
				checked={this.props.autostart}
				onCheck={(el, value) => { this.props.setValue({ 'autostart': value }); }}
			/> : <span />}
			<Checkbox
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="play_circle_filled" />}
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="play_circle_filled" />}
				label="Start Now"
				disabled={!this.props.keep}
				checked={this.props.start}
				onCheck={(el, value) => { this.props.setValue({ 'start': this.props.keep ? value : true }); }}
			/>
			<div style={{ height: 15 }} />
			<RaisedButton
				label="Back (HLS)"
				primary={true}
				onTouchTap={() => (this.props.changeScreen(2))} 
				style={{float: 'left', }}
			/>
			<RaisedButton
				label={this.props.saved._id && this.props.keep ? "Update Channel" : "Play Channel"}
				secondary={true}
				onTouchTap={() => (this.props.saved._id && this.props.keep ? this.props.updateChannel(channel) : this.props.addChannel(channel))} 
				style={{float: 'left', }} 
			/>
			<div className="clearfix" style={{ height: 15 }} />
			<pre style={{ background: this.props.theme.palette.canvasColor, color: this.props.theme.palette.textColor }}>{channels}</pre>
		</div>);
	}
}

addChannelReview.defaultProps = {
	name: {},
	assets: [],
	saved: {}
}
