import React from 'react';
import Debug from 'debug'
import Name from './addChannel/name';
import Assets from './addChannel/assets';
import Review from './addChannel/review';
import HLS from './addChannel/hls';
import { IconMenu, MenuItem, RaisedButton, FlatButton, Step, StepLabel, Stepper } from 'material-ui';
import { Styles } from '../styles';
import Gab from '../gab';

let debug = Debug('lodge:app:common:components:addChannel'); 
let SCREENS = [ Name, Assets, HLS, Review ];
export default class addChannel extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannel Component';
		
		this._default = addChannel.defaultProps;
		
		let config = props.current ? JSON.parse(props.current.config) : {};
		let current = props.current || {};
		let add = { ...props };
		add.autostart = current.autostart || false;
		add.keep = current._id || false;
		add.start = current._id ? false : true;
		add.saved = current;
		
		this.state = Object.assign(add, config);
		
		this.changeScreen = this.changeScreen.bind(this);
		this.addSource = this.addSource.bind(this);
		this.addFile = this.addFile.bind(this);
		
	}
	
	componentDidMount() {
		//debug('######### componentDidMount  ##  videoProgress',  this.props);
		
	}
	
	componentWillUnmount() {
	}
	
	componentWillReceiveProps(props) {
		debug('got props', props);
		if (!props.current) {
			this.setState(this._default);
		}
		if(props.presets != this.state.presets) {
			this.setState({ presets: props.presets });
		}
	}
	
	changeScreen(screen) {
		this.setState({ screen });
	}
	
	setValue(stateChange) {
		this.setState(stateChange);
	}
	
	addSource(source, update) {
		let sources = this.state.assets.filter((r, i) => (i !== update));
		sources.push(source)
		this.setState({ assets: sources });
	}
	
	addFile(source, update) {
		let sources = this.state.files.filter((r, i) => (i !== update));
		sources.push(source)
		this.setState({ files: sources });
	}
	
	removeSource(update) {
		let sources = this.state.assets.filter((r, i) => (i !== update));
		this.setState({ assets: sources });
	}
	
	removeFile(update) {
		let sources = this.state.files.filter((r, i) => (i !== update));
		this.setState({ files: sources });
	}
		
	addChannel(config = {}) {
		let c = { ...config };
		config = JSON.stringify(config);
		debug(c, config);
		Gab.emit('snackbar', {
			style: 'warning',
			html: 'Adding channel ' + c.name,
			open: true,
			onRequestClose: () => {}
		});
		let autostart = this.state.autostart ? 'yes' : 'no';
		let keep = this.state.keep ? 'yes' : 'no';
		let start = this.state.start ? 'yes' : 'no';
		Gab.rawRequest('/alvin/new/channel/?config=' + config + '&keep=' + keep + '&autostart=' + autostart + '&start=' + start, false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			if(data.success) {
				this.props.goTo({
					path: this.props.addPath ? this.props.addPath : this.state.start ? '/channels' : '/channels/manage',
					page: 'Channel Added'
				}, false, () => {
					Gab.emit('snackbar', {
						style: 'success',
						html: data.message,
						open: true,
						onRequestClose: () => {}
					});
				});
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: data.error,
				open: true,
				onRequestClose: () => {}
			});
		});
	}
	
	updateChannel(config = {}) {
		let c = { ...config };
		config = JSON.stringify(config);
		debug(c, config);
		Gab.emit('snackbar', {
			style: 'warning',
			html: 'Updating channel ' + c.name,
			open: true,
			onRequestClose: () => {}
		});
		let autostart = this.state.autostart ? 'yes' : 'no';
		let keep = this.state.keep ? 'yes' : 'no';
		Gab.rawRequest('/alvin/update/channel/' + this.state.saved._id + '/?config=' + config + '&keep=' + keep + '&autostart=' + autostart, false)
		.then(data => {
			//Gab.emit('snackbar', { open: false });
			if(data.success) {
				this.props.goTo({
					path: this.props.updatePath ? this.props.updatePath : '/channels/manage',
					page: 'Channel Updated'
				}, false, () => {
					Gab.emit('snackbar', {
						style: 'success',
						html: data.message,
						open: true,
						onRequestClose: () => {}
					});
				});
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: data.error,
				open: true,
				onRequestClose: () => {}
			});
		});
	}
	
	render() {
		//debug('## RENDER ## addChannel',  this.state, this.props);
		return (<div>		
			{this.getScreen.call(this, this.state.screen)}
		</div>);
	}
	
	getScreen(n) {
		let Screen = SCREENS[n];
		return <Screen theme={this.props.theme} addSource={this.addSource} removeFile={this.removeFile.bind(this)} removeSource={this.removeSource.bind(this)} addChannel={this.addChannel.bind(this)} updateChannel={this.updateChannel.bind(this)} addFile={this.addFile} { ...this.state } changeScreen={this.changeScreen} setValue={this.setValue.bind(this)} />
	}
}

addChannel.defaultProps = {
	presets: {},
	current: false,
	name: '',
	files: [],
	assets: [],
	loop: true,
	noTransition: false,
	hls: { hls: true },
	screen: 0,
	autostart: false,
	keep: false,
	start: true,
	saved: {},
}
