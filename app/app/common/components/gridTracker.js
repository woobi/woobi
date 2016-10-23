import React from 'react';
import Debug from 'debug'
import { FontIcon, IconButton } from 'material-ui';
import { Styles } from '../styles';
import Gab from 'app/common/gab';

let debug = Debug('lodge:app:common:components:gridTracker'); 
	
class Rulers extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Rulers Component'	
		this.state = {};
	}
	
	render() {
		//debug('## RENDER ## Rulers');
		
		var verticalStyle = {
			backgroundColor: 'transparent',
			height: this.props.height,
			width: '1px',
			position: 'absolute',
			left: (this.props.x) + 'px',
			top: '0',
			bottom: '0',
			zIndex: 99,
			borderLeft: '1px dotted ' + this.props.color,
			opacity: .5,
		};
		var horizontalStyle = {
			backgroundColor: 'transparent',
			height: '1px',
			width: '100%',
			position: 'absolute',
			top: (this.props.y) + 'px',
			left: '0',
			right:'0',
			zIndex: 99,
			borderBottom: '1px dotted ' + this.props.color,
			opacity: .5,
		};
		
		debug('## RENDER ## Rulers', verticalStyle, horizontalStyle);
		
		return (
			<div>
				<svg style={verticalStyle} />
				<svg style={horizontalStyle} />
			</div>
		)
	}
}

export default class GridTracker extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'GridTracker Component'	
		//debug('## constructor ## GridTracker', props);
		this.state = { 
			x: -5,
			y: -5,
			...props
		};
				
		this.mousemove = this.mousemove.bind(this);
		this.inBounds = this.inBounds.bind(this);
		
		//Gab.on('mousemove', this.mousemove);
		if(props.listen) {
			window.removeEventListener('mousemove', this.mousemove);
			window.addEventListener("mousemove", this.mousemove);
		} 
	}
	
	componentWillUnmount() {
		window.removeEventListener('mousemove', this.mousemove);
	}
	
	componentWillReceiveProps(props) {
		//debug('## componentWillReceiveProps ## GridTracker', props);
		if(props.listen || props.heightAdjustment || props.factor || props.color || props.bound) {
			if(props.listen) {
				//window.removeEventListener('mousemove', this.mousemove);
				window.addEventListener("mousemove", this.mousemove);
			} else { 
				window.removeEventListener('mousemove', this.mousemove);
			}
			if(props.factor != this.state.factor || props.heightAdjustment != this.state.heightAdjustment ) {
				this._update = true;
			}
			this.setState({
				...props
			});
		}
	}
	
	inBounds(xx, yy, bound) {
		//debug('## inBounds ##', Number(this.state.y) <= this.state.bound.height, Number(this.state.y) , this.state.bound.height, Number(this.state.x) <= this.state.bound.width, Number(this.state.x) , this.state.bound.width);
		let y = Number(yy) <= bound.height && (yy > 0 && yy < bound.height - this.props.heightAdjustment);
		let x = Number(xx) <= bound.width && xx > 0;
		if( x && y) {
			return true;
		} 
		return false
	}
	
	mousemove(e) {
		let bound = this.refs.zone.getBoundingClientRect();
		//debug('## mousemove ##', bound.top, e.clientY, bound.left, e.clientX, e);
		let center = bound.width / 2;
		let height = bound.height - this.props.heightAdjustment;
		let x = Number(e.clientX - bound.left);
		let y = Number(e.clientY - bound.top);
		let z = height - y;
		let ib = this.inBounds(x, y, bound);
		let cb = this.state.inBounds !== ib;
		if(ib || cb) {
			this.setState({
				x,
				y,
				height,
				z,
				xx: (((x - center)  / 12) / Number(this.props.factor)).clip(3), 
				yy: ((z / 12) / Number(this.props.factor)).clip(3),
				inBounds: ib,
				changeInBounds: cb,
			});
		}
	}
	
	shouldComponentUpdate() {
		let inBounds = this.state.inBounds;
		let changeInBounds = this.state.changeInBounds;
		if(inBounds || changeInBounds || this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	render() {
		debug('## RENDER ## GridTracker', this.state, this.props);
		if(this.props.listen === false) {
			return <span />
		}
		
		let style = {
			position: 'absolute',
			left: 0,
			right: 0,
			bottom: this.props.heightAdjustment - 22,
			textAlign: 'center',
			height: 15,
			color: this.props.color,
			fontFamily: 'Courier New',
			fontSize: 12,
			zIndex: 100,
			display: this.props.showCoords ? 'block' : 'none'
		};
		let container = {
			width: '100%',
			height: '100%',
			position: 'absolute',
			top: 0,
			left: 0,
			
			cursor: this.props.showRulers ? 'none' : 'inherit'
		}
		let rulerProps = {
			x: this.state.x + 0,
			y: this.state.y + 0,
			height: this.state.height,
			color: this.props.color
		};
		
		return(<div ref="zone" style={container} onMouseEnter={() => {
				
			}} onMouseOut={() => {
				
			}} >
			{this.props.showRulers && this.state.inBounds ? <Rulers { ...rulerProps } /> : ""}
			<div style={style} >
				px: {this.state.xx}, pz: {this.state.yy}
			</div>
			
		</div>);

		
	}
}

GridTracker.defaultProps = {
	showRulers: true,
    showCoords: true,
    color: 'white',
    factor: 5,
    heightAdjustment: 0,
    listen: true,
}

Number.prototype.between = function(a, b, inclusive) {
  var min = Math.min(a, b),
    max = Math.max(a, b);

  return inclusive ? this >= min && this <= max : this > min && this < max;
}
