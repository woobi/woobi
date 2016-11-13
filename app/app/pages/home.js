import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';

let debug = Debug('woobi:app:pages:home');
		
export default class Home extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Home Component';

		this.state = {
				
		};
		
		console.log('home start props', props.location.query);
		
		this._update = true;
		
		// search 
		if(props.initialData) {
			
		} else if(props.routeParams.search) {

		};	
				
	}
	
	componentDidUpdate() {
		snowUI.fadeIn();
		debug('didUpdate');
	}
	componentDidMount() {
		debug('did mount');
		snowUI.fadeIn();
	}
	
	componentWillUnmount() {
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## Home New Props ##',  props, this.state);
		this._update = false;
		
	}
	
	shouldComponentUpdate() {
		debug('## shouldComponentUpdate ##', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	render() {
		debug('## render  ##  Home render', this.props, this.state);
		
		return (<div style={{ width: this.props.desktop ? '70%' : '95%', margin: '0 auto' }} >
			
		</div>);
	}
	
	
}


Home.getInitialData = function(params, location) {
	
	return {}
}
