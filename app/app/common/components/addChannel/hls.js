import React from 'react';
import Debug from 'debug'
import { Checkbox, FlatButton, FloatingActionButton, FontIcon, IconButton, IconMenu, MenuItem, RaisedButton, TextField } from 'material-ui';
import { Styles } from '../../styles';
import Gab from '../../gab';

let debug = Debug('lodge:app:common:components:addChannel:hls'); 
	
export default class addChannelHLS extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannelHLS Component';
		this.state = {
			options: false,
			only: false
		}
		
		this.setValue = this.setValue.bind(this);
		
	}
	
	setValue(val) {
		this.props.setValue( { hls: { ...this.props.hls, ...val } });
	}
	
	render() {
		debug('## RENDER ## addChannelHLS',  this.state, this.props);
		let picked = (this.props.hls.passthrough  || (this.state.only));
		return (<div>
			<div> HLS Stream </div>
			<p>An HLS stream requires sufficient hard drive space.  Three hours of recordings are saved. </p>
			<div style={{ height: 15 }} />
			<Checkbox
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="loop" />}
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="loop" />}
				label="Create HLS Stream"
				checked={this.props.hls.hls}
				onCheck={(el, value) => { this.setValue({ 'hls': value }); }}
			/>
			<Checkbox
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="queue_play_next" />}
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="queue_play_next" />}
				label="Change stream options"
				checked={this.state.options}
				onCheck={(el, value) => { this.setState({ 'options': value }); }}
			/>
			<div style={{ height: 15 }} />
			<div style={{ display: this.state.options ? 'block' : 'none' }}>
				<TextField
					id="text-field-controlled"
					value={this.props.hls.inputFormat}
					onChange={(el) => { this.setValue({ 'inputFormat': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Input Format"
					fullWidth={false}
					//hintText="unique value"
				/>
				<TextField
					id="text-field-controlled"
					value={this.props.hls.hlsOptions}
					onChange={(el) => { this.setValue({ 'hlsOptions': el.target.value }); }}
					hintText="-hls_list_size 0 -hls_time 5 "
					floatingLabelFixed={true}
					floatingLabelText="This will replace default hls options"
					fullWidth={true}
					//hintText="unique value"
				/>
				<TextField
					id="text-field-controlled"
					value={this.props.hls.inputOptions}
					onChange={(el) => { this.setValue({ 'inputOptions': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Input Options"
					fullWidth={true} 
					hintText=""
				/>
				<TextField
					id="text-field-controlled"
					value={this.props.hls.outputOptions}
					onChange={(el) => { this.setValue({ 'outputOptions': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Output Options"
					fullWidth={true}
					hintText=""
				/>
				<Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Default Encode"
					checked={!picked}
					onCheck={(el, value) => {  this.setValue({ 'passthrough': false, onlyOptions: false});this.setState({ only: false });}}
				/>
				<Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Passthrough"
					checked={this.props.hls.passthrough}
					onCheck={(el, value) => { this.setValue({ 'passthrough': value, onlyOptions: false }); this.setState({ only: false }); }}
				/>
				
				<Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Custom Options"
					checked={this.state.only}
					onCheck={(el, value) => { this.setValue({  onlyOptions: value ? '' : false, passthrough: false }); this.setState({ only: value }); }}
				/>
				{(this.state.only)  ? <TextField
					id="text-field-controlled"
					value={this.props.hls.onlyOptions || ''}
					onChange={(el) => { this.setValue({ 'onlyOptions': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Custom Options"
					fullWidth={true}
					hintText=""
				/> : <span />}
				<div style={{ height: 15 }} />
				<TextField
						id="text-field-controlled"
						value={this.props.hls.format}
						onChange={(el) => { this.setValue({ 'format': el.target.value }); }}
						floatingLabelFixed={true}
						floatingLabelText="Output Format"
						fullWidth={false}
						hintText="hls"
					/>
			</div>
				
			<div style={{ height: 15 }} />
			<RaisedButton
				label="Back (Assets)"
				primary={true}
				onTouchTap={() => (this.props.changeScreen(1))} 
				style={{float: 'left', }} 
			/>
			<RaisedButton
				label="Next (Review)"
				secondary={true}
				onTouchTap={() => (this.props.changeScreen(3))} 
				style={{float: 'left',}} 
			/>
		</div>);
	}
}

addChannelHLS.defaultProps = {
	hls: {}
}
