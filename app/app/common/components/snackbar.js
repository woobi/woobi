import React from 'react';
import { Snackbar } from 'material-ui';
import debugging from 'debug';
import Gab from '../gab';
import { Styles } from '../styles';
import { ColorMe, naturalSort } from '../utils';

let	debug = debugging('woobi:app:common:components:snackbar');

class SnackbarExampleSimple extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			  autoHideDuration: 10,
			  message: 'Error Event',
			  open: false,
		};
		
		// cache
		this.cache = [];
		
		// binders
		this.handleChangeDuration = this.handleChangeDuration.bind(this);
		this.handleRequestClose = this.handleRequestClose.bind(this);
		this.onRequestClose = this.onRequestClose.bind(this);
 		this.setProps = this.setProps.bind(this);
 		
		Gab.removeListener('snackbar', this.setProps);
		
		Gab.on('snackbar', this.setProps);
		
	}
	
	setProps( data ) {
		debug('snackbar got emitted',  this.state.open, data, this.cache);
		if ( this.props.open ) {
			this.cache = [ ...this.cache, data ];
		} else {
			this.props = Object.assign(this.props, data);
			this.forceUpdate();
		}
	}
	
	componentWillUnmount() {
		Gab.removeListener('snackbar', this.setProps);
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
		this.setProps({ open: false });
	}
	
	onRequestClose( how ) {
		debug( 'snackbar closed', 'check for cache', this.cache.length, how, this.cache);
		this.props.open = false; ;
		if ( this.cache.length > 0 ) {
			this.setProps( this.cache.shift() );
		} else {
			this.forceUpdate();
		}
		if (typeof this.props.onRequestClose === 'function') {
			this.props.onRequestClose();
		}
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
	
	renderHTML(bodyStyle) {
		//debug(this.props);
		if(this.props.data) {
			if(this.props.data.error) {
				return this.renderError(this.props.data);
			}
			return this.renderSuccess(this.props.data);
		} else if(this.props.component) {
			return this.props.component;
		} else {
			return <div dangerouslySetInnerHTML={{__html: '<div style="color:' +bodyStyle.color+ '">' + this.props.html + '</div>'}} />
		}
	}
	
	render() {
		
		
		let bodyStyle = {};
		if(this.props.style) {
			const colors = {
				danger: {
					bg: Styles.Colors.deepOrangeA700,
					color: '#fff'
				},
				warning: {
					bg: Styles.Colors.amber800,
					color: '#000'
				},
				info: {
					bg: Styles.Colors.blue800,
					color: '#fff'
				},
				success: {
					bg: Styles.Colors.lightGreen500,
					color: Styles.Colors.grey900
				}
			};
			bodyStyle =  {
				backgroundColor: colors[this.props.style] ? colors[this.props.style].bg : colors.info.bg,
				color: colors[this.props.style] ? colors[this.props.style].color : colors.info.color
			};
		}
		//debug('props', this.props, bodyStyle)
		let message = this.renderHTML(bodyStyle);
		return (<div>
				<Snackbar
					bodyStyle={bodyStyle}
					open={this.props.open}
					message={message}
					action={this.props.action}
					autoHideDuration={this.props.autoHideDuration}
					onActionTouchTap={this.props.onActionTouchTap || this.handleRequestClose}
					onRequestClose={this.onRequestClose}
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
	style: 'info'
};

export default SnackbarExampleSimple;
