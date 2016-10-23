import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon, Menu, MenuItem, Popover, } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';
import { every, filter, find, isArray, isObject, isFunction, meanBy, some } from 'lodash';
import Modal from 'app/common/components/dialog';
import AtBat from 'app/common/components/atbat';
import { ColorMe, normalizePitch } from 'app/common/utils';
import ReactTooltip from 'react-tooltip';
import GridTracker from 'app/common/components/gridTracker';

let debug = Debug('lodge:app:common:components:strikezone'); 

// set the zones for a strike based on the plate width and add in the ball
//Ball radius = ((3.14*2 + 17) / 12) / 2
let LEFTZONE = Number(((17) / 12) / 2).clip(3);
let RIGHTZONE = LEFTZONE * -1;
let LEFTZONEPLUS = Number(LEFTZONE + (1.57/12)).clip(3);
let RIGHTZONEPLUS = Number(LEFTZONE + (1.57/12)) * -1;
let PITCH = {
	"SI": "Sinker", 
	"FF": "Fastball (four-seam)", 
	"IN": "Intentional Walk", 
	"SL": "Slider", 
	"CU": "Curveball", 
	"CH": "Changeup", 
	"FT": "Fastball (two-seam)", 
	"FC": "Fastball (cutter)", 
	"PO": "Pitchout", 
	"KN": "Knuckleball", 
	"FS": "Fastball (split-finger)", 
	"FA": "Fastball", 
	"NA": "Unknown", 
	"FO": "Forkball"
}
let SIZES = {
	normal: {
		pixel: 5,
		width: 255,
		height: 325,
		bigHeight: 100,
		bottom: 35,
		ballW: (1.57*2)*5,
		ballH: (1.57*2)*5,
		ballR: 25, //(1.57*2)*5,
		ballBorderWidth: 2,
		ballPLeft: 1,
		ballMLeft: -(((1.57*2)/2)*5),
		ballMTop: -(((1.57*2)/2)*5),
		ballFont: (1.57*2)*5,
		ballNumFont: 15,
		plate: 17, //20.14 if you want to acount for ball size. pfx measures center of ball
		dots: 8,
		dotsLetters: 15,
		dotsLettersFont: 10,
		desPT: 18,
		desM: 0,
		viewTop: -15,
		viewLeft: 95,
		viewWidth: 85,
		abTop: -15,
		abLeft: 2,
		abWidth: 100,
		eventWidth: 100,
		eventTop: -15,
		eventRight: 2,
		eventTA: 'right',
		zoneWidth: (1.57*2 + 17),
		zoneBorderWidth: 1,
		zoneNumFont: '28px',
		zoneNumPadding: '10px 0px',
		zoneNumMargin: 0,
	},
	umpire: {
		pixel: 5,
		width: 255,
		height: 325,
		bigHeight: 500,
		bottom: 35,
		ballW: (1.57*2)*2.5,
		ballH: (1.57*2)*2.5,
		ballR: 25,
		ballMLeft: -(((1.57*2)/2)*2.5),
		ballMTop: -(((1.57*2)/2)*2.5),
		ballBorderWidth: 1,
		miniMarginTop: -1.81,
		miniMarginLeft: -1.4,
		plate: 17, //20.14, // acounts for ball size. pfx measures center of ball
		dots: 8,
		dotsLetters: 15,
		dotsLettersFont: 10,
		desPT: 12,
		desM: -100000,
		viewTop: -15,
		viewLeft: 95,
		viewWidth: 85,
		abTop: -15,
		abLeft: 2,
		abWidth: 0,
		eventWidth: 0,
		eventTop: -15,
		eventRight: 2,
		eventTA: 'right',
		ballPLeft: 1,
		ballFont: (1.57*2)*2.5,
		zoneBorderWidth: 1,
		zoneNumFont: '0px',
		zoneNumPadding: '0px 0px',
		zoneNumMargin: 0,
	},
	small: {
		pixel: 2.5, 
		width: 125,
		plate: 17, //20.14, // acounts for ball size. pfx measures center of ball
		height: 170,
		bigHeight: 190,
		bottom: 17,
		ballW: (1.57*2)*2.5,
		ballH: (1.57*2)*2.5,
		ballR: 25,
		ballMLeft: -(((1.57*2)/2)*2.5),
		ballMTop: -(((1.57*2)/2)*2.5),
		ballBorderWidth: 1,
		miniMarginTop: -1.81,
		miniMarginLeft: -1.4,
		dots: 4,
		dotsLetters: 10,
		dotsLettersFont: 8,
		desPT: 8,
		desM: -100000,
		ballPLeft: 1,
		ballFont: (1.57*2)*2.5,
		viewTop: -15,
		viewLeft: 0,
		viewWidth: 0,
		abTop: -15,
		abLeft: 2,
		abWidth: 125,
		eventWidth: 125,
		eventTop: 155,
		eventRight: 'initial',
		eventLeft: 2,
		eventTA: 'left',
		zoneBorderWidth: 1,
		zoneNumFont: '27px',
		zoneNumPadding: '11px 0px',
		zoneNumMargin: '-5px 0 0 0'
	}
} 

let FILTERS = {
	umpire: (pitch) => {
		let PX = pitch.px;
		let PZ = pitch.pz;
		let isInXZone = ((PX <= pitch.config.leftZonePlus && PX >= pitch.config.rightZonePlus));		
		let isInYZone = (PZ <= Number(pitch.topZonePlus) && PZ >= Number(pitch.bottomZonePlus));
		let isInZone = isInXZone && isInYZone;
		let called = pitch.des.toLowerCase().search('called') > -1;
		if (called) {
			return true;
		} else if (isInZone) {
			// only balls and called strikes
			return (pitch.type === 'B')
		} else {
			return false;
		}
	} 
}

