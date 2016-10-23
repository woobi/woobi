import React from 'react';
import { Snackbar } from 'material-ui';
import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:snackbar');

class SnackbarExampleSimple extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			  autoHideDuration: 10,
			  message: 'Error Event',
			  open: false,
		};
		
		// binders
		this.handleChangeDuration = this.handleChangeDuration.bind(this);
		this.handleRequestClose = this.handleRequestClose.bind(this);
		
	}
	
	handleTouchTap()  {
		this.setState({
			open: true,
		});
	}

	handleActionTouchTap() {
		alert('We removed the event from your calendar.');
	}

	handleChangeDuration(event)  {
		const value = event.target.value;
		this.setState({
			autoHideDuration: value.length > 0 ? parseInt(value) : 0,
		});
	}

	handleRequestClose() {
		this.props.setParentState({
			newalert: {
				show: false
			}
		});
	}
	
	renderError(data) {
		try {
			var myerror = JSON.stringify(data.error, null, 4);
		} catch(e) {
			var myerror = 'I encountered an error. Please check the console for the error object';
			debug(data);
		}
		var senderror = (<pre>{myerror}</pre>);
		return senderror;
	}
	
	renderSuccess(data) {
		return data;
	}
	
	renderHTML() {
		debug(this.props);
		if(this.props.data) {
			if(this.props.data.error) {
				return this.renderError(this.props.data);
			}
			return this.renderSuccess(this.props.data);
		} else if(this.props.component) {
			return this.props.component;
		} else {
			return <div dangerouslySetInnerHTML={{__html:this.props.html}} />
		}
	}
	
	render() {
		
		let message = this.renderHTML();
		
		return (<div>
				<Snackbar
					bodyStyle={this.props.bodyStyle || {}}
					open={this.props.open}
					message={message}
					action={this.props.action}
					autoHideDuration={this.props.autoHideDuration}
					onActionTouchTap={this.props.onActionTouchTap || this.handleRequestClose}
					onRequestClose={() => {
						this.props.setParentState({
							newalert: {
								show: false
							}
						});
					}}
				/>
		</div>);
	}
}

SnackbarExampleSimple.propTypes = {
	open: React.PropTypes.bool,
	action: React.PropTypes.string,
	autoHideDuration: React.PropTypes.number,
	setParentState: React.PropTypes.func,
	onActionTouchTap: React.PropTypes.func
};
SnackbarExampleSimple.defaultProps = {
	open: false,
	html: 'Hi!',
	action: 'x',
	autoHideDuration: 0,
};

export default SnackbarExampleSimple;
