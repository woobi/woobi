import React from 'react';
import { RaisedButton, FlatButton, Dialog } from 'material-ui';
import { Styles } from '../styles';
import Gab from '../gab';

import debugging from 'debug';
let	debug = debugging('woobi:app:common:components:dialog');

export default class Dialog2 extends React.Component {
	constructor(props) {
		super(props);
		
		this.setProps = this.setProps.bind(this);
		
		this.name = 'dialog' + (props.name || '');
		this.name2 = 'dialog' + (props.name || '') + ' open';
		debug('Dialog receive commands on: ' + this.name);
		Gab.on(this.name, this.setProps);
		Gab.on(this.name2, this.setProps);
		
		this.handleNo = this.handleNo.bind(this); 
	}
	
	componentWillUnmount() {
		Gab.removeListener(this.name, this.setProps);
		Gab.removeListener(this.name2, this.setProps);
	}
	
	shouldComponentUpdate(props) {
		//debug('shouldComponentUpdate', this.name, (props.open !== this.props.open), this._update)
		if(this._update) {
			this._update = false;
			return true;
		}
		return props.open !== this.props.open
	}
	
	setProps(data) {
		this._update = true;
		debug('Dialog receive commands on: ' + this.name);
		if (data.html && !data.component) {
			data.component = false;
		}
		debug('new props', data);
		Object.assign(this.props, data);
		this.forceUpdate();
	}
	
	handleNo() {
		if(typeof this.props.answer == 'function') {
			this.props.answer(false);
		}
	}
	
	renderHTML() {
		if(this.props.component) {
			return this.props.component;
		} else {
			return <div dangerouslySetInnerHTML={{__html:this.props.html}} />
		}
	}
	
	render() {
		debug('## render Dialog ## ', this.name, this.props);
		const actions = [
			<FlatButton
				label={this.props.closeText}
				secondary={true}
				onClick={this.handleNo} 
				style={{ color: snowUI.__state.theme.baseTheme.palette.alternateTextColor }} 
			/>
		];

		return (
			<div>
				<Dialog
					title={this.props.title} 
					actions={this.props.closeText !== false ? actions : false}
					modal={false}
					contentStyle={this.props.contentStyle}
					bodyStyle={this.props.bodyStyle}
					open={this.props.open}
					onRequestClose={this.handleNo}
					children={this.renderHTML()}
					autoScrollBodyContent={this.props.autoScrollBodyContent}
					actionsContainerClassName={"dialog-footer"}
					titleClassName={'dialog-header'}
					style={{ zIndex: 10001 }}
					containerStyle={{ zIndex: 10001 }}
				/>
			</div>
		);
	}
}

Dialog2.defaultProps = {
	closeText: 'Close',
	open: false,
	html: 'Placeholder Text',
	title: 'Dialog',
	autoScrollBodyContent: true,
	bodyStyle: {},
	contentStyle: {},
	component: false
};
