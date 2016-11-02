import React from 'react';
import { RaisedButton, FlatButton, Dialog } from 'material-ui';
import { Styles } from '../styles';
import Gab from '../gab';

import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:dialog');

export default class Dialog2 extends React.Component {
	constructor(props) {
		super(props);
		
		this.setProps = this.setProps.bind(this);
		
		Gab.on('dialog open', this.setProps);
		
		this.handleNo = this.handleNo.bind(this);
	}
	
	componentWillUnmount() {
		Gab.removeListener('dialog open', this.setProps);
	}
	
	setProps(data) {
		this.props = Object.assign(this.props, data);
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
		debug('## render Dialog ## ', this.props);
		const actions = [
			<FlatButton
				label={this.props.closeText}
				secondary={true}
				onTouchTap={this.handleNo} 
				style={{ color: snowUI.__state.theme.baseTheme.palette.alternateTextColor }} 
			/>
		];

		return (
			<div>
				<Dialog
					title={this.props.title}
					actions={actions}
					modal={false}
					bodyStyle={this.props.bodyStyle}
					open={this.props.open}
					onRequestClose={this.handleNo}
					children={this.renderHTML()}
					autoScrollBodyContent={this.props.autoScrollBodyContent}
					actionsContainerClassName={"dialog-footer"}
					titleClassName={'dialog-header'}
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
	bodyStyle: {}
};
