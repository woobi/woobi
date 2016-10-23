import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';

let debug = Debug('lodge:app:common:components:feed'); 
	
export default class Feed extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Feed Component'	
		this.state = { 
			game: props.game,
			feed: {},
		};
		this.getFeed(props);
		
		this.getFeed = this.getFeed.bind(this);
		
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.game != this.state.game) {
			debug('## componentWillReceiveProps ## Feed props:', props);
			this.getFeed(props);
			this._update = true;
			this.setState({
				game: props.game,
				feed: {}
			});
		}
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate Feed ## ', this._update);
			this._update = false;
			return true;
		}
		return false;
	}
	
	getFeed(props) {
		GameDay.feed('gid_' + props.game)
			.then(data => {
				// Array of objects with data related to a single game
				debug('#### Feed Data', data);
				this._update = true;
				this.setState({ feed: data.data.game, loading: false });
				
			})
			.catch(error => console.log('ERROR from Feed', error));
	}
	
	feed() {
		return (<div>
			<pre >{JSON.stringify(this.state.feed, null, 4)}</pre>
		</div>);		
	}
	
	render() {
		debug('## RENDER ## Feed',  this.state, this.props);
						
		let board = this.feed();
		
		return (<div style={{ padding: 20 }} >
			<div className="feed">{board}</div>
		</div>);
	}
}

Feed.propTypes = {
	game: React.PropTypes.string
};

Feed.defaultProps = {
	game: false
};
