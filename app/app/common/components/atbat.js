import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';
import { isObject, isArray } from 'lodash';
import StrikeZone from './strikezone';
import { ColorMe } from 'app/common/utils';

let debug = Debug('lodge:app:common:components:atbat'); 
	
export default class AtBat extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'AtBat Component'	
		this.state = { 
			atbat: props.atbat,
		};
		
		this.pre = this.pre.bind(this);
		
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.atbat.num != this.state.atbat.num) {
			debug('## componentWillReceiveProps ## AtBat props:', props);
			this._update = true;
			this.setState({
				atbat: props.atbat,
			});
		}
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate AtBat ## ', this._update);
			this._update = false;
			return true;
		}
		return true;
	}
	
	atbat() {
		let strikezones = <span children={'No Atbat Data Yet'} />;
		if(Array.isArray(this.state.atbat.pitch)) {
			if(this.props.single) {
				strikezones = <StrikeZone atbat={this.state.atbat} { ...this.props } />;
			} else {
				strikezones = this.state.atbat.pitch.map((p,k) => (<div key={k+'sz'} style={{ float:'left', marginRight: 10 }} children={<StrikeZone force={true} atbat={this.state.atbat} pitch={k} { ...this.props }  />} />));
			}
		} else if(this.state.atbat.pitch) {
			strikezones = <StrikeZone atbat={this.state.atbat} { ...this.props }  />;
		}
		
		return strikezones;		
	}
	
	pre(data) {
		debug('## pre AtBat ## ', data);
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
				}}> HIDE AtBat Object</a>
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
				}} > Show AtBat Object </a>
			</div>);
		}
	}
	
	render() {
		debug('## RENDER ## AtBat',  this.state, this.props);
		
		return (<div children={this.atbat()} />);
	}
}

AtBat.propTypes = {
	atbat: React.PropTypes.object,
	single: React.PropTypes.bool,
	view: React.PropTypes.number,
	size: React.PropTypes.number,
};

AtBat.defaultProps = {
	atbat: {},
	single: true,
	view: -1,
	size: 5
};
