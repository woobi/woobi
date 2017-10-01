import React from 'react';
import { RaisedButton, FlatButton, Dialog } from 'material-ui';
import { Styles } from '../styles';
import Gab from '../gab';
import debugging from 'debug';
let	debug = debugging('woobi:app:common:components:confirm');

export default class Confirm extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = props;
		
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
		debug('Confirm received commands  ' , data);
		let props = { ...Confirm.defaultProps };
		Object.assign(props, data);
		if (!props.component) {
			props.component = false;
		}
		this.setState(props);
	}
	
	componentWillUnmount() {
		Gab.removeListener('confirm open', this.setProps);
	}
	
	handleYes() {
		if(typeof this.state.answer == 'function') {
			this.state.answer(true);
		}
	}
	
	handleNo() {
		debug('Confirm received cancel  ' , this.state, typeof this.state.answer == 'function');
		if(typeof this.state.answer == 'function') {
			this.state.answer(false);
		}
	}
	
	renderHTML() {
		if(this.state.component) {
			return (<div children={this.state.component} />);
		} else {
			return <div dangerouslySetInnerHTML={{__html:this.state.html}} />
		}
	}
	
	render() {
		const actions = [
			<RaisedButton
				label={this.state.noText}
				primary={true}
				onClick={this.handleNo}
				
			/>,
			<RaisedButton
				label={this.state.yesText}
				primary={false}
				onClick={this.handleYes} 
				style={{float: 'left', color: this.props.theme.baseTheme.palette.alternateTextColor }} 
			/>,
			
		];
		return (
			<div>
				
				<Dialog
					title={this.state.title}
					actions={actions}
					modal={true}
					open={this.state.open}
					className={this.state.class}
				>
					{this.renderHTML()}
				</Dialog>
			</div>
		);
	}
}

Confirm.defaultProps = {
	yesText: 'Delete',
	noText: 'Cancel',
	open: false,
	component: false,
	html: 'Placeholder Text',
	title: 'Confirm',
	style: {
		body: {}
	},
	class: ''
};
Confirm.childContextTypes = {
    muiTheme: React.PropTypes.object
};
