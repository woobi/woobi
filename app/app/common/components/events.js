import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';
import { isObject, isArray } from 'lodash';
import { ColorMe } from 'app/common/utils';

let debug = Debug('lodge:app:common:components:events'); 
	
export default class Events extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Events Component'	
		this.state = { 
			game: props.game,
			events: [],
			json: {}
		};
		this.getEvents(props);
		
		this.getEvents = this.getEvents.bind(this);
		this.pre = this.pre.bind(this);
		
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.game.gameday != this.state.game.gameday) {
			debug('## componentWillReceiveProps ## Events props:', props);
			this.getEvents(props);
			this._update = true;
			this.setState({
				game: props.game,
				json: {},
				events: []
			});
		} else {
			this.getEvents(this.props);
		}
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate Events ## ', this._update);
			this._update = false;
			return true;
		}
		return true;
	}
	
	getEvents(props) {
		GameDay.events('gid_' + props.game.gameday)
			.then(data => {
				// Array of objects with data related to a single game
				debug('#### Events Data', data);
				this._update = true;
				let ev = [];
				data.data.game.inning.forEach(i => {
					// top
					let tac = i.top.action;
					if(!isArray(tac)) {
						tac = [tac];
					}
					tac.forEach(a => { if(a) ev.push(a) });
					if(isArray(i.top.atbat)) {
						i.top.atbat.forEach(a => { if(a) ev.push(a) });
					}
					
					// bottom
					let bac = i.bottom.action;
					if(!isArray(bac)) {
						bac = [bac];
					}
					bac.forEach(a => { if(a) ev.push(a) });
					if(isArray(i.bottom.atbat)) i.bottom.atbat.forEach(a => { if(a) ev.push(a) });
					
				});
				ev.forEach(v => {
					this.props.sockets.addEvent(v, 'here');
				});
				this.setState({ json: data.data.game, events: ev, loading: false });
				
			})
			.catch(error => console.error('#### ERROR from Events', error));
	}
	
	events() {
		return (<div>
			{this.state.events.map(e => <div style={{ padding: 5 }}>{e.des}</div>).reverse()}
			{this.pre(this.state.json)}
		</div>);		
	}
	
	pre(data) {
		debug('## pre Events ## ', data);
		if(this.state.preed) {
			return (<div>
				<a onClick={e => {
					e.preventDefault();
					this._update = true;
					this.setState({ preed: false });
				}} style={{
					borderRadius: 2,
					border: '1px solid #505050',
					borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
					background: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
					padding: 5,
					cursor: 'hand',
					textDecoration: 'none',
					color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
				}} > Hide Event Data </a>
				<pre>{JSON.stringify(data, null, 4)}</pre>
			</div>);
		} else {
			return (<div>
				<a onClick={e => {
					e.preventDefault();
					this._update = true;
					this.setState({ preed: true });
				}} style={{
					borderRadius: 2,
					border: '1px solid #505050',
					borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
					background: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
					padding: 5,
					cursor: 'hand',
					textDecoration: 'none',
					color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
				}} > Show Event Data </a>
			</div>);
		}
	}
	
	render() {
		debug('## RENDER ## Events',  this.state, this.props);
						
		let board = this.events();
		
		return (<div >
			<div className="events">{board}</div>
		</div>);
	}
}

Events.propTypes = {
	game: React.PropTypes.string
};

Events.defaultProps = {
	game: false
};
