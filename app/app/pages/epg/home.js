import React, { PureComponent } from "react";
import Debug from 'debug';
import Gab from '../../common/gab';
import { Divider, FontIcon, IconButton, LinearProgress, MenuItem} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { debounce, isObject, isFunction, findIndex, find as Find, sortBy, map as Map, filter as Filter } from 'lodash';
import moment from 'moment';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Collection from 'react-virtualized/dist/commonjs/Collection';
import Grid from 'react-virtualized/dist/commonjs/Grid';
import ScrollSync from 'react-virtualized/dist/commonjs/ScrollSync';
import scrollbarSize from "dom-helpers/util/scrollbarSize";
import cn from "classnames";
import Menu from '../../common/components/menu';
import natSort from 'javascript-natural-sort';
import RenderChannel from './components/channel';
//import Clock from 'react-live-clock';

const LEFT_COLOR_FROM = hexToRgb("#471061");
const LEFT_COLOR_TO = hexToRgb("#1C1061");
const TOP_COLOR_FROM = hexToRgb("#471061");
const TOP_COLOR_TO = hexToRgb("#1C1061");
let LC = mixColors(
	LEFT_COLOR_FROM,
	LEFT_COLOR_TO,
	0
);
let TC = mixColors(
	TOP_COLOR_FROM,
	TOP_COLOR_TO,
	0
);
let MC = mixColors(
	LC,
	TC,
	0.5
);

MC = LC;

let debug = Debug('woobi:app:pages:epg:home');

export default class EPG extends PureComponent {
	constructor( props, context ) {
		super( props, context )
				
		if ( props.initialData ) {
			debug('got props initialData');
			//shows = props.initialData.shows.tvshows || [];
			this._skipMount = true;
		}
		this.displayName = 'EPG';
		let _this = this;
		
		this.state = {
			minutesPerColumn: 30,
			columnCount: ( ( ( props.numberOfGuideDays * 24 ) + props.guidePreHours ) * 60 ) / 30,
			columnWidth: 120,
			height: 400,
			overscanColumnCount: 40,
			overscanRowCount: 40,
			rowHeight: 90,
			rowHeaderHeight: 40,
			rowCount: 300,
			channelList: [],
			useGenreColors: true,
			scrollToCell: undefined,
			group: props.params.group ? props.params.group.trim() : 'All channels',
			sortGuideBy: props.query.sortGuideBy ? props.query.sortGuideBy.trim() : 'channel',
			guideLoaded: Object.keys(props.entries).length > 0 ? true : false,
			channelsLoaded: props.channels.length > 0 ? true : false,
			groupsLoaded: Object.keys(props.groups).length > 0 ? true : false,
			seriesLoaded: props.series.length > 0 ? true : false,
			timersLoaded: props.timers.length > 0 ? true : false,
			recordingsLoaded: props.recordings.length > 0 ? true : false,
			open: false,
			get pixelsPerMinute ( ) {
				return _this.state.columnWidth / _this.state.minutesPerColumn;
			},
			get pixelsPerSecond ( ) {
				return _this.state.columnWidth / _this.state.minutesPerColumn / 60;
			}
		};
		
		this.guideData = [];
		this.dayOfWeek = moment().format("dddd");
		this.scrollTop = 0;
		let startTime = moment().startOf('hour').subtract(30, 'm').unix() - moment().startOf('hour').subtract(this.props.guidePreHours, 'h').unix() ;
		this.scrollLeft = startTime * this.state.pixelsPerSecond;
		this._cachedKeyPress = '';
		
		this._channelList = this._channelList.bind(this);
		this._cellSizeAndPositionGetter = this._cellSizeAndPositionGetter.bind(this);
		this._renderBodyCell = this._renderBodyCell.bind(this);
		this._renderHeaderTimeCell = this._renderHeaderTimeCell.bind(this);
		this._renderCurrentTimeCell = this._renderCurrentTimeCell.bind(this);
		this._renderChannelCell = this._renderChannelCell.bind(this);
		this.handleLeftNav = this.handleLeftNav.bind(this);
		this.leftNavClose = this.leftNavClose.bind(this);
		this.toggleDrawer = this.toggleDrawer.bind(this);
		this.menu = this.menu.bind(this);
		this._onScroll = this._onScroll.bind(this);
		this.useGenreColors = this.useGenreColors.bind(this);
		this.setTimer = this.setTimer.bind(this);
		this.deleteTimer = this.deleteTimer.bind(this);
		this.handleKeyPressDebouncing = this.handleKeyPressDebouncing.bind(this);
		
		this._update = true;
				
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  EPG HOME',  this.props, this.state);
		this._channelList( { ...this.props, ...this.state } , ( err, ret ) => ( this.setState( { channelList: ret, height: document.documentElement.clientHeight - 40} ) ));
		if ( !this.props.episode ) {
			document.removeEventListener( "keypress", this.handleKeyPress, false );
			document.addEventListener( "keypress", this.handleKeyPress, false );
			document.removeEventListener( "keypress", this.handleKeyPressDebouncing, false );
			document.addEventListener( "keypress", this.handleKeyPressDebouncing, false );
			
		} else {
			document.removeEventListener( "keypress", this.handleKeyPress, false );
			document.removeEventListener( "keypress", this.handleKeyPressDebouncing, false );
		}
	}
	
