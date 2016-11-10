import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';

let debug = Debug('lodge:app:pages:channel');
		
export default class Channel extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Channel Component';

		this.state = {
				
		};
		
		debug('Channel start props', props);
		
		this._update = true;
		
		// search 
		if(props.initialData) {
			
		} else if(props.routeParams.search) {
		};	
				
	}
	
	componentDidUpdate() {
		snowUI.fadeIn();
		debug('Channel didUpdate');
	}
	componentDidMount() {
		debug('Channel did mount');
		snowUI.fadeIn();
	}
	
	componentWillUnmount() {
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## Channel ##',  props, this.state);
		this._update = false;
		
	}
	
	shouldComponentUpdate(nextProps) {
		debug('## shouldComponentUpdate ## Channel ', this._update);
		if(this._update || this.props.currentTheme !== nextProps.currentTheme || this.props.params.action !== nextProps.params.action) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	render() {
		debug('## render  ##  Channel ', this.props, this.state);
		let children = <span />;
		
		children = (this.props.children && React.cloneElement(this.props.children, Object.assign({
			...this.props, 
			...this.state, 
		})));
		return (<div  >
			{children}
		</div>);
	}
	
	
}


Channel.getInitialData = function(params, location) {
	
	return {}
}
