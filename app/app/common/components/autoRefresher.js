import React from 'react';
import Debug from 'debug'
import { FontIcon, IconButton } from 'material-ui';
import { Styles } from '../styles';

let debug = Debug('lodge:app:common:components:autoRefresher'); 
	
export default class AutoRefresher extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'AutoRefresher Component'	
		this.state = {};
		
		snowUI.__autoRefresher = {
			setInterval: this.startAuto.bind(this),
			clearInterval: this.quitAuto.bind(this),
			change: this.changeAuto.bind(this),
			interval: false,
			running: false
		}
		
		this.changeAuto = this.changeAuto.bind(this);
		
		if(snowUI.__autoRefresher.running) {
			this.startAuto();
		}
	}
	
	startAuto() {
		snowUI.__autoRefresher.running = true;
		clearInterval(snowUI.__autoRefresher.interval);
		snowUI.__autoRefresher.interval = setInterval(() => {snowUI.__appForceUpdate()}, 30000);
		snowUI.__appForceUpdate();
		debug('## startAuto ## AutoRefresher', snowUI.__autoRefresher);
	}
	
	quitAuto() {
		snowUI.__autoRefresher.running = false;
		clearInterval(snowUI.__autoRefresher.interval );
		snowUI.__autoRefresher.interval  = false;
		this.forceUpdate();
		debug('## quitAuto ## AutoRefresher', snowUI.__autoRefresher);
	}
	
	changeAuto(quit = false, callback) {
		debug('## changeAuto ## AutoRefresher');
		if(quit || snowUI.__autoRefresher.running) {
			this.quitAuto();
		} else {
			this.startAuto();
		}
		
		if(callback) {
			callback();
		}
	}
	
	render() {
		debug('## RENDER ## AutoRefresher');
		
		return (
			<IconButton 
				title={snowUI.__autoRefresher.running ? 'Stop auto refresh' : 'Start auto refresh'} 
				style={{ textAlign: 'left', marginLeft: 0, padding: 0, width: 40, height: 40  }} 
				onClick={e=> {
					e.preventDefault();
					this.changeAuto();
				}} 
			>
				<FontIcon 
					className="material-icons" 
					style={{fontSize:'20px'}}  
					color={snowUI.__autoRefresher.running ? Styles.Colors.limeA400 : Styles.Colors.red400} 
					children={"refresh"}
				/> 
			</IconButton>
		);
	}
}