	componentWillUnmount ( ) {
		document.removeEventListener( "keypress", this.handleKeyPress, false );
		document.removeEventListener( "keypress", this.handleKeyPressDebouncing, false );
	}
	
	componentDidUpdate (prevProps, prevState) {
		if ( prevState.group !== this.state.group || prevState.sortGuideBy !== this.state.sortGuideBy ) {
			if ( this.grid2 ) this.grid2.forceUpdate();
			if ( this.grid1 ) this.grid1.forceUpdate();
			if ( this.collection ) this.collection.forceUpdate()
		}
		
	}
	
	componentWillReceiveProps ( props ) {
				
		debug('## componentWillReceiveProps  ## EPG got props',  this.state, props );
		
		let state = {	
			group: props.params.group ? props.params.group : this.state.group,
			sortGuideBy: props.query.sortGuideBy ? props.query.sortGuideBy : this.state.sortGuideBy,
			numberOfGuideDays: props.numberOfGuideDays,
		};
		
		state.group = state.group.trim();
		state.sortGuideBy = state.sortGuideBy.trim(); 
		
		if ( state.group !== this.state.group || state.sortGuideBy !== this.state.sortGuideBy || this.state.channelList.length === 0 ) {
			this._channelList(  { ...props, ...state } , ( err, ret ) => ( this.setState( { ...state, channelList: ret } ) ));
		} else {
			this.setState( state );
		}
	}
	
	shouldComponentUpdate ( ) {
		if(this._update) {
			this._update = false;
			return true;
		}
		return true;
	}
	
	handleKeyPress = ( event ) => {
		this._cachedKeyPress = this._cachedKeyPress + event.key;
		this.forceUpdate();
		// debug( 'handleKeyPress', event.key, event.keyCode, this._cachedKeyPress );
	}
	
	_bounced = ( ) => {
		//debug( '_bounced', this._cachedKeyPress );
		let found = findIndex(this.state.channelList, ( channel ) => {
			//debug( channel.channel.substr( 0, this._cachedKeyPress.length), this._cachedKeyPress )
			if( channel.channel.substr( 0, this._cachedKeyPress.length) == this._cachedKeyPress ) {
				//debug( 'Found', channel.channel );
				return true;
			}
			return false;
		})
		if ( found < 0 ) { 
			found = findIndex(this.state.channelList, ( channel ) => {
				//debug( channel.channel.substr( 0, this._cachedKeyPress.length), this._cachedKeyPress )
				if ( channel.channelName.match(new RegExp(this._cachedKeyPress, "i")) ) {
					return true;
				}
				return false;
			})
		}
		this._cachedKeyPress = ''; 
		
		debug( 'GOTO', found );
		
		if ( found >= 0 ) {
			this.scrollTop = found * this.state.rowHeight;
		}
		this.forceUpdate();
	}
	
