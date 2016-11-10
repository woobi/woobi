import React from 'react';
import Debug from 'debug'
import { Checkbox, FlatButton, FontIcon, IconMenu, MenuItem, RaisedButton, TextField } from 'material-ui';
import { Styles } from '../../styles';
import Gab from '../../gab';
import { map } from 'lodash';

let debug = Debug('lodge:app:common:components:addChannel:name'); 
	
export default class addChannelName extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannelName Component';
		this.state = {}
	}
	
	
	render() {
		debug('## RENDER ## addChannelName',  this.state, this.props);
		return (<div>
			
			<IconMenu
				iconButtonElement={<div style={{ color: Styles.Colors.lightGreenA400, cursor: 'pointer' }}> Use A Preset</div>}
				anchorOrigin={{horizontal: 'left', vertical: 'top'}}
				targetOrigin={{horizontal: 'left', vertical: 'top'}}
			>
				{map(this.props.presets, (p, k) => {
					return (<MenuItem primaryText={k} onClick={(e) => {
						e.preventDefault(); 
						this.props.setValue(p);
					}} />);
				})}					
				
			</IconMenu>
			<div style={{  width: 15, height: 15 }} />
			<div> 
				 <TextField
					id="text-field-controlled"
					value={this.props.name}
					onChange={(el) => { this.props.setValue({ 'name': el.target.value }); }}
					hintText="Name used to access channel"
					//hintText="unique value"
				/>
			</div>
			<Checkbox
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="loop" />}
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="loop" />}
				label="Loop Channel"
				checked={this.props.loop}
				onCheck={(el, value) => { this.props.setValue({ 'loop': value }); }}
			/>
			<Checkbox
				uncheckedIcon={<FontIcon className="material-icons"  color={this.props.theme.palette.disabledColor} children="queue_play_next" />}
				checkedIcon={<FontIcon className="material-icons"  color={Styles.Colors.lightGreenA400} children="queue_play_next" />}
				label="Play transition between media"
				checked={this.props.noTransition}
				onCheck={(el, value) => { this.props.setValue({ 'noTransition': value }); }}
			/>
			<br />
			<br />
			<RaisedButton
				label="Next (Assets)"
				secondary={true}
				onTouchTap={() => (this.props.changeScreen(1))} 
				style={{float: 'left' }} 
			/>
		</div>);
	}
}

addChannelName.defaultProps = {
	data: {},
	presets: {},
}