export default class StrikeZone extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'StrikeZone Component'	
		debug('StrikeZone Props', props, props.pitch, props.atbat.pitch[props.pitch]);
		
		this.setStyle = this.setStyle.bind(this);
		this.pre = this.pre.bind(this);
		this.modal = this.modal.bind(this);
		this.setSize = this.setSize.bind(this);
		this.setFilter = this.setFilter.bind(this);
		
		let filters = [];
		if(props.type === 'umpire') {
			filters.push({ which: 'des', filter: FILTERS.umpire, label: 'Umpire Zone' });
		}
		
		this.state = { 
			pitch: props.pitch || props.pitch === 0 ? props.atbat.pitch[props.pitch] : false,
			pitched: props.pitch,
			atbat: props.atbat,
			view: props.view,
			type:  props.type || 'normal',
			viewport: props.viewport || 'umpire',
			size: props.size,
			filters,
			filterable: [
				{ which: 'des', filter: ['missed', 'swinging'], label: 'Player Strikes' },
				{ which: 'des', filter: ['called'], label: 'Called Strikes' },
				{ which: 'des', filter: FILTERS.umpire, label: 'Umpire Zone' },
				{ which: 'des', filter: ['foul'], label: 'Foul Balls' },
				{ which: 'des', filter: ['play'], label: 'Hits' },
				{ which: 'type', filter: ['b'], label: 'All Balls' },
				{ which: 'type', filter: ['s'], label: 'Strikes' },
				{ which: 'type', filter: ['x'], label: 'In Play' },
				{ which: 'type', filter: ['out'], label: 'Outs' },
			],
			normalize: props.normalize,
			axis: props.axis,
			tooltip: props.tooltips,
			pitchNums: props.numbers
		};			
		
		this.state.style = this.setStyle(props.size || 5);
		
		debug('## strikezone state ##', this.state);
		
		//update bit
		this._update = true;
		this._ii = 1;
	}	
	
	componentDidMount() {}
	
	componentDidUpdate() {}
	
	componentWillReceiveProps(props) {
		
		let atbat = false;
		if(isObject(props.atbat)) {
			if(isArray(props.atbat.pitch)) {
				if(props.atbat.pitch.length !== this.state.atbat.pitch.length) {
					atbat = true;
				}
			}
		}
		debug('## componentWillReceiveProps ## ', props);
		if(props.force
			|| props.pitch != this.state.pitched
			|| atbat
			|| props.view && props.view != this.state.view
			|| props.viewport && props.viewport != this.state.viewport
			|| props.size && props.size != this.state.size
			|| props.type && props.type != this.state.type
			|| (props.numbers || props.numbers === false) && props.numbers != this.state.pitchNums
			|| (props.tooltips || props.tooltips === false) && props.tooltips != this.state.tooltip
			|| (props.axis || props.axis === false) && props.axis != this.state.axis
		) {
			debug('## componentWillReceiveProps ## UPDATE', );
			this._update = true;
			let state = {
				view: this.props.view !== props.view ? props.view : this.state.view || props.view,
			}
			if(props.pitch || props.pitch === 0) {
				state.pitch = props.atbat.pitch[props.pitch];
				state.pitched = props.pitch;
			}
			if(props.atbat) {
				state.atbat = props.atbat;
			}
			if(props.normalize) {
				state.normalize = props.normalize;
			}
			if(props.axis || props.axis === false) {
				state.axis = props.axis;
			}
			if(props.numbers || props.numbers === false) {
				state.pitchNums = props.numbers;
			}
			if(props.tooltips || props.tooltips === false) {
				state.tooltip = props.tooltips;
			}
			if(props.size) {
				state.style = this.setStyle(props.size);
				state.size = props.size;
				this._setBounds = true;
			}
			if(props.viewport) {
				if(props.viewport !== this.state.viewport) {
					state.viewport = props.viewport;
				}
			}
			if(props.type) {
				if(props.type !== this.state.type) {
					state.type = props.type;
				}
			}
			//state.type = this.props.viewport !== props.viewport ? props.viewport : this.state.view || props.view,props.viewport || props.type || 'normal';
			
			if(props.type === 'umpire') {
				state.filters = []
				state.filters.push({ which: 'des', filter: ['called'], label: 'Ump Strike' },);
				state.filters.push({ which: 'type', filter: ['b'], label: 'All Balls' },);
			}
			
			debug('## componentWillReceiveProps ## StrikeZone props:', props, 'state:', state);
			this.setState(state);
			
		}
	}
	
	filterCheck(pitch) {
		//check the filter before proceeding
		//debug('check');
		if (this.state.filters.length > 0) {
			let filters = this.state.filters;
			let check = some(filters, f => {
				if (!f) {
					return;
				}
				if (isFunction(f.filter)) {
					return f.filter(pitch);
				} else {
					return some(f.filter, c => {
						let word = pitch[f.which];
						if(typeof word !== 'string') {
							return false;
						}
						//debug('filter check', word.toLowerCase().search(c), f, pitch);
						return (word.toLowerCase().search(c) > -1)
					});
				}
			});
			return !check;
		} else {
			return false;
		}
	}
	
	setFilter(e, label) {
		let currentfilters = [ ...this.state.filters ];
		if (label) {
			//debug('### setFilter ###', label, some(this.state.filters, ['label', label]));
			if (some(this.state.filters, ['label', label])) {
				currentfilters = filter(currentfilters, (f) => (f.label !== label))
			} else {
				currentfilters.push(find(this.state.filterable,  ['label', label]));
			}
			this._update = true;
			this.setState({ filters: currentfilters });
		}
	}
	
	iconButton(icon, title, style, onClick) {
		let props = {};
		if(onClick) {
			props.onClick = onClick;
		}
		return (<IconButton 
				title={title}
				style={style.buttonStyle} 
				{ ...props }
			> 
				<FontIcon className="material-icons" hoverColor={style.hoverColor} style={style.iconStyle}  color={style.color} >{icon}</FontIcon>
		</IconButton>);
	}
	
	modal(component, title = "Pitch Sequence") {
		return (
			<Modal
				title={title}
				open={true}
				component={component} 
				answer={() =>  { this._update = true; this.setState({ modal: false, modal2: false }) } } 
				bodyStyle={{ overflow: 'auto' }}
				autoScrollBodyContent={true}
				size={2.5} 
			/> 
		);
	}
	
	pre(data, text = 'Pitch Data', icon = 'chrome_reader_mode') {
		let style = {
			iconStyle: this.state.style.smallIcon,
			buttonStyle: this.state.style.smallButton,
			hoverColor: Styles.Colors.limeA700,
			color: this.state.style.pdata.color,
		}
		return this.iconButton(icon, text, style, e => {
			e.preventDefault();
			this._update = true;
			this.setState({ 
				modal2: (<pre> 
					atbat: 
					{JSON.stringify(data, null, 4)} 
				</pre>) 
			});
		});

	}
	
	pitch(pitched, num, isNormalized, isUmp, singlePitch = false, ballProps = {}) {
		let pitch = { ...pitched };
		let ball = { ...this.state.style.pitch };
		let atbat = this.state.atbat;
		let s = this.state.style;
		//let SIZE = SIZES['normal']
		// ratio is the conversion we are using for inches to pixels
		let ratio = this.state.size;
		let lastPitch = num == atbat.pitch.length ? true : false;
		let type; 
		let PX = Number(pitch.px);
		let PZ = Number(pitch.pz);
		let ZTOP = Number(pitch.sz_top);
		let ZBOT = Number(pitch.sz_bot);
		if (this.state.filters.length > 0) {
			if(this.filterCheck(pitch)) {
				//debug('FAILED filter check in pitch');
				return false;
			}
		}		
		// set the pitch styling
		switch(pitch.type) {
			case "B":
				type = pitch.des.toLowerCase().search('hit by pitch') > -1 ? s.hib : s.ball;
				break;
			case "S":
				type = pitch.des.toLowerCase().search('swinging') > -1 ? s.swinging : pitch.des.toLowerCase().search('foul') > -1 ? s.foul : s.called;
				if(lastPitch) {
					type = (pitch.des.toLowerCase().search('swinging') > -1 || pitch.des.toLowerCase().search('foul') > -1) ? s.swingingOut : s.calledOut
				}
				break;
			case "X":
				type = pitch.des.toLowerCase().search('out') > -1 && pitch.des.toLowerCase().search('no out') === -1 ? s.out : pitch.des.toLowerCase().search('run') > -1 ? s.runs : s.hit;
				break;
		}
		// set the popup text blocks 
		// raw pitch data
		let titleB = (<div>
			<div>px: {(PX * this.state.view).clip(3)} </div>
			<div>pz: {PZ.clip(3)} </div>
			<div>sz_top: {ZTOP} / {Number(pitch.topZonePlus).clip(3)}</div>
			<div>sz_bot: {ZBOT} / {Number(pitch.bottomZonePlus).clip(3)}</div>
			<div>left: {atbat.config.leftZone} / {Number(atbat.config.leftZonePlus).clip(3)}</div>
			<div>right: {atbat.config.rightZone} / {Number(atbat.config.rightZonePlus).clip(3)}</div>
			<div>ID: #{pitch.event_num} </div>
		</div>);
		// top
		let titleA = (<div>
			<div>Pitch #{pitch.num} </div>
			<div>{pitch.des} </div>
			<div>{PITCH[pitch.pitch_type]} </div>
			<div>Mound Speed: {pitch.start_speed} mph</div>
			<div>Plate Speed: {pitch.end_speed} mph</div>
			<div>Batter: {atbat.b_height || pitch.b_height} / {atbat.stand || pitch.stand}</div>
		</div>);
		// filler for normalized info
		let titleC;
		
		let isInXZone = ((PX <= atbat.config.leftZonePlus && PX >= atbat.config.rightZonePlus));		
		let isInYZone = (PZ <= Number(pitch.topZonePlus) && PZ >= Number(pitch.bottomZonePlus));
		let isInZone = isInXZone && isInYZone;
		let aboveTopZone = PZ > Number(pitch.topZonePlus);
		
		// normalize the ball Y position and/or set the bottom value
		if(isNormalized && !singlePitch) {
			let normalized = isUmp ? atbat.normalized : pitch.normalized;
			pitch = normalizePitch(pitch, normalized, atbat.config);
			ball.bottom =  Math.floor((pitch.normalized.pz * 12) * ratio) - (atbat.config.halfBall * ratio);
			titleC = (<div style={{ color: 'yellow', fontWeight: 'bold' }} >
				<div>Normalized</div>
				px: {(PX * this.state.view)} <br />
				pz: {pitch.normalized.pz} <br />
				zoneTop: {Number(pitch.normalized.sz_top).clip(3)} / {Number(pitch.normalized.topZonePlus).clip(3)}<br />
				zoneBottom: {Number(pitch.normalized.sz_bot).clip(3)} / {Number(pitch.normalized.bottomZonePlus).clip(3)}<br />	
			</div>);
		} else {
			ball.bottom = Math.floor((pitch.pz * 12) * ratio)  - (atbat.config.halfBall * ratio);
		}
		
		/** this is the only value not set in the db.  use atbat.config for maths values **/
		// our default is pitcher view, data is from the batter view
		ball.left = (((PX) * 12) * ratio) + ((atbat.config.plate * ratio) / 2) - (atbat.config.halfBall * ratio);
		let otherb = { ...ball };
		let miniball = { ...miniball };
		let minipitch = { ...this.state.style.minipitch, ...type };
		if(this.state.view === -1 ) {
			otherb.left =  ((atbat.config.zoneWidth * ratio)) - (ball.left) - (atbat.config.ball * ratio);
			ball.left = (((PX * this.state.view) * 12) * ratio) + ((atbat.config.plate * ratio) / 2) - (atbat.config.halfBall * ratio);
			miniball.marginLeft = 2;
			miniball.marginRight = 0;
			minipitch.marginLeft = 0;
			minipitch.marginRight = -1;
		} 
		let missed = false;
		if(!pitch.px || !pitch.pz) {
			missed = true;
			type = { ...s.nodata };
			ball.bottom = 5;
		}
		
		// set the final popup text
		let inZone = missed ? (<div style={{ color: 'yellow', fontWeight: 'bold' }}>MISSED PITCH</div>) : isInZone ? (<div style={{ color: 'green', fontWeight: 'bold' }}>IN ZONE</div>) : (<div style={{ color: 'yellow', fontWeight: 'bold' }}>NOT IN ZONE</div>);
		let title = (<div>{inZone} {titleA} {titleC} {titleB} <br /> x: {ball.left.clip(3)}, y: {ball.bottom.clip(3)}</div>);
			
		// build a bounding box and restrict the pitches to our view		
		let c = atbat.config;
		let leftMin = Math.ceil(c.boundLeft * ratio);
		let leftMax = Math.floor(c.zoneRight * ratio) - (c.ball * ratio);
		let bottomMin = 0;
		let bottomMax = Math.floor(c.boundTop * ratio) - ((c.ball * ratio) * 1.5 );
		ball.left = ball.left.clamp(leftMin , leftMax);
		ball.bottom = ball.bottom.clamp(bottomMin, bottomMax);
		
		let style = { ...ball };		
		// popup
		let tooltip = <span />;
		let tProps = {
			'data-id': 'pitch' + pitch.pid,
			'data-type': isInZone ? 'success' : 'error',
			'data-multiline': true,
			'data-class': "tooltip-extraClass",
			'data-delayHide': 500,
		};
		tProps['data-event'] = 'click';
		tProps['data-effect'] = 'float';
		if(this.state.tooltip) {
			tooltip = (<div>
				<ReactTooltip  id={'pitch' + pitch.pid} children={(<div style={{ textAlign: 'left', zIndex: 200, color: isInZone ? '#222' : '#fff' }} >{title}</div>)} />
			</div>);
		}
		
		let otherP = (<div style={otherb} data-tip data-for={'pitch' + pitch.pid} { ...tProps }>
				 <FontIcon className="material-icons" style={miniball} hoverColor={s.otherBall.borderColor} color={s.otherBall.color}   { ...ballProps } >album</FontIcon>
				 <div style={minipitch} />
				 <div style={s.mininum} children={this.state.pitchNums ? num : ''} />
		</div>);
		
		return (<span key={pitch.pid}> 
			<div style={style} data-tip data-for={'pitch' + pitch.pid} { ...tProps }>
				 <FontIcon className="material-icons" style={this.state.style.miniball} hoverColor={type.borderColor} color={type.color}   { ...ballProps } >album</FontIcon>
				 <div style={minipitch} />
				 <div style={s.mininum} children={this.state.pitchNums ? num : ''} />
			</div>
			{tooltip}
		</span>);
	}
	
	render() {
		debug('## RENDER ## StrikeZone',  this.state, this.props);
		return this.strikezone();
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate StrikeZone ## ', this._update);
			this._update = false;
			return true;
		}
		return false;
	}
	
	setSize(e, size) {
		debug('### set size ###', e, size);
		this._update = true;
		this.setState({ size, style: this.setStyle(size) });
	}
	
	setStyle(size = 5) {
		debug(this.state, this.props);
		let s = SIZES.normal;
		if(this.state.type === 'umpire') {
			 s = SIZES.umpire;
		} else if(size < 3) {
			s = SIZES.small;
		}
		let cfg = this.state.atbat.config;
		let ratio = (val) => { return val * size };
		return {
			smallButton: {
				textAlign: 'left', 
				padding: 0, 
				width: 20, 
				height: 30, 
				marginLeft: 8,
			},
			smallIcon: {
				fontSize: 18,
			},
			strikezone: {
				float: snowUI.__state.desktop == 'xs' || this.state.type === 'umpire' ? 'none' : 'left',
				margin: '10px auto',
				width: ratio(cfg.boxWidth),
				height: ratio(s.bigHeight),
				position: 'relative',
				cursor: 'crosshair',
			},
			text: {
				width: ratio(cfg.boxWidth),
				textAlign: 'center'
			},
			player: {
				position: 'absolute',
				width: 2,
				height: Math.floor(this.state.size * 25),
				bottom: ratio(cfg.ground),
				left: 25,
				backgroundColor: 'transparent',
				border: '1px solid gray',
				display: 'none'
			},
			container: {
				width: ratio(cfg.boxWidth),
				height: ratio(cfg.boxHeight),
				border: '1px dotted #6F6F6F',
				backgroundColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
				position: 'relative',
				
			},
			plate: {
				position: 'absolute',
				bottom: ratio(cfg.ground),
				left: ratio(cfg.zoneLeft),
				width: ratio(cfg.zoneWidth),
				height: ratio(cfg.zoneHeight),
				backgroundColor: 'transparent',
				border: 'none',
				borderBottom: '5px solid #dadada'
			},
			zone: {
				position: 'absolute',
				width: ratio(cfg.zoneWidth),
				height: ratio(cfg.zoneHeight),
				bottom: 700,
				left: 0,
				backgroundColor: 'transparent',
				border: '2px solid white',
				borderColor: ColorMe(30, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				textAlign: 'center',
				borderLeftWidth: s.zoneBorderWidth,
				borderRightWidth: s.zoneBorderWidth,
				borderTopWidth: s.zoneBorderWidth,
				borderBottomWidth: s.zoneBorderWidth,
			},
			zoned: {
				borderColor: ColorMe(25, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
			},
			zoneNum: {
				fontSize: s.zoneNumFont,
				padding: s.zoneNumPadding, 
				margin: s.zoneNumMargin,
				color: ColorMe(20, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
			},
			pitch: {
				position: 'absolute',
				width: ratio(cfg.ball),
				height: ratio(cfg.ball),
				fontSize: ratio(cfg.ball),
				bottom: 121,
				left: 50,
				fontWeight: 'bold',
				padding: 0,
				border: 'none',
				
			},
			miniball: {
				fontSize: ratio(cfg.ball),
				zIndex: 100,
				marginTop:  .8,
				marginRight: 2
			},
			mininum: {
				fontSize: s.ballNumFont,
				zIndex: 100,
				left: '-100%',
				top: 0,
				width: '98%',
				height: s.ballNumFont,
				textAlign: 'right',
				overflow: 'hidden',	
				border: 'none',
				position: 'absolute',
				padding: 0,
				lineHeight: 1,
			},
			minipitch: {
				fontSize: ratio(cfg.ball),
				position: 'absolute',
				top: '13%',
				left: '15%',
				width: '70%',
				height: '65%',
				overflow: 'hidden',	
				border: 'none',
				borderRadius: s.ballR,
				zIndex: 1,
				marginTop:  0.8,
				marginLeft: -1
			},
			ab: {
				bottom: ratio(cfg.boxHeight) + 5,
				left: s.abLeft,
				position: 'absolute',
				width: ratio(cfg.boxWidth),
				height: ratio(2.4),
				fontSize: ratio(2.4),
				textAlign: 'left',
				color: '#79B7DD',
			},
			view: {
				bottom: ratio(cfg.boxHeight) + 5,
				left: s.viewLeft,
				position: 'absolute',
				width: s.viewWidth,
				height: ratio(2.4),
				fontSize: ratio(2.4),
				textAlign: 'left',
				color: '#79B7DD',
				display: 'none'
				
			},
			event: {
				bottom: ratio(cfg.boxHeight) + 5,
				right: s.eventRight,
				left: s.eventLeft,
				position: 'absolute',
				width: s.eventWidth,
				height: ratio(2.4),
				fontSize: ratio(2.4),
				textAlign: s.eventTA,
				color: '#79B7DD',
				display: 'none'
			},
			otherBall: {
				backgroundColor: 'transparent',
				color: '#333',
				borderColor: '#bbb', // purple/blue
			},
			ball: {
				backgroundColor: 'transparent',
				color: '#6D7FFF',
				borderColor: '#6D7FFF', // purple/blue
			},
			called: {
				backgroundColor: '#D8363D', // red
				color: '#7BD7FF',
				borderColor: '#7BD7FF', // baby blue
			},
			swinging: {
				backgroundColor: 'transparent',
				color: '#D8363D',
				borderColor: '#D8363D', // red
			},
			foul: {
				backgroundColor: '#D73423',
				borderColor: '#D73423',
				color: '#D6D6D6', // burnt
			},
			hit: {
				backgroundColor: '#00801E',
				borderColor: '#00801E',
				color: 'white' // green
			},
			runs: {
				backgroundColor: '#0074CA', // blue
				borderColor: '#0074CA',
				color: 'white' // green
			},
			out: {
				backgroundColor: 'transparent', // yellow
				borderColor: '#FFF9A4',
				color: '#FFEF09' // green
			},
			calledOut: {
				backgroundColor: '#7BD7FF', // yellow
				borderColor: '',
				color: '#FFEF09' // blue
			},
			swingingOut: {
				backgroundColor: '#D8363D', // yellow
				borderColor: '#FFF9A4',
				color: '#FFF9A4' //red
			},
			hib: {
				backgroundColor: '#996EFF', // purple
				borderColor: '#00B613', // green
				color: '#00801E'
			},
			nodata: {
				backgroundColor: 'transparent',
				borderColor: '#C8FB5E',
				color: '#000'
			},
			des: {
				position: 'absolute',
				bottom: 0,
				left: 0,
				width: '100%',
				height: ratio(cfg.ground*2),
				backgroundColor: 'transparent',
				border: 'none',
				marginLeft: s.desM,
				paddingTop: s.desPT
			},
			bases: {
				width: ratio(6),
				height: ratio(6),
				margin: 0,
				float: 'left',
				position: 'absolute',
				top: 2,
				right: 2,
			},
			baseLit: {
				backgroundColor: '#F8E917',
				opacity: 1
			},
			base1: {
				transform: 'rotate(45deg)', 
				bottom: ratio(.6),
				right: ratio(1.8),
				width: ratio(2),
				height: ratio(2),
				position: 'absolute',
				backgroundColor: '#7C794D',
				opacity: .5
			},
			base2: {
				transform: 'rotate(45deg)',
				bottom: ratio(2.8),
				right: ratio(4),
				backgroundColor: '#7C794D',
				opacity: .5,
				width: ratio(2),
				height: ratio(2),
				position: 'absolute',
			},
			base3: {
				transform: 'rotate(45deg)',
				bottom: ratio(.6),
				right: ratio(6.3),
				backgroundColor: '#7C794D',
				opacity: .5,
				width: ratio(2),
				height: ratio(2),
				position: 'absolute',
			},
			counter: {
				height: ratio(s.dotsLetters/5) * 1.2,
				position: 'absolute',
				bottom: 0,
				left: '0',
				right: '0',
			},
			count: {
				width: ratio(s.dotsLetters/5),
				margin: 0,
				height: ratio(s.dotsLetters/5),
				fontSize: ratio(s.dotsLettersFont/5),
				fontWeight: 700,
				color: '#9C974F',
				textAlign: 'center',
				float: 'left',
			},
			countBalls: {
				position: 'absolute',
				bottom: 0,
				left: 5,
			},
			countBall: {
				width: ratio(s.dotsLetters/5),
				margin: 0,
				height: ratio(s.dotsLetters/5),
				fontSize: ratio(s.dotsLettersFont/5),
				fontWeight: 700,
				color: '#79B7DD',
				textAlign: 'center',
				float: 'left',
			},
			countStrikes: {
				position: 'absolute',
				bottom: 0,
				left: '42%',
			},
			countStrike: {
				width: ratio(s.dotsLetters/5),
				margin: 0,
				height: ratio(s.dotsLetters/5),
				fontSize: ratio(s.dotsLettersFont/5),
				fontWeight: 700,
				color: '#A61B1B',
				textAlign: 'center',
				float: 'left',
			},
			countOuts: {
				position: 'absolute',
				bottom: 0,
				right: 5,
				
			},
			countOut: {
				width: ratio(s.dotsLetters/5),
				margin: 0,
				height: ratio(s.dotsLetters/5),
				fontSize: ratio(s.dotsLettersFont/5),
				fontWeight: 700,
				color: '#C5BC46',
				textAlign: 'center',
				float: 'left',			
			},
			lit: {
				backgroundColor: '#F8E917',
				border: 'none',
				color: '#650C1B',
				borderRadius: ratio(s.ballR/5),
				width: ratio(s.dots/5),
				height: ratio(s.dots/5),
				margin: 2,
				float: 'left'
			},
			unlit: {
				backgroundColor: '#7C794D',
				border: 'none',
				color: '#650C1B',
				borderRadius: ratio(s.ballR/5),
				width: ratio(s.dots/5),
				height: ratio(s.dots/5),
				margin: 2,
				float: 'left'
			},
			split: {
				float: 'left',
				width: 13,
				height: 15,
				bottom: 5
			},
			pdata: {
				borderRadius: 2,
				border: '1px solid #404040',
				borderColor: ColorMe(20, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				background: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				padding: 5,
				textDecoration: 'none',
				color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
				cursor: 'pointer',
			}
		}
	}

	setView() {
		this._update = true;
		this.setState({ view: this.state.view * -1 });
	}
	
	strikezone() {
		let pitched = this.state.pitch || this.state.atbat.pitch[0] || this.state.atbat.pitch;
		let pitch = { ...pitched };
		let atbat = this.state.atbat;
		let runners = atbat.runner;
		let isUmp = this.state.type == 'umpire';
		let isNormalized = this.state.viewport == 'umpire';
		//check for unmp mode and filters for sequence
		if(isUmp && this.state.pitched >= 0 && this.state.filters.length > 0) {
			if(this.filterCheck(pitch)) {
				debug('FAILED filter check in strikezone');
				return false;
			}
		}
		
		//let SIZE = SIZES['normal'];
		let ratio = this.state.size;
		let s = this.state.style;
		
		let plate = atbat.config.plate * ratio;
		let side = atbat.stand;
		 
		// zone box
		let whichZone = isUmp ? atbat.normalized : pitch.normalized;
		let whichOne = isNormalized ? whichZone : pitch;
		s.zone.bottom = whichOne.style.zoneBottom * ratio; 
		s.zone.height = whichOne.style.zoneHeight * ratio;
		
		if(!isNormalized && !this.state.pitch) {
			s.zone.borderTopWidth = 'none';
			s.zone.borderBottomWidth = 'none';
			s.zone.borderStyle = 'dashed';
		} else {
			s.zone.borderStyle = 'solid'; 
		}
		
		// player
		if(side == 'R') {
			s.player.left = 180;
		}
		
		// pitch(es)
		let balls = <span />;
		let adjustedZones = [];
		
		if(this.state.pitch) {
			balls = this.pitch(this.state.pitch, this.props.pitch+1, isNormalized, isUmp, true );
		} else if(Array.isArray(this.state.atbat.pitch)) {
			let singlePitch = this.state.atbat.pitch.length === 1;
			balls = this.state.atbat.pitch.map((pitch, k) => {
				if(!isNormalized) {
					let zoned = Object.assign({ ...s.zone }, s.zoned);
					zoned.bottom = pitch.style.zoneBottom * ratio; 
					zoned.height = pitch.style.zoneHeight * ratio; 
					zoned.borderColor = this.state.zoned == pitch.pid || singlePitch ? Styles.Colors.limeA400 : s.zoned.borderColor;
					zoned.zIndex = this.state.zoned == pitch.pid ? 20 : 1;
					adjustedZones.push(<div key={'zoned'+pitch.pid} style={zoned} />);
					//debug('## ZONED ##', zoned, pitch.pid, this.state.zoned); 
				}
				
				let ballProps = {
					onMouseEnter: () => { this._update = true; this.setState({ zoned: pitch.pid}) }
				}
				
				return this.pitch(pitch, pitch.num, isNormalized, isUmp, singlePitch, ballProps)
				
			});
			
		} else {
			console.error('WHY are we doing this?');
			balls = this.pitch(this.state.atbat.pitch, 1, isNormalized, isUmp, true);
		}
		
		if(Array.isArray(runners)) {
			runners.forEach(r => {
				if(r.start != '') {
					let b = s['base'+r.start.substr(0,1)];
					s['base'+r.start.substr(0,1)] = Object.assign(b, s.baseLit)
				}
			});
		}
		
		let status = (<div style={s.des} >
			<div style={s.counter} >
				<div style={s.countBalls} >
					<div style={s.countBall} children={"B"} />
					<div style={atbat.b >= 1 ? s.lit : s.unlit} />
					<div style={atbat.b >= 2 ? s.lit : s.unlit} />
					<div style={atbat.b >= 3 ? s.lit : s.unlit} />
					<div style={atbat.b >= 4 ? s.lit : s.unlit} />
				</div>
				<div style={s.countStrikes} >
					<div style={s.countStrike} children={"S"} />
					<div style={atbat.s >= 1 ? s.lit : s.unlit} />
					<div style={atbat.s >= 2 ? s.lit : s.unlit} />
					<div style={atbat.s >= 3 ? s.lit : s.unlit} />
				</div>
				<div style={s.countOuts} >
					<div style={s.countOut} children={"O"} />
					<div style={atbat.o >= 1 ? s.lit : s.unlit} />
					<div style={atbat.o >= 2 ? s.lit : s.unlit} />
					<div style={atbat.o >= 3 ? s.lit : s.unlit} />
				</div>
			</div>
		</div>); 
		
		let bases = (<div style={s.bases} >
			<div style={s.base1} />
			<div style={s.base2} />
			<div style={s.base3} />
		</div>);
		
		let axis = <span />;
		if(this.state.axis) {
			axis = (<GridTracker bound={this.state.bound} color={Styles.Colors.limeA700} listen={this.state.axis} heightAdjustment={atbat.config.ground*this.state.size + 7} factor={this.state.size} center={(atbat.config.zoneWidth*this.state.size) / 2} />);
		}
		
		let abInfo = (	<div style={s.ab}>
			<div  style={{ float: 'left' }} children={this.state.pitch ? pitch.des : 'AB:' + atbat.num } title={this.state.pitch ? pitch.des : 'AB:' + atbat.num} />
			<div style={{ float: 'left' }} children={this.state.pitch ? '::PID:' + pitch.id : '::EID:' + atbat.event_num} title={this.state.pitch ? 'Event #' + pitch.id : 'Event #' + atbat.event_num} />
			<div style={{ float: 'left' }} title={'Change View'} children={this.state.view === 1 ? '::batter view' : '::pitcher view'} />
		</div>);
		
		let zone = (<div style={s.container} ref="zone">
			<div style={s.plate} >
				<div style={{ 'postion': 'relative', width: '100%', height: '100%' }} >
					<div style={s.zone} children={<div style={s.zoneNum} children={this.state.pitch ? this.props.pitch + 1 : ''}/>} />
					{balls}
					{adjustedZones}
				</div>
			</div> 
			<div style={s.player} />
			{status}
			{axis}
			{this.state.type != 'umpire' ? abInfo : <span />}
			{bases}
		</div>);
		
		let extra = (<div className="clearfix" style={{padding: 0, marginTop: 10 }} >
			
			
			{this.iconButton(isNormalized ? 'crop_portrait' : 'transform', isNormalized ? 'The current data is normalized for viewing. The strike zone is based on the mean zone top and mean zone bottom for the set.  Each pitch is calculated to fit within the mean bounds. Click to change to raw results.' : 'The current data is raw; meant to be viewed per single pitch.  For multiple pitches it will not accurately reflect the top and bottom zone.  Click to chang to normalized results.', {
				iconStyle: this.state.style.smallIcon,
				buttonStyle: Object.assign({ ...this.state.style.smallButton }, { marginLeft: 0 }),
				hoverColor: Styles.Colors.limeA700,
				color: Styles.Colors.limeA700,
			}, e => {
				e.preventDefault();
				this._update = true;
				this.setState({ viewport: isNormalized ? 'normal' : 'umpire' });
			})}
			
			{this.iconButton('filter_9_plus', "Pitch Numbers" , {
				iconStyle: this.state.style.smallIcon,
				buttonStyle: this.state.style.smallButton,
				hoverColor: this.state.pitchNums ? Styles.Colors.limeA700 : s.pdata.color,
				color: this.state.pitchNums ? Styles.Colors.limeA700 : s.pdata.color,
			}, e => {
				e.preventDefault();
				this._update = true;
				this.setState({ pitchNums: !this.state.pitchNums });
			})}		
			{this.iconButton('filter_frames', "Balloon Info" , {
				iconStyle: this.state.style.smallIcon,
				buttonStyle: this.state.style.smallButton,
				hoverColor: Styles.Colors.limeA700,
				color: this.state.tooltip ? Styles.Colors.limeA700 : s.pdata.color,
			}, e => {
				e.preventDefault();
				this._update = true;
				this.setState({ tooltip: !this.state.tooltip });
			})}
			{this.iconButton(this.state.view === 1 ? 'rotate_left' : 'rotate_right', this.state.view === 1 ? 'Switch to pitcher view' : 'switch to batter view', {
				iconStyle: this.state.style.smallIcon,
				buttonStyle: this.state.style.smallButton,
				hoverColor: Styles.Colors.limeA700,
				color: this.state.style.pdata.color,
			}, e => {
				e.preventDefault();
				this.setView();
			})}
			{this.iconButton(this.state.axis ? 'border_inner' : 'border_clear', "Axis", {
				iconStyle: this.state.style.smallIcon,
				buttonStyle: this.state.style.smallButton,
				hoverColor: this.state.axis ? Styles.Colors.limeA700 : s.pdata.color,
				color: this.state.axis ? Styles.Colors.limeA700 : s.pdata.color,
			}, e => {
				e.preventDefault();
				this._update = true;
				this.setState({ axis: !this.state.axis, bound: this.refs.zone.getBoundingClientRect()  });
			})}
			<IconMenu
				iconButtonElement={this.iconButton('filter_list', 'Filters', {
					iconStyle: this.state.style.smallIcon,
					buttonStyle: this.state.style.smallButton,
					hoverColor: Styles.Colors.limeA700,
					color: this.state.filters.length > 0 ? Styles.Colors.limeA700 : s.pdata.color,
				})}
				anchorOrigin={{horizontal: 'left', vertical: 'top'}}
				targetOrigin={{horizontal: 'left', vertical: 'top'}}
				onChange={this.setFilter}
				desktop={true}
			>
				{this.state.filterable.map(f => {
						return (<MenuItem key={f.label} primaryText={f.label} value={f.label} checked={some(this.state.filters,  (ff) => (f.label === ff.label))} />);
				})}
			</IconMenu>
			<IconMenu
				iconButtonElement={this.iconButton('zoom_in', 'Set strikezone size', {
					iconStyle: this.state.style.smallIcon,
					buttonStyle: this.state.style.smallButton,
					hoverColor: this.state.pitchNums ? Styles.Colors.limeA700 : s.pdata.color,
					color: this.state.pitchNums ? Styles.Colors.limeA700 : s.pdata.color,
				})}
				anchorOrigin={{horizontal: 'left', vertical: 'top'}}
				targetOrigin={{horizontal: 'left', vertical: 'top'}}
				onChange={this.setSize}
				desktop={true}
			>
				{[1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,23,26,30].map(f => {
						return (<MenuItem key={f} primaryText={f} value={f} checked={this.state.size === f} />);
				})}
			</IconMenu>
			{this.iconButton('burst_mode', "Sequence" , {
				iconStyle: this.state.style.smallIcon,
				buttonStyle: Object.assign({ ...this.state.style.smallButton }, { paddingLeft: 5, width: 25, borderLeft: '1px solid ' + s.pdata.color }),
				hoverColor: Styles.Colors.limeA700,
				color: s.pdata.color,
			}, e => {
					e.preventDefault();
					this._update = true;
					this.setState({ modal: atbat });
			})}
			{this.pre(atbat)}
			<div className="clearfix" /> 
			<div style={s.text} children={atbat.des} />
			
		</div>);
		
		if(this.props.pitch || this.props.pitch === 0) {
			extra = <span />;
		}
		
		let modall = false;
		if(this.state.modal) {
			modall = this.modal((<div className="clearfix">
				<div className="clearfix" style={{ height: 15, width: 20 }} />
				<AtBat viewport={this.props.viewport} atbat={this.state.modal} single={false} type={this.state.type}  size={2.5} />
				<div className="clearfix" style={{ height: 15, width: 20 }} />
			</div>));
		} else if(this.state.modal2) {
			modall = this.modal((<div className="clearfix">
				{this.state.modal2}
			</div>), 'Pitch Data');
		}
		
		return (<div style={s.strikezone} ref="strikezone">
			
			{zone}
		
			{this.state.size > 3 ? extra : <span />}
			<div className="clearfix" style={{ marginTop: 40 }} />
			{modall ? modall : <span />}
		</div>);		
	}
	
}
StrikeZone.propTypes = {
	pitch: React.PropTypes.number,
	atbat: React.PropTypes.object,
	view: React.PropTypes.number,
	size: React.PropTypes.number,
};

StrikeZone.defaultProps = {
	view: -1,
	atbat: {
		pitch: [],
	},
	style: {
	},
	size: 5,
	normalize: false,
	type: 'normal',
	viewport: 'umpire',
	ballProps: {},
	axis: false,
	numbers: false,
	tooltips: true
};

