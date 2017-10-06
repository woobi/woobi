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
		Gab.removeListener('confirm open', this.setProps);
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
				label={this.state.yesText}
				primary={this.state.yesStyle.primary}
				onClick={this.handleYes} 
				labelStyle={ this.state.yesStyle.labelStyle }
				backgroundColor={ this.state.yesStyle.backgroundColor } 
				style={ { float: 'left', marginRight: 20  }}
			/>,
			<RaisedButton
				label={this.state.noText}
				primary={this.state.noStyle.primary}
				onClick={this.handleNo}
				labelStyle={ this.state.noStyle.labelStyle }
				backgroundColor={ this.state.noStyle.backgroundColor } 
				style={ { float: 'left' }}
			/>,
			<div className="clearfix" ></div>
		];
		return (
			<div>
				
				<Dialog
					title={this.state.title}
					actions={actions}
					modal={true}
					open={this.state.open}
					className={this.state.class}
					style={this.state.style}
					autoScrollBodyContent={true}
					actionsContainerStyle={{ clear: 'both' }}
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
	class: '',
	yesStyle: {
		backgroundColor: false,
		labelStyle: {},
		primary: false,
	},
	noStyle: {
		backgroundColor: false,
		labelStyle: {},
		primary: false,
	}
};
Confirm.childContextTypes = {
    muiTheme: React.PropTypes.object
};