	handleKeyPressDebouncing = debounce(this._bounced, 750)
	
	useGenreColors () {
		this.setState( { useGenreColors: !this.state.useGenreColors }, () => {
			this.collection.forceUpdate();
			this.leftNavClose();
		});
	}
	
	setTimer ( timer ) {
		Gab.emit('snackbar', {
			style: 'info',
			html: "Sending Timer Request",
			open: true,
			onRequestClose: () => {},
		});
		this.props.Request({
			action: 'setTimer',
			timer
		})
		.then(data => {
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'warning',
					html: data.message,
					open: true,
					onRequestClose: () => {},
				});
				//setTimeout( this.props.reload, 10000, ['getSeries', 'getTimers'] );
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html:  e.message,
				open: true,
				onRequestClose: () => {}
			});
		});
		
	}
	
	deleteTimer ( timer ) {
		Gab.emit('snackbar', {
			style: 'info',
			html: "Sending Timer Request",
			open: true,
			onRequestClose: () => {},
		});
		this.props.Request({
			action: 'deleteTimer',
			timer
		})
		.then(data => {
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: data.message,
					open: true,
					onRequestClose: () => {},
				});
				//setTimeout( this.props.reload, 10000, ['getSeries', 'getTimers'] );
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: 'Error deleting Timer',
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: e.message,
				open: true,
				onRequestClose: () => {}
			});
		});
		
	}
	
	deleteSeries ( timer ) {
		Gab.emit('snackbar', {
			style: 'info',
			html: "Sending Series Pass Request",
			open: true,
			onRequestClose: () => {},
		});
		this.props.Request({
			action: 'deleteSeriesTimer',
			timer
		})
		.then(data => {
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: data.message,
					open: true,
					onRequestClose: () => {},
				});
				//setTimeout( this.props.reload, 10000, ['getSeries', 'getTimers'] );
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: 'Error deleting Timer',
					open: true,
					onRequestClose: () => {}
				});
			}
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: e.message,
				open: true,
				onRequestClose: () => {}
			});
		});
		
	}
	
	/** ****************RENDER************************************* **/
	render ( ) {		
		if ( this.state.channelList.length < 1 ) {
			
			return (<div style={{ padding: 50, color: this.props.theme.baseTheme.palette.accent1Color }}>
				Waiting for channel list to populate
			</div>);
			
		} else if ( this.props.params.channel ) {
			
			return this.renderChannel();
		
		}
		
		return this.renderGuide();
		
	}
	/** *****************END RENDER******************************* **/
	
	renderChannel ( ) {
		const channel= Find( this.state.channelList, [ 'channel', this.props.params.channel ] );
		debug('renderChannel', this.props.params.channel, channel );
		return (<RenderChannel renderChannel={ channel } setTimer={ this.setTimer }  deleteTimer={ this.deleteTimer } deleteSeries={ this.deleteSeries.bind(this) }  bgcolor={ rgbToHex( { ...LC } ) } goBack={()=>(this.props.goTo('tv/guide') )} { ...this.props } />)
	}
	
	renderGuide ( ) { 

		debug('## render  ##  EPG Home Loaded', this.props, this.state, this.guideData.length);		
				
		const {
			columnCount,
			rowHeaderHeight,
			columnWidth,
			height,
			overscanColumnCount,
			overscanRowCount,
			rowHeight,
			channelList
		} = this.state;
		
		const rowCount = channelList.length;
		const cellCount = this.guideData.length;
		const _height = height;
		
		let hamburger =(<IconButton title="Guide Menu" style={{ position: 'relative', textAlign: 'left', marginLeft: 0, padding: 0, width: 40, height: 40,   }} onClick={this.handleLeftNav} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.props.theme.appBar.textColor || 'initial'} >menu</FontIcon></IconButton>);
		
		let changeChannel = this._cachedKeyPress ?
			( <div style={{ position: 'absolute', top: '15%', left: '15%', fontSize: 124, color: this.props.theme.baseTheme.palette.accent3Color, zIndex: 1300 }} children={this._cachedKeyPress} />)
		:
			( <span /> )
		
		return (
			<div  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: `rgb(${TC.r},${TC.g},${TC.b})` }} >
				{changeChannel}
				<div style={{ position: 'fixed', top: 0, left: 0, paddingLeft: 5, zIndex: 1300 }} children={hamburger} />
				{this.menu()}
				<ScrollSync>
					{ ( {
						clientHeight,
						clientWidth,
						onScroll,
						scrollHeight,
						scrollLeft,
						scrollTop,
						scrollWidth
					} ) => {
						const x = scrollLeft / (scrollWidth - clientWidth);
						const y = scrollTop / (scrollHeight - clientHeight);

						const leftBackgroundColor = LC = mixColors(
							LEFT_COLOR_FROM,
							LEFT_COLOR_TO,
							y
						);
						const leftColor = "#ffffff";
						const topBackgroundColor = TC = mixColors(
							TOP_COLOR_FROM,
							TOP_COLOR_TO,
							x
						);
						const topColor = "#ffffff";
						const middleBackgroundColor = MC = LC;
						const middleColor = "#ffffff";
						return (
							<AutoSizer >
								{({ width, height }) => {
									return ( <div>
											<div className="GridRow">
												<div
													  className="LeftSideGridContainer"
													  style={{
															position: "absolute",
															left: 0,
															top: 0,
															color: 'chartreuse',
															backgroundColor: `rgb(${topBackgroundColor.r},${topBackgroundColor.g},${topBackgroundColor.b})`
													  }}
												>
													<Grid
														cellRenderer={this._renderCurrentTimeCell}
														className="HeaderGrid"
														width={columnWidth}
														height={rowHeaderHeight}
														rowHeight={rowHeaderHeight}
														columnWidth={this._getColumnWidth2}
														rowCount={1}
														columnCount={2}
														ref={ ref => this.grid1 = ref }
													/>
												</div>
												<div
													 className="LeftSideGridContainer"
													 style={{
															position: "absolute",
															left: 0,
															top: rowHeaderHeight,
															color: leftColor,
															backgroundColor: `rgb(${leftBackgroundColor.r},${leftBackgroundColor.g},${leftBackgroundColor.b})`
													 }}
												>
													<Grid
														overscanColumnCount={overscanColumnCount}
														overscanRowCount={overscanRowCount}
														cellRenderer={this._renderChannelCell}
														columnWidth={this._getColumnWidth}
														columnCount={2}
														className="LeftSideGrid"
														height={height - scrollbarSize() - 40}
														rowHeight={rowHeight}
														rowCount={rowCount}
														scrollTop={this.scrollTop}
														width={columnWidth}
														ref={ ref => this.grid2 = ref }
													/>
												</div>
												<div className="GridColumn">
												<div
													style={{
														backgroundColor: `rgb(${topBackgroundColor.r},${topBackgroundColor.g},${topBackgroundColor.b})`,
														color: topColor,
														height: rowHeaderHeight,
														width: width - scrollbarSize()
													}}
												>
													<Grid
														className="HeaderGrid"
														columnWidth={columnWidth}
														columnCount={columnCount}
														height={rowHeaderHeight}
														overscanColumnCount={overscanColumnCount}
														cellRenderer={this._renderHeaderTimeCell}
														rowHeight={rowHeaderHeight}
														rowCount={1}
														scrollLeft={this.scrollLeft}
														width={width - scrollbarSize()}
														ref={ ref => this.grid3 = ref }
													/>
												</div>
												<div
													style={{
														backgroundColor: `rgb(${middleBackgroundColor.r},${middleBackgroundColor.g},${middleBackgroundColor.b})`,
														color: middleColor,
														height: height - 40,
														width
													}}
												>
													<Collection
														className="BodyGrid"
														cellCount={cellCount}
														height={height - 40}
														onScroll={ ( { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } ) => {
															this._onScroll.call( this, { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } ); 
															// run ScrollSync onScroll
															onScroll( { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } );
														}}
														scrollLeft={this.scrollLeft}
														scrollTop={this.scrollTop}
														horizontalOverscanSize={overscanColumnCount}
														verticalOverscanSize={overscanRowCount}
														cellRenderer={this._renderBodyCell}
														cellSizeAndPositionGetter={this._cellSizeAndPositionGetter}
														width={width}
														ref={ ref => this.collection = ref }
													/>
												</div>
												</div>		
											</div>
										</div>
									); //AutoSizer return
								} }
							</AutoSizer>
						); //ScrollSync return
					}}
				</ScrollSync>
			</div>
		);
		
	}
	
	_channelList ( props, callback ) {
		props = { ...props };
		debug( 'Channel list getter',  props, props.group);
		
		if ( !Array.isArray(this.guideData) ) this.guideData = [];
			if ( props.group !== this.state.group || props.sortGuideBy !== this.state.sortGuideBy || this.state.channelList.length === 0 ) {
					let a = props.groups[props.group]
						.map( chan => chan[props.sortGuideBy] )
						.sort(natSort)
						.map( o => {
								let ret = { ...Find( props.groups[props.group], g => g[props.sortGuideBy] === o ) };
								let channel = ret.channel;
								let data = props.entries[channel];
								//ret.guide = data; 
								if ( Array.isArray(data) ) {
									this.guideData = [ ...this.guideData, ...data.filter( c => ( c.startTime < moment().add( ( this.state.minutesPerColumn * ( this.state.columnCount + 1 ) ), 'm' ).unix()  ) ) ];
								}
								return ret;
						});
					
					if ( isFunction( callback ) ) callback(null, a);
					return;
			}
		if ( isFunction( callback ) ) callback(null, []);
		return [];		
	}
	
	_getColumnWidth({ index, time }) {
		switch (index) {
			case 0:
				return 60;
			case 1:
				return 60;
			case 2:
				return 480;
			default:
				return 60;
		}
	}
	
	_getColumnWidth2({ index }) {
		switch (index) {
			case 0:
				return 50;
			case 1:
				return 80;
			case 2:
				return 480;
			default:
				return 60;
		}
	}
	
	_onScroll ( { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth } ) {
		this.scrollLeft = scrollLeft;
		this.scrollTop = scrollTop;
		const now = moment().subtract(this.props.guidePreHours, 'h').unix();
		// check for a date change
		// convert our scroll position to seconds and add on 1 columns for the channel number 
		// add the scroll time to the grid start time and we have the current time of the grid
		const checkBy = ( this.scrollLeft / this.state.pixelsPerSecond ) + now - ( (this.state.minutesPerColumn * 1.2 )* 60  );
		const time = moment.unix(checkBy).format("dddd");
		if ( time !== this.dayOfWeek ) {
			this.dayOfWeek = time;
			if ( this.grid1 ) this.grid1.forceUpdate();
			debug( 'Change dayOfWeek', this.dayOfWeek );
		}
	}
	
	_cellSizeAndPositionGetter({ index }) {
		
		let data = this.guideData[index];
		const { columnCount, pixelsPerSecond, rowHeight, channelList } = this.state;
		const channelIndex = findIndex( channelList, ['channel', data.channel] );
		
		let startTime = moment().startOf('hour').subtract(this.props.guidePreHours, 'h').unix();
		if ( data.startTime == 0 ) {
			data.startTime = startTime;
		}
		//debug( '_cellSizeAndPositionGetter', data, channelIndex, now.unix(), pixelsPerSecond );
		
		const end = moment().add( ( this.props.numberOfGuideDays ), 'd' ).unix();
		const endsAfter = data.endTime > end;
		
		const height = rowHeight;
		const width = endsAfter ? (end - data.startTime) * pixelsPerSecond : (data.endTime - data.startTime) * pixelsPerSecond;
		const x = (data.startTime - startTime) * pixelsPerSecond;
		const y = channelIndex * rowHeight;
		
		//debug('_cellSizeAndPositionGetter', data, channelIndex, height, width, x, y);
		
		return { height, width, x, y };
	}
	
	_renderBodyCell( { index, isScrolling, key, style } ) {
		
		const { rowHeight, columnWidth, channelList } = this.state;
		let data = this.guideData[index];
		const channel = Find( channelList, [ 'channel', data.channel] );
		const channelIndex = findIndex( channelList, ['channel', data.channel] ); 
		
		const isNew = ( (moment.unix(data.firstAired).add(1, 'd').format("dddd M/D/YYYY") == moment.unix(data.startTime).format("dddd M/D/YYYY") || moment.unix(data.firstAired).format("dddd M/D/YYYY") == moment.unix(data.startTime).format("dddd M/D/YYYY")) );
		
		const isTimer = isObject( Find( this.props.timers, ( v ) => ( v.programId == data.programId  ) ) );
		const isSeries = isObject( Find( this.props.series, ( v ) => ( v.show == data.title || v.programId == data.programId  ) ) );
		const isRecorded = isObject( Find( this.props.recordings, [ 'programId', data.programId]  ) );
		//debug('renderBodyCell', this.scrollLeft, style.left, this.scrollLeft - style.left);
		
		let timer = <span />;
		let series = <span />;
		let recordings = <span />;
		
		if ( isTimer ) {
			timer = (
				
					<FontIcon className="material-icons"  color={Styles.Colors.red800} style={{cursor:'pointer', fontSize: 15}}  title="This episode will be recorded">radio_button_checked</FontIcon>
				
			);
		}
		if ( isSeries ) {
			series = (
				
					<FontIcon className="material-icons"  color={Styles.Colors.blue500} style={{cursor:'pointer', fontSize: 15}}  title="You have a Series Pass enabled for this program">fiber_dvr</FontIcon>
				
			);
		}
		if ( isRecorded ) {
			recordings = (
				
					<FontIcon className="material-icons"  color={Styles.Colors.limeA400} style={{cursor:'pointer', fontSize: 15}}  title="This program is recorded">play_circle_filled</FontIcon>
				
			);
		}
		const bgColor = channelIndex % 2 == 0 ? 'none' :  'rgba(0, 0, 0, .1)';
		
		const classNames = { 
			  height: '100%',
			  display: 'flex',
			  overflow: 'hidden',
			  fontWeight: 700,
			  flexDirection: 'column',
			  justifyContent: 'center',
			  alignItems: 'left',
			  textAlign: ((style.left - this.scrollLeft) - columnWidth) < 0 ? 'right' : 'left',
			  padding: '0 5',
			  border: "1px solid "  +  ColorMe( 2, rgbToHex(LC) ).bgcolor,
			  ...style,
		};

		return  (
			<div 
				style={{ 
					...classNames,
					//background: "url('" + data.iconPath + "')  left top / 100% repeat-y fixed",
					//backgroundRepeat: 'repeat-y',
					//backgroundSize: 'cover',
					//backgroundPosition: 'left top / 100%',
					backgroundColor:  this.state.useGenreColors ? "#" + decimalToHexString("" +data.genre) : bgColor,
					cursor: 'pointer',
				}} 
				key={key} 
				onClick={ ( ) => (
					this.props.goTo({ path: '/tv/channel/' + channel.channel + '/' + data.programId, page: 'Program Info' } )
				)}
			>
				<div style={{  maxHeight: style.height / 2, width: style.width - 10, overflow: 'hidden', padding: '0 0', }} >{data.title} </div> 
				<div style={{ maxHeight: style.height / 2, fontWeight: 400,  width: '100%', overflow: 'hidden', padding: ' 0', }} >{data.episode} </div>
				<div style={{ position: 'absolute', top: 0, right: 18, width: 40, height: 15, textAlign: 'right'}}>
					 {recordings}
					 <span style={{ marginLeft: 3 }} />
					{timer}
					
				</div>
				<div style={{ position: 'absolute', top: 0, right: 0, width: 15, height: 80, textAlign: 'center'}}>
					
					{series}
					{ isNew ? <FontIcon className="material-icons" color={this.props.theme.baseTheme.palette.accent3Color} style={{ fontSize:'15px'}}   >fiber_new</FontIcon> : <span /> }
					
				</div>
			</div>
		)
		
	}

	_renderHeaderTimeCell({ columnIndex, key, rowIndex, style }) {
		
		return (
			<div className="headerCell" key={key} style={{
				...style,
				 border: "2px solid "  + ColorMe( 2, rgbToHex(TC) ).bgcolor
			}}>
				{moment().startOf('hour').subtract(this.props.guidePreHours, 'h').add( ( columnIndex*this.state.minutesPerColumn), 'm').format(' h:mm a')}
				<div style={{ 
						width: 1,
						height: '30%',
						left: '50%',
						top: '70%',
						position: 'absolute',
						borderLeft: "4px solid "  + ColorMe( 2, rgbToHex(TC) ).bgcolor
				}} />
			</div>
		);
	}
	
	_renderCurrentTimeCell ({ columnIndex, key, rowIndex, style }) {
		if ( columnIndex === 0 ) return;
		return (
			<div 
				className="headerCell" 
				key={key} 
				style={{
					backgroundColor: style.backgroundColor,
					color: 'chartreuse',
					paddingLeft: 21
				}} 
				children={this.dayOfWeek }
				//children={ <Clock format={'h:mm:ss a'} ticking={true} timezone={'US/Eastern'} /> }
			/>
				
		);
	}
	
	_renderChannelCell ({ columnIndex, key, rowIndex, style }) {
		
		const { channelList, rowHeight } = this.state;
		const { channels } = this.props;		

		const rowClass =
			rowIndex % 2 === 0
				? columnIndex % 2 === 0 ? {} : {backgroundColor: 'rgba(0, 0, 0, .1)'}
				: columnIndex % 2 !== 0 ? {} : {backgroundColor: 'rgba(0, 0, 0, .1)'};
		const rowClass2 =
			rowIndex % 2 === 0
				? columnIndex % 2 !== 0 ? {} : {backgroundColor: 'rgba(0, 0, 0, .1)'}
				: columnIndex % 2 === 0 ? {} : {backgroundColor: 'rgba(0, 0, 0, .1)'};
		
		const classNames = { ...rowClass, 
			  display: 'flex',
			  flexDirection: 'column',
			  justifyContent: 'center',
			  alignItems: 'center',
			  textAlign: 'center',
			  padding: '0 .5em',
			  fontSize: 18,
			  ...style
		};
		
		if ( columnIndex === 0 ) {
			const channel = Find( channels, [ 'channel', channelList[rowIndex].channel ] );
			const className = { 
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				textAlign: 'center',
				//padding: '0 .5em',
				fontSize: 9,
				//background: 'url("' +  + '") no-repeat center',
				overflow: 'hidden',
				cursor: 'pointer',
				...style,
				 ...rowClass2, 
			};
			return (
				<div onClick={ (e) => ( this.props.goTo( { path: '/tv/channel/' + channel.channel, page: channel.channelName } )  ) } style={className} children={ channel.iconPath == '' ? channelList[rowIndex].name : <img title={channelList[rowIndex].name} alt={channelList[rowIndex].name} style={{ maxWidth: '100%', maxHeight: '100%' }} src={channel.iconPath} /> } />
			);
		}
		
		return (
			<div style={classNames} key={key} >
			{channelList ? <div style={{overflow: 'hidden' }}>{channelList[rowIndex].channel}</div> : ''}
			</div>
		);
	}
	
	menu() {
		let hamburger =(<IconButton title="Main Menu" style={{ position: 'relative', textAlign: 'left'   }} onClick={(e) => { this.leftNavClose(); this.props.handleLeftNav(e) }} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.props.theme.appBar.textColor || 'initial'} >menu</FontIcon></IconButton>);
		return (
			<Menu  
				{ ...this.state } 
				{ ...this.props } 
				docked={false} 
				drawer={true} 
				secondary={false} 
				goTo={this.props.goTo} 
				handleLeftNav={this.leftNavClose} 
				toggleDrawer={this.toggleDrawer} 
			>
				<div className="menu" style={{
					height: this.props.window.height,
					width: '100%',
					overflow: 'hidden',
					marginTop: 0,
				}} >
					<div style={{ backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 50, width: '100%' }} >
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							{hamburger}
						</div>
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="TV Channels"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/channels', page: 'Live TV'});
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									featured_videos
								</FontIcon>
							</IconButton>
						</div>
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="Recordings"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/recordings', page: 'Recordings'}, this.leftNavClose);
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									play_circle_filled
								</FontIcon>
							</IconButton>
						</div>	
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="Series Pass & Timers"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/scheduled', page: 'Scheduled'}, this.leftNavClose);
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									fiber_dvr
								</FontIcon>
							</IconButton>
						</div>
					</div>
					{
						Object.keys( this.props.groups ).map( ( keyName, i ) => {
							return (<MenuItem key={keyName} primaryText={keyName}  title={"sort by " + keyName} onClick={ ( ) => { this.props.goTo({ path: '/tv/guide/'+keyName, page: ' by ' + keyName}, this.leftNavClose) } } />)
						})
					}
					<Divider inset={false} style={{ marginBottom: 15 }}/>
					
					<div style={{float:'left',width:'25%', textAlign: 'center'}}>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.state.sortGuideBy === 'name' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/tv/guide/' + this.state.group, query: {sortGuideBy: 'name'}, page: 'sort by name'}, this.leftNavClose) } } title="sort by channel name">sort_by_alpha</FontIcon>
					</div>
					<div style={{float:'left',width:'25%', textAlign: 'center'}}>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.state.sortGuideBy === 'channel' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/tv/guide/' + this.state.group, query: {sortGuideBy: 'channel'}, page: 'next to air'}, this.leftNavClose) } } title="sort by channel number">filter_8</FontIcon>
					</div>
					<div style={{float:'right',width:'25%', textAlign: 'center'}}>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.state.useGenreColors  ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ this.useGenreColors } title="sort by channel number">{this.state.useGenreColors  ? 'invert_colors' : 'invert_colors_off'}</FontIcon>
					</div>
				</div>
			</Menu>
		);
	}
	
	handleLeftNav ( e , stated ) {
		if(e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}
		debug('handleLeftNav', this.state);
		this.props.handleLeftNav ( e, false );
		this.setState( { open: !this.state.open } );
	} 
	
	toggleDrawer ( open ) {
		debug('toggleDrawer', open);
		this.setState( { open } );
	} 
	
	leftNavClose ( ) {
		this.setState( { open: false }, this.forceUpdate );
	}
	
}

EPG.getInitialData = function ( params ) {
	
	let ret = {
		shows: {
			action: 'epg'
		}
	}
	console.log( '### RUN getInitialData EPG ###',  params );
	return ret
}

function decimalToHexString(number)
{
    if (number < 0)
    {
        number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16).toUpperCase();
}

function rgbToHex({ r, g, b }) {
	return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function hexToRgb(hex) {
	  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	  return result
		? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		  }
		: null;
}

/**
 * Ported from sass implementation in C
 * https://github.com/sass/libsass/blob/0e6b4a2850092356aa3ece07c6b249f0221caced/functions.cpp#L209
 */
function mixColors(color1, color2, amount) {
	  const weight1 = amount;
	  const weight2 = 1 - amount;

	  const r = Math.round(weight1 * color1.r + weight2 * color2.r);
	  const g = Math.round(weight1 * color1.g + weight2 * color2.g);
	  const b = Math.round(weight1 * color1.b + weight2 * color2.b);

	  return { r, g, b };
}
