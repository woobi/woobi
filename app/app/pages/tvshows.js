import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';

let debug = Debug('lodge:app:pages:tvshows');
		
export default class TVSHOWS extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'TVSHOWS Component';

		this.state = {
				
		};
		
		debug('TVSHOWS start props', props);
		
		this._update = true;
		
		// search 
		if(props.initialData) {
			
		} else if(props.routeParams.search) {
		
		};	
				
	}
	
	componentDidUpdate() {
		snowUI.fadeIn();
		debug('TVSHOWS didUpdate');
	}
	componentDidMount() {
		debug('TVSHOWS did mount');
		snowUI.fadeIn();
	}
	
	componentWillUnmount() {
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## TVSHOWS ##',  props, this.state);
		
		this._update = true;
		
	}
	
	shouldComponentUpdate() {
		debug('## shouldComponentUpdate ## TVSHOWS ', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	render() {
		debug('## render  ##  TVSHOWS ', this.props, this.state);
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


TVSHOWS.getInitialData = function(params, location) {
	
	return {}
}
