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
			loop: channel2.loop,
			noTransition: channel2.noTransition,
			assets: channel2.assets,
			files: channel2.files,
			hls: channel2.hls.hls ? channel2.hls : false,
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
				onCheck={(el, value) => { this.props.setValue({ 'keep': value }); }}
			/>
			<Checkbox
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="queue_play_next" />}
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="queue_play_next" />}
				label="Start on boot"
				checked={this.props.autostart}
				onCheck={(el, value) => { this.props.setValue({ 'autostart': value }); }}
			/>
			<div style={{ height: 15 }} />
			<RaisedButton
				label="Back (HLS)"
				primary={true}
				onTouchTap={() => (this.props.changeScreen(2))} 
				style={{float: 'left', }}
			/>
			<RaisedButton
				label="Add Channel"
				secondary={true}
				onTouchTap={() => (this.props.addChannel(channel))} 
				style={{float: 'left', }} 
			/>
			<div className="clearfix" style={{ height: 15 }} />
			<pre style={{ background: this.props.theme.palette.canvasColor, color: this.props.theme.palette.textColor }}>{channels}</pre>
		</div>);
	}
}

addChannelReview.defaultProps = {
	name: {},
	assets: []
}
