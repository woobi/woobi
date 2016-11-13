import React from 'react';
import Debug from 'debug'
import { Checkbox, FlatButton, FloatingActionButton, FontIcon, IconButton, IconMenu, MenuItem, RaisedButton, TextField } from 'material-ui';
import { Styles } from '../../../styles';
import Gab from '../../../gab'; 

let debug = Debug('woobi:app:common:components:addChannel:assets:udp'); 
	
export default class addChannelAssetsUDP extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannelAssetsUDP Component';
		this.state = {
			custom: false
		}
		
		this.setValue = this.props.setValue;
		
	}		
	
	render() {
		debug('## RENDER ## addChannelAssetsUDP',  this.state, this.props, Number(this.props.update), parseFloat(this.props.update), this.props.update);
		return (<div>
				<h3>{this.props.add.toUpperCase()}</h3>
				<TextField
					id="text-field-controlled"
					value={this.props.current.name}
					onChange={(el) => { this.setValue({ 'name': el.target.value }); }}
					floatingLabelText="Unique Name "
					floatingLabelFixed={true}
				/>
				<TextField
					id="text-field-controlled"
					value={this.props.current.host}
					onChange={(el) => { this.setValue({ 'host': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Host"
					fullWidth={true}
					//hintText="unique value"
				/>
				<TextField
					id="text-field-controlled"
					value={this.props.current.port}
					onChange={(el) => { this.setValue({ 'port': el.target.value }); }}
					floatingLabelFixed={true}
					floatingLabelText="Port"
					fullWidth={false}
					type="number"
				/>				
				<div style={{ height: 15 }} />
				{!this.props.sink ? <Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Play stream once setup"
					checked={this.props.current.autoPlay}
					onCheck={(el, value) => { this.setValue({  'autoPlay': value }); }}
				/> : <span />}
				{this.props.sink ? <Checkbox
					uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="check" />}
					checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="check" />}
					label="Add UDP sink to source list"
					checked={this.props.current.playSource}
					onCheck={(el, value) => { this.setValue({  'playSource': value }); }}
				/> : <span />}
				<div style={{ height: 15 }} />
				<RaisedButton
					label={(!isNaN(parseFloat(this.props.update)) ? "Update" : "Add") + " UDP " + (this.props.sink ? "Source" : "Stream")}
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

addChannelAssetsUDP.defaultProps = {
	current: {},
	sink: false
}
