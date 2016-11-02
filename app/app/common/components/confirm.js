import React from 'react';
import { RaisedButton, FlatButton, Dialog } from 'material-ui';
import { Styles } from '../styles';
import Gab from '../gab';

let myStyles = {
	//textColor: Styles.Colors.blue600,
	//alternateTextColor: Styles.Colors.amber400,
	//accent1Color: "#FF6040",
	//accent2Color: "#F5001E",
	//accent3Color: "#FA905C"
}

export default class Modal extends React.Component {
	constructor(props) {
		super(props);
				
		this.handleYes = this.handleYes.bind(this);
		this.handleNo = this.handleNo.bind(this);
		
 		this.setProps = this.setProps.bind(this);
		
		Gab.on('confirm open', this.setProps);
		
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	setProps(data) {
		this.props = Object.assign(this.props, data);
		this.forceUpdate();
	}
	
	componentWillUnmount() {
		Gab.removeListener('confirm open', this.setProps);
	}
	
	handleYes() {
		if(typeof this.props.answer == 'function') {
			this.props.answer(true);
		}
	}
	
	handleNo() {
		if(typeof this.props.answer == 'function') {
			this.props.answer(false);
		}
	}
	
	renderHTML() {
		if(this.props.component) {
			return (<div children={this.props.component} />);
		} else {
			return <div dangerouslySetInnerHTML={{__html:this.props.html}} />
		}
	}
	
	render() {
		const actions = [
			<RaisedButton
				label={this.props.noText}
				primary={true}
				onTouchTap={this.handleNo}
				
			/>,
			<RaisedButton
				label={this.props.yesText}
				primary={false}
				onTouchTap={this.handleYes} 
				style={{float: 'left', color: this.props.theme.baseTheme.palette.alternateTextColor }} 
			/>,
			
		];

		return (
			<div>
				
				<Dialog
					title={this.props.title}
					actions={actions}
					modal={true}
					open={this.props.open}
					className={this.props.class}
				>
					{this.renderHTML()}
				</Dialog>
			</div>
		);
	}
}

Modal.defaultProps = {
	yesText: 'Delete',
	noText: 'Cancel',
	open: false,
	html: 'Placeholder Text',
	title: 'Confirm',
	style: {
		body: {}
	},
	class: 'epg__confirm epg__amber'
};
Modal.childContextTypes = {
    muiTheme: React.PropTypes.object
};
