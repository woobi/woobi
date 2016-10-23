import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';
import Lineups from 'app/common/components/lineups';
import { ColorMe } from 'app/common/utils';

let debug = Debug('lodge:app:common:components:linescore'); 
	
export default class Linescore extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Linescore Component'	
		this.state = {};
	}
	
	linescore() {
		if(this.props.gid) {
			let gid;
			if(this.props.game.id) {
				gid = this.props.game.id;
			} else {
				let sp = this.props.gid.split('_');
				gid = `${sp[0]}/${sp[1]}/${sp[2]}/${sp[3]}-${sp[4]}-${sp[5]}`;
			}
			return (<div>
				<Lineups id={gid} />
			</div>);
		}	else { 
			return <span />;
		}
	}
	
	render() {
		debug('## RENDER ## Linescore',  this.state, this.props);
		return this.linescore();
	}
}

Linescore.propTypes = {
	game: React.PropTypes.string
};

Linescore.defaultProps = {
	game: {}
};
