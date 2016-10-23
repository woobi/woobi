import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon, Menu, MenuItem, Popover, PopoverAnimationVertical } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';
import { forEach, isObject, isArray, map, meanBy } from 'lodash';
import StrikeZone from './strikezone';
import AtBat from './atbat';
import { ColorMe } from 'app/common/utils';
import Modal from 'app/common/components/dialog';
import buttonMenu from 'app/common/components/buttonMenu';

let debug = Debug('lodge:app:common:components:innings'); 
	
export default class Innings extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Innings Component'	
		debug('## constructor props ##', props);
		this.state = {
			game: props.game,
			gid: props.gid,
			events: [],
			inning: props.params.inning || props.game.inning,
			auto: false,
			view: -1,
			modal: false,
			type: props.params.inning === 'umpire' ? 'umpire' : false,
			viewport: 'umpire',
			axis: false,
			tooltips: true,
			numbers: true,
			size: props.size
		};
		this._missed = [];
		this._$pitches = {
			pitch: []
		};
		this._normalized = false;
		if (props.game.gameday) {
			debug('missed pitches run', typeof props.game.gameday);
			this.missedPitches();
		}
		
		// binders
		this.pre = this.pre.bind(this);
		this.missedPitches = this.missedPitches.bind(this);
		this.iconButton = this.iconButton.bind(this);
		this.szButton = this.szButton.bind(this);
		this.setSize = this.setSize.bind(this);
		
		//update bit
		this._update = true;
	}
	
	normalize(pitches, config) {
		let t = meanBy(pitches.pitch, o => Number(o.sz_top)).clip(2);
		let b = meanBy(pitches.pitch, o => Number(o.sz_bot)).clip(2);
		return {
			normalized: {
				'sz_top' : t,
				'sz_bot': b,
				'zoneHeight': t - b,
				'aboveTop': (config.boundTopInches - t),
				'belowBottom': b,
				'boundTop' : config.boundTopInches,
				'boundBottom' : config.boundBottomInches,
				'topZonePlus': t + config.zonePlus,
				'bottomZonePlus': b - config.zonePlus,
				'style': {
					'zoneBottom': b * 12,
					'zoneHeight': (t - b) * 12,
				}
			},
			config: config
		};
	}
	
	componentWillReceiveProps(props) {
		//if(props.force || props.game != this.state.game) {
			debug('## componentWillReceiveProps ## Innings props:', props);
			let state = {
				game: props.game,
				inning: props.params.inning || props.game.inning,
				type: props.params.inning === 'umpire' ? 'umpire' :  'normal' 
			}
			if ( 
				((props.game.gameday) && (props.game.gameday !== this.state.game.gameday))
				|| snowUI.__autoRefresher.running
			) {
				this._$pitches = {
					pitch: []
				}
				this.missedPitches();
			}
			
			this._update = true;
			this.setState(state);
		//}
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate Innings ## ', this._update);
			this._update = false;
			return true;
		}
		return true;
	}
	
	missedPitches() {
		debug('## missedPitches ##', this.props.game);
		let old = { ...this.state.game.innings };
		let missed = [];
		let $pitches = {
			pitch: []
		};
		forEach(old, i => {
			if(i.top) {
				i.top.atbats.forEach(ab => {
					if(Array.isArray(ab.pitch)) {
						let add = { ...ab};
						delete add.pitch;
						ab.pitch.forEach(p => {
							p = { ...add, ...p };
							if(!p.px || !p.pz) {
								missed.push(p);
							}
							$pitches.pitch.push(p);
						});
					}
						
				});
			}
			if(i.bottom) {
				if(Array.isArray(i.bottom.atbats)) {
					i.bottom.atbats.forEach(ab => {
						if(Array.isArray(ab.pitch)) {						
							let add = { ...ab};
							delete add.pitch;
							ab.pitch.forEach(p => {	
								p = { ...add, ...p };
								if(!p.px || !p.pz) {
									missed.push(p);
								}
								$pitches.pitch.push(p);
							});
						}
					});
				}
					
			}
		});
		let normalized = this.normalize($pitches, this.props.game.config);
		this._$pitches = {  ...normalized  , ...$pitches };
		this._normalized = normalized;
		this._missed = missed;
		debug('#### missedPitches ####', missed, 'Total', $pitches.length);
	}
	
	innings() {
		//console.log(this._$pitches)
		let innings = <span />;
		let top = <span />;
		let bot = <span />;
		let ump = false;
		if(this.state.game) {			
			innings = map(this.state.game.innings, (m, k) => {
				let goto = k;
				return <a 
					style={{ display: 'inline-block', width: 48, height: 48, color: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).color, backgroundColor: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor, border: '1px solid #404040', borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor, padding: '11px 18px', fontSize: 18, margin: '5px 5px 10px 0' }} 
					onClick={e=> {
						e.preventDefault();
						snowUI.__autoRefresher.clearInterval();
						this.props.goTo({
							page: 'pitch f/x inning ' + goto,
							path: '/gameday/games/' + this.props.gid + '/pfx/' + goto
						}, false, false, true);
					}}
					href={"/noscript/gameday/games/" + this.props.gid + '/pfx/' + goto}
					children={goto}
					key={goto + 'game'}
				/>;
			}); 
			
			innings.push(<a 
				style={{ display: 'inline-block', width: 48, height: 48, color: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).color, backgroundColor: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor, border: '1px solid #404040', borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor, padding: '11px 18px', fontSize: 18, margin: 5 }} 
				onClick={e=> {
					e.preventDefault();
					snowUI.__autoRefresher.clearInterval();
					this.props.goTo({
						page: 'pitch f/x umpire',
						path: '/gameday/games/' + this.props.gid + '/pfx/umpire'
					}, false, false, true);
				}}
				href={"/noscript/gameday/games/" + this.props.gid + '/pfx/umpire'}
				children={'U'}
				key={'ump'}
			/>);
			
			if (Number(this.state.inning) > 0) {
				if (this.state.game.innings) {
					let ti = this.state.game.innings[this.state.inning];
					if (ti.top) {
						if(Array.isArray(ti.top.atbats)) {
							top = this.state.game.innings[this.state.inning].top.atbats.map(a=>a).reverse().map(b => <div key={b.num} style={{ float:'left', marginRight: 10 }} children={<AtBat  atbat={b} { ...this.state } />} />);
						}
					}
					if (ti.bottom) { 
						if(Array.isArray(ti.bottom.atbats)) {
							bot = ti.bottom.atbats.map(a=>a).reverse().map(b => <div key={b.num} style={{ float:'left', marginRight: 10 }} children={<AtBat   atbat={b}  { ...this.state } />} />);
							bot = (<div className="col-xs-12 " style={{ paddingLeft: 0, textAlign: 'left' }} >
								<h2 style={{ marginBottom: 25 }}>Bottom {this.state.inning}</h2>
								{bot}
							</div>);
						}
					}
				} 
			} else if (this.state.inning === 'umpire') {
				ump = (<div  style={{ paddingLeft: 0, margin: '10px auto', width: '100%' }}>
					<h2 style={{ marginBottom: 25 }}>Discretion Pitches</h2>
					<AtBat { ...this.state } numbers={false} size={8} type='umpire' atbat={this._$pitches}   />
				</div>);
			}
		}
		
		let umpORtop = <span />;
		if (ump) {
			umpORtop = ump;
		} else if (!isNaN(this.state.inning)) {
			umpORtop = (<span>
				{bot}
				<div className="col-xs-12 " style={{ paddingLeft: 0, margin: '0 auto', textAlign: 'left' }}>
					<h2 style={{ marginBottom: 25 }}>Top {this.state.inning}</h2>
					{top}
				</div>
				
			</span>);
		}
		
		let modall = <span />;
		if(this.state.modal) {
			modall = this.modal((<div className="clearfix">
				{this.state.modal}
			</div>), 'Missed Pitches');
		} 
		
		return (<div>
								
			<div style={{ textAlign: 'center', float: 'left', marginLeft: 0 }} children={this.pre(this._missed, this._missed.length + ' missed', this._missed.length > 0 ? 'filter_'+this._missed.length : 'exposure_zero')} />
			
			{this.szButton(this.state.view === 1 ? 'rotate_left' : 'rotate_right', this.state.view !== 1 ? 'Switch to batter perspective' : 'Switch to center field perspective', e => {
				e.preventDefault();
				this.setView();
			}) }
			{this.szButton(this.state.viewport === 'umpire' ? 'crop_portrait' : 'transform', this.state.viewport === 'umpire' ? 'The current data is normalized for viewing. The strike zone is based on the mean zone top and mean zone bottom for the set.  Each pitch is calculated to fit within the mean bounds. Click to change to raw results.' : 'The current data is raw; meant to be viewed per single pitch.  For multiple pitches it will not accurately reflect the top and bottom zone.  Click to chang to normalized results.', e => {
				e.preventDefault();
				this.setViewPort();
			}, true) }
			{this.szButton('filter_9_plus', this.state.numbers ? 'Turn numbers off' : 'Turn numbers on', e => {
				e.preventDefault();
				this._update = true;
				this.setState({ numbers: !this.state.numbers });
			}, false, this.state.numbers ? Styles.Colors.limeA700 : ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color ) }
			{this.szButton('filter_frames', this.state.tooltips ? 'Turn tooltips off' : 'Turn tooltips on', e => {
				e.preventDefault();
				this._update = true;
				this.setState({ tooltips: !this.state.tooltips });
			}, false, this.state.tooltips ? Styles.Colors.limeA700 : ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color) }
			{this.szButton(this.state.axis ? 'border_inner' : 'border_clear', 'Axis', e => {
				e.preventDefault();
				this._update = true;
				this.setState({ axis: !this.state.axis });
			}, false, this.state.axis ? Styles.Colors.limeA700 : ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color ) }
			 <IconMenu
				iconButtonElement={this.szButton('zoom_in', 'Set strikezone size', false)}
				anchorOrigin={{horizontal: 'left', vertical: 'top'}}
				targetOrigin={{horizontal: 'left', vertical: 'top'}}
				onChange={this.setSize}
			>
				<MenuItem primaryText="1" value={1} checked={this.state.size === 1} />
				<MenuItem primaryText="2" value={2} checked={this.state.size === 2}  />
				<MenuItem primaryText="3" value={3} checked={this.state.size === 3}  />
				<MenuItem primaryText="4" value={4} checked={this.state.size === 4}  />
				<MenuItem primaryText="5" value={5} checked={this.state.size === 5 || !this.state.size}  />
				<MenuItem primaryText="6" value={6} checked={this.state.size === 6}  />
				<MenuItem primaryText="8" value={8} checked={this.state.size === 8}  />
				<MenuItem primaryText="10" value={10} checked={this.state.size === 10}  />
				<MenuItem primaryText="12" value={12} checked={this.state.size === 12}  />
				<MenuItem primaryText="15" value={15} checked={this.state.size === 15}  />
				<MenuItem primaryText="20" value={20} checked={this.state.size === 20}  />
				<MenuItem primaryText="25" value={25} checked={this.state.size === 25}  />
				<MenuItem primaryText="30" value={30} checked={this.state.size === 30}  />
			</IconMenu>
			<div className="clearfix" style={{ display: 'block', height: 15, width: 100 }} />
			
			<div style={{ width: '100%', margin: '0 auto', textAlign: 'left' }} children={innings} />
			<div className="clearfix"  style={{ display: 'block', height: 15, width: 100 }} />
			<div style={{ paddingLeft: 0, float: 'left' }} children={<span  style={{
					borderRadius: 2,
					border: '1px solid #505050',
					borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
					background: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
					padding: 5,
					cursor: 'none',
					textDecoration: 'none',
					color:  ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
				}} > {this._$pitches.pitch.length} pitches </span>} /> 
			
			{umpORtop}
			<div className="clearfix" style={{  }} />
			
			<div className="clearfix" style={{ marginTop: 40 }} />
			{modall}
		</div>);		
	}
	
	pre(data, text = 'Pitch f/x Data', icon = 'chrome_reader_mode') {
		let style = {
			iconStyle: {},
			buttonStyle: {
				borderRadius: 2,
				border: '1px solid #505050',
				borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				background: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				padding: 5,
				cursor: 'hand',
				textDecoration: 'none',
				color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
			},
			hoverColor: Styles.Colors.limeA700,
			color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
		}
		return this.iconButton(icon, text, style, e => {
			e.preventDefault();
			this._update = true;
			this.setState({ 
				modal: (<pre> 
					{JSON.stringify(data, null, 4)} 
				</pre>) 
			});
		});

	}
	
	modal(component, title = "Pitch Sequence") {
		return (
			<Modal
				title={title}
				open={true}
				size="small" 
				autoScrollBodyContent={true}
				component={component} 
				answer={() =>  this.setState({ modal: false, modal2: false }) } 
				bodyStyle={{ overflow: 'auto' }}
			/>
		);
	}
	
	szButton(icon, text, onClick, alwayslight = false, color = false, hover = false) {
		let style = {
			iconStyle: {},
			buttonStyle: {
				borderRadius: 2,
				border: '1px solid #505050',
				borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				background: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				padding: 5,
				marginLeft: 10,
				cursor: 'hand',
				textDecoration: 'none',
			},
			hoverColor: hover ? hover : Styles.Colors.limeA700,
			color: color ? color : alwayslight ? Styles.Colors.limeA700 : ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
		}
		return this.iconButton(icon, text, style, onClick);
	}
	
	iconButton(icon, title, style, onClick ) {
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
	
	render() {
		debug('## RENDER ## Innings',  this.state, this.props);
						
		let board = this.props.game.gameday ? this.innings() : <div children={"Loading Game..."} />;
		
		return (<div >
			<div className="events">{board}</div>
		</div>);
	}
	
	setView() {
		this._update = true;
		this.setState({ view: this.state.view * -1 });
	}
	
	setSize(e, size) {
		debug('### set size ###', e, size);
		this._update = true;
		this.setState({ size });
	}
	
	setViewPort() {
		this._update = true;
		let viewport = this.state.viewport === 'umpire' ? 'normal' : 'umpire';
		this.setState({ viewport });
	}
}

Innings.propTypes = {
	game: React.PropTypes.object,
	size: React.PropTypes.number
};

Innings.defaultProps = {
	game: {},
	size: 5,
};

