import React from 'react';
import Debug from 'debug'
import { Drawer, IconButton, IconMenu, FontIcon, MenuItem } from 'material-ui';
import { Styles } from '../styles';

let debug = Debug('woobi:app:common:components:menu'); 

		
export default class Menu extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Menu Component'	
		this.state = { ...props };
		
		this.handleToggle = () => this.setState({open: !this.state.open})
		this.handleClose = () => this.setState({open: false})
		
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.open != this.state.open) {
			debug('## componentWillReceiveProps ## menu update props:', props);
			this.setState(props);
			this._update = true;
		}
		if(props.children !== this.props.children) this._update = true;
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate ## ', this._update);
			this._update = false;
			return true;
		}
		return false;
	}
	
	render() {
		debug('## RENDER ## menu docked:'+this.props.docked+', open:'+this.props.open,'props:', this.props);
						
        let LeftDrawer = (
			<Drawer 
				docked={this.props.docked}
				open={this.props.open}
				zDepth={this.props.zDepth}
				overlayStyle={this.props.overlayStyle}
				style={this.props.style}
				className={this.props.className}
				openSecondary={this.props.secondary}
				width={this.props.width || 200}
				onRequestChange={ open => {
					if(this.props.toggleDrawer) {
						this.props.toggleDrawer( open );
					}
				}}
			>
				<div className="menu" style={Object.assign({
					height: '100%',
					width: '100%',
					overflow: 'auto',
					borderRight: '10px solid ' + this.props.theme.baseTheme.palette.canvasColor
				}, this.props.containerStyle)} >
					{this.props.children}					
				</div>
			</Drawer>
		);
		
		if(this.props.drawer) {
			return (LeftDrawer);
		} else {
			return (<div>{this.props.children}</div>);
		} 	
	}
}

