import React from 'react';
import Debug from 'debug'
import { Checkbox, FlatButton, FloatingActionButton, FontIcon, IconButton, IconMenu, MenuItem, RaisedButton, TextField } from 'material-ui';
import { Styles } from '../../../styles';
import Gab from '../../../gab'; 

let debug = Debug('woobi:app:common:components:addChannel:assets:file'); 
	
export default class addChannelAssetsFile extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannelAssetsFile Component';
		this.state = {
			custom: props.current.onlyOptions ? true : false
		}
		
		this.setValue = this.props.setValue;
		
	}		
	
	render() {
		debug('## RENDER ## addChannelAssetsFile',  this.state, this.props);
		let picked = (this.props.current.stream  || this.props.current.encode || this.state.custom);
		return (<div>
				<h3>{this.props.add.toUpperCase()}</h3>
				<TextField
					id="text-field-controlled"
					value={this.props.current.name}
					onChange={(el) => { this.setValue({ 'name': el.target.value }); }}
					floatingLabelText="Unique Name "
					floatingLabelFixed={true}
				/>
				<div className="clearfix" />
				<TextField
					id="text-field-controlled"
					value={this.props.current.inputFormat}
					onChange={(el) => { this.setValue({ 'inputFormat': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Input Format"
					fullWidth={false}
				/>
				<TextField
					id="text-field-controlled"
					value={this.props.current.file}
					onChange={(el) => { this.setValue({ 'file': el.target.value }); }}
					hintText="file or ffmpeg input string"
					floatingLabelFixed={true}
					floatingLabelText="Any acceptable ffmpeg input. A directory will be split into individual source files"
					fullWidth={true}
				/>
				
				<TextField
					id="text-field-controlled"
					value={Array.isArray(this.props.current.inputOptions) ? this.props.current.inputOptions.join(' ') : this.props.current.inputOptions ? this.props.current.inputOptions : ''}
					onChange={(el) => { this.setValue({ 'inputOptions': el.target.value.split(' ') }); }}
					floatingLabelFixed={true}
					floatingLabelText="Input Options"
					fullWidth={true} 
					hintText="-re"
				/>
				<TextField
					id="text-field-controlled"
					value={Array.isArray(this.props.current.outputOptions) ? this.props.current.outputOptions.join(' ') :  this.props.current.outputOptions ?  this.props.current.outputOptions : ''}
					onChange={(el) => { this.setValue({ 'outputOptions': el.target.value.split(' ') }); }}
					floatingLabelFixed={true}
					floatingLabelText="Output Options"
					fullWidth={true}
					hintText=""
				/>
				{this.props.current.passthrough || !picked ? <Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Passthrough"
					checked={this.props.current.passthrough || true}
					//onCheck={(el, value) => { this.setValue({ 'passthrough': value,  'encode': false, 'stream': false });  this.setState({ 'custom':  false }); }}
				/> : <span />}
				{this.props.current.encode || !picked ? <Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Default Encode"
					checked={this.props.current.encode}
					onCheck={(el, value) => { this.setValue({ 'encode': value,  'passthrough': !value, 'streamable': false });  this.setState({ 'custom':  false }); }}
				/> : <span />}
				{this.props.current.streamable || !picked ? <Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Default Stream"
					checked={this.props.current.streamable}
					onCheck={(el, value) => { this.setValue({ 'streamable': value,  'encode': false, 'passthrough': !value });  this.setState({ 'custom':  false }); }}
				/> : <span />}
				{this.state.custom || !picked ? <Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Custom Options"
					checked={this.state.custom}
					onCheck={(el, value) => { this.setState({ 'custom': value  });  this.setValue({  'encode': false, 'streamable': false, passthrough: !value }); }}
				/> : <span />}
				{this.state.custom  ? <TextField
					id="text-field-controlled"
					value={Array.isArray(this.props.current.onlyOptions) ? this.props.current.onlyOptions.join(' ') : this.props.current.onlyOptions ? this.props.current.onlyOptions : ''}
					onChange={(el) => { this.setValue({ 'onlyOptions': el.target.value.split(' ') }); }}
					floatingLabelFixed={true}
					floatingLabelText="Custom Options"
					fullWidth={true}
					hintText=""
				/> : <span />}
				
				<TextField
					id="text-field-controlled"
					value={this.props.current.format}
					onChange={(el) => { this.setValue({ 'format': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Output Format"
					fullWidth={false}
					hintText="mpegts"
				/>
				
				<div style={{ height: 15 }} />
				<Checkbox
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="loop" />}
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="loop" />}
					label="Loop File"
					checked={this.props.current.loop}
					onCheck={(el, value) => { this.setValue({ 'loop': value }); }}
				/>
				<div style={{ height: 15 }} />
				<RaisedButton
					label={!isNaN(parseFloat(this.props.update)) ? "Update Source" : "Add Source"}
					primary={false}
					onTouchTap={this.props.addSource} 
					style={{float: 'left',  }}  
				/>
				{!isNaN(parseFloat(this.props.update))  ? <RaisedButton
					label={"Cancel"}
					primary={true}
					onTouchTap={() => { 
						this.props.assetsState({ add: false, update: false, current: {} });
					}} 
					style={{float: 'left',  }}  
				/> : <span />}
				<div style={{ height: 15 }} />
				<div style={{ height: 15 }} />
		</div>);
	}
}

addChannelAssetsFile.defaultProps = {
	current: {},
}
