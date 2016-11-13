import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';

let debug = Debug('woobi:app:pages:movies');
		
export default class Movies extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Movies Component';

		this.state = {
				
		};
		
		debug('Movies start props', props);
		
		this._update = true;
		
		// search 
		if(props.initialData) {
			
		} else if(props.routeParams.search) {
		
		};	
				
	}
	
	componentDidUpdate() {
		snowUI.fadeIn();
		debug('Movies didUpdate');
	}
	componentDidMount() {
		debug('Movies did mount');
		snowUI.fadeIn();
	}
	
	componentWillUnmount() {
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## Movies ##',  props, this.state);
		
		this._update = true;
		
	}
	
	shouldComponentUpdate() {
		debug('## shouldComponentUpdate ## Movies ', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	render() {
		debug('## render  ##  Movies ', this.props, this.state);
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


Movies.getInitialData = function(params, location) {
	
	return {}
}
