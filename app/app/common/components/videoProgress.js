import React from 'react';
import Debug from 'debug'

let debug = Debug('woobi:app:common:components:videoProgress'); 
	
export default class videoProgress extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'videoProgress Component';
		this.state = {
			progress: {}
		}
		this.listenForProgress = this.listenForProgress.bind(this);
	}
	
	componentDidMount() {
		//debug('######### componentDidMount  ##  videoProgress',  this.props);
		this.props.Sockets.io.on('progress report', this.listenForProgress);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('progress report', this.listenForProgress);
	}
	
	listenForProgress(who) {
		// debug('Got progress report', who.channel);
		if(who.channel === this.props.channel) {
			this.setState({ progress: who.progress });
		}		
	}
	
	progress() {
		let progress = this.state.progress;
		let text = [];
		if(progress.timemark) {
			let perc = 0;
			if(progress.percent) {
				perc = Number(progress.percent.toFixed(2)) + '%';
			} else {
				perc = 'UA';
			}
			text.push(<span key="45">{progress.timemark} of {Math.round(this.props.data.duration)} mins  </span>);
			if(progress.currentKbps) {
				text.push(<br />);
				text.push(<span key="3">  {'  ' + progress.currentKbps + '  '} kbps  </span>);
			}
			if(perc !=='UA') {
				text.push(<span key="6">  --  {perc } done</span>);
			}
		} else {
			text.push(<span key="1" />);
		}
		return <span>{text}</span>;
	}
	
	render() {
		//debug('## RENDER ## videoProgress',  this.state, this.props);
		return (this.progress());
	}
}

videoProgress.defaultProps = {
	data: {},
	progress: {}
}
