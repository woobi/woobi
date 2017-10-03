import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Styles } from '../common/styles';
import moment from 'moment';

let debug = Debug('woobi:app:pages:epg');
		
export default class EPG extends React.Component {
	constructor(props) {
		super(props);
		
		let channels = [];
		let entries = {};
		let groups = {};
		if ( props.initialData ) {
			channels = props.initialData.channels || [];
			entries = props.initialData.entries || {};
			groups = props.initialData.groups || {};
			if ( props.initialData.channels ) {
				this._skipMount = true;
			}
		}
		
		this.displayName = 'EPG Component';

		this.state = {
			channels,	
			entries,
			groups,
			series: [],
			timers: [],
			entriesMap: [],
			numberOfGuideDays: 6,
			guidePreHours: 24,
		};
		
		debug('EPG start props', props);
		
		this._update = true;
		
		this.getChannels = this.getChannels.bind(this);
		this.getGuideData = this.getGuideData.bind(this);
		this.getChannelGroups = this.getChannelGroups.bind(this);
		this.getSeries = this.getSeries.bind(this);
		this.getTimers = this.getTimers.bind(this);
				
	}
	
	componentDidUpdate() {
		//snowUI.fadeIn();
		debug('EPG didUpdate');
	}
	
	componentDidMount() {
		debug('EPG will mount');
		if(!this._skipMount) {
			this.getChannelGroups();
			this.getChannels();
			this.getSeries();
			this.getTimers();
			const s = moment().startOf('hour').subtract(this.state.guidePreHours, 'h').unix();
			const f = moment().add(this.state.numberOfGuideDays, 'days').unix();
			this.getGuideData( false, s, f);
			
		}
		//snowUI.fadeIn();
	}
	
	componentWillUnmount() {
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ##  ## EPG ##',  props, this.state);
		this._update = true;
	}
	
	shouldComponentUpdate() {
		debug('## shouldComponentUpdate ## EPG ', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getTimers ( ) {
		this.props.Request({
			action: 'getTimers'
		})
		.then(data => {
			debug('### series data ###', data);
			this._update = true;
			this.setState({
				timers: data.timers
			});
		})
		.catch(error => {
			debug('ERROR from getSeriesTimers', error)
		});
	}
	
	getChannelGroups() {
		debug('### getChannelGroups ###');
		this.props.Request({
			action: 'getChannelGroups'
		})
		.then(data => {
			debug('### getChannelGroups ###', data);
			this._update = true;
			this.setState({
				groups: data.groups
			});
		})
		.catch(error => {
			debug('ERROR from getChannelGroups', error)
		});
	}
	
	getGuideData ( id, start, end ) {
		this.props.Request({
			action: 'getGuideData',
			id,
			start,
			end
		})
		.then(data => {
			debug('### getGuideData ###', data);
			this._update = true;
			this.setState({
				entries: { ...this.state.entries, ...data.entries.groups },
				entriesMap: data.entries.map
			});
		})
		.catch(error => {
			debug('ERROR from getGuideData', error)
		});
	}
	
	getChannels() {
		this.props.Request({
			action: 'getTVChannels'
		})
		.then(data => {
			debug('### getTVChannels ###', data);
			this._update = true;
			this.setState({
				channels: data.channels
			});
		})
		.catch(error => {
			debug('ERROR from getTVChannels', error)
		});
	}
	
	getSeries ( ) {
		this.props.Request({
			action: 'getSeriesTimers'
		})
		.then(data => {
			debug('### series data ###', data);
			this._update = true;
			this.setState({
				series: data.series
			});
		})
		.catch(error => {
			debug('ERROR from getSeriesTimers', error)
		});
	}
	
	render() {
		debug('## render  ##  EPG ', this.props, this.state);
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


EPG.getInitialData = function(params, location) {
	let ret = {
		channels: {
			action: 'getTVChannels',
		},
		entries: {
			action: 'getGuideData',
		},
		groups: {
			action: 'getChannelGroups',
		}
	}
	return {}
}
