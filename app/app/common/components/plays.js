import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';

let debug = Debug('lodge:app:common:components:plays'); 
	
export default class Plays extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Plays Component'	
		this.state = { 
			game: props.game,
			plays: {},
		};
		this.getPlays(props);
		
		this.getPlays = this.getPlays.bind(this);
		this.pre = this.pre.bind(this);
		
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.game.gameday != this.state.game.gameday) {
			debug('## componentWillReceiveProps ## Plays props:', props);
			this.getPlays(props);
			this._update = true;
			this.setState({
				game: props.game,
				plays: {}
			});
		}
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate Plays ## ', this._update);
			this._update = false;
			return true;
		}
		return false;
	}
	
	getPlays(props) {
		GameDay.plays('gid_' + props.game.gameday)
			.then(data => {
				// Array of objects with data related to a single game
				debug('#### Plays Data', data);
				this._update = true;
				this.setState({ plays: data.data.game, loading: false });
				
			})
			.catch(error => console.log('ERROR from Plays', error));
	}
	
	plays() {
		return (<div>
			{this.pre(this.state.plays)}
		</div>);		
	}
	
	pre(data) {
		debug('## pre Boxscore ## ', data);
		if(this.state.preed) {
			return (<div>
				<a onClick={e => {
					e.preventDefault();
					this._update = true;
					this.setState({ preed: false });
				}} style={{
					borderRadius: 2,
					border: '1px solid #404040',
					background: '#313131',
					padding: 5,
					cursor: 'pointer',
					textDecoration: 'none',
					color: '#404040',
				}} > Hide Play Data </a>
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
					border: '1px solid #404040',
					background: '#313131',
					padding: 5,
					cursor: 'pointer',
					textDecoration: 'none',
					color: '#404040',
				}} > Show Play Data </a>
			</div>);
		}
	}
	
	render() {
		debug('## RENDER ## Plays',  this.state, this.props);
						
		let board = this.plays();
		
		return (<div >
			<div className="feed">{board}</div>
		</div>);
	}
}

Plays.propTypes = {
	game: React.PropTypes.object
};

Plays.defaultProps = {
	game:  {}
};
