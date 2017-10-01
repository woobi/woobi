import React, { PureComponent } from "react";
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , Divider, FontIcon, IconButton, LinearProgress, MenuItem} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find, sortBy, map as Map, filter as Filter } from 'lodash';
import moment from 'moment';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Collection from 'react-virtualized/dist/commonjs/Collection';
import Grid from 'react-virtualized/dist/commonjs/Grid';
import defaultCellRangeRenderer from 'react-virtualized/dist/commonjs/Grid/defaultCellRangeRenderer';
import ScrollSync from 'react-virtualized/dist/commonjs/ScrollSync';
import scrollbarSize from "dom-helpers/util/scrollbarSize";
import cn from "classnames";
import Menu from '../../common/components/menu';
import natSort from 'javascript-natural-sort';
import Clock from 'react-live-clock';

const LEFT_COLOR_FROM = hexToRgb("#471061");
const LEFT_COLOR_TO = hexToRgb("#0E3A65");
const TOP_COLOR_FROM = hexToRgb("#000000");
const TOP_COLOR_TO = hexToRgb("#333333");

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
		this.state = {
			columnWidth: 120,
			columnCount: 50,
			height: 400,
			overscanColumnCount: 15,
			overscanRowCount: 0,
			rowHeight: 60,
			rowHeaderHeight: 40,
			rowCount: 300,
			cellCount: 300,
			scrollToCell: undefined,
			group: props.params.group ? props.params.group.trim() : 'All channels',
			sortBy: props.query.sortBy ? props.query.sortBy.trim() : 'channel',
			guideLoaded: Object.keys(props.entries).length > 0 ? true : false,
			channelsLoaded: props.channels.length > 0 ? true : false,
			groupsLoaded: Object.keys(props.groups).length > 0 ? true : false,
			open: false
		};
		
		
		this._cellRangeRenderer = this._cellRangeRenderer.bind(this);
		this._renderBodyCell2 = this._renderBodyCell2.bind(this);
		this._renderBodyCell = this._renderBodyCell.bind(this);
		this._renderHeaderTimeCell = this._renderHeaderTimeCell.bind(this);
		this._renderCurrentTimeCell = this._renderCurrentTimeCell.bind(this);
		this._renderChannelCell = this._renderChannelCell.bind(this);
		this._getColumnWidth = this._getColumnWidth.bind(this);
		this.handleLeftNav = this.handleLeftNav.bind(this);
		this.leftNavClose = this.leftNavClose.bind(this);
		this.toggleDrawer = this.toggleDrawer.bind(this);
		this.menu = this.menu.bind(this);
		
		this._update = true;
				
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  EPG HOME',  this.props, this.state);
		this.setState( { height: document.documentElement.clientHeight - 40 } );
		
	}
	
	componentWillUnmount ( ) {
	}
	
	componentDidUpdate (prevProps, prevState) {
		if ( prevState.group !== this.state.group || prevState.sortBy !== this.state.sortBy ) {
			if ( this.grid2 ) this.grid2.forceUpdate();
			if ( this.grid4 ) this.grid4.forceUpdate()
		}
	}

	
	componentWillReceiveProps ( props ) {
				
		debug('## componentWillReceiveProps  ## EPG got props',  this.state, props, this.grid2 );
		
		let state = {
			guideLoaded: Object.keys(props.entries).length > 0 ? true : false,
			channelsLoaded: props.channels.length > 0 ? true : false,
			groupsLoaded: Object.keys(props.groups).length > 0 ? true : false,
			group: props.params.group ? props.params.group : this.state.group,
			sortBy: props.query.sortBy ? props.query.sortBy : this.state.sortBy
		};
		
		state.group = state.group.trim();
		state.sortBy = state.sortBy.trim(); 
		
		this.setState( state );

	}
	
	shouldComponentUpdate ( ) {
		if(this._update) {
			this._update = false;
			return true;
		}
		return true;
	}
	
	menu() {
		return (
			<Menu  
				{ ...this.state } 
				{ ...this.props } 
				docked={false} 
				drawer={true} 
				secondary={false} 
				goTo={this.props.goTo} 
				handleLeftNav={this.LeftNavClose} 
				toggleDrawer={this.toggleDrawer} 
			>
				<div className="menu" style={{
					height: this.props.window.height,
					width: '100%',
					overflow: 'auto',
					marginTop: 0,
				}} >
					<div style={{ backgroundColor: this.props.theme.baseTheme.palette.canvasColor, height: 50, width: '100%' }} >
						<div style={{float:'left',width:'50%', textAlign: 'center'}}>
							<IconButton 
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/livetv/channels', page: 'Live TV'});
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									live_tv
								</FontIcon>
							</IconButton>
						</div>
						<div style={{float:'left',width:'50%', textAlign: 'center'}}>
							<IconButton 
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({page: snowUI.name, path: snowUI.homepage}, this.leftNavClose);
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									home
								</FontIcon>
							</IconButton>
						</div>	
					</div>
					{
						Object.keys( this.props.groups ).map( ( keyName, i ) => {
							return (<MenuItem key={keyName} primaryText={keyName}  title={"sort by " + keyName} onClick={ ( ) => { this.props.goTo({ path: '/livetv/guide/'+keyName, page: ' by ' + keyName}, this.leftNavClose) } } />)
						})
					}
					<Divider inset={false} style={{ marginBottom: 15 }}/>
					
					<div style={{float:'left',width:'50%', textAlign: 'center'}}>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.state.sortBy === 'name' ? Styles.Colors.limeA400 : 'white' }  style={{cursor:'pointer'}} onClick={ () => { this.props.goTo({ path: '/livetv/guide/' + this.state.group, query: {sortBy: 'name'}, page: 'sort by name'}, this.leftNavClose) } } title="sort by channel name">sort_by_alpha</FontIcon>
					</div>
					<div style={{float:'left',width:'50%', textAlign: 'center'}}>
						<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.state.sortBy === 'channel' ? Styles.Colors.limeA400 : 'white' } style={{cursor:'pointer'}}  onClick={ () => { this.props.goTo({ path: '/livetv/guide/' + this.state.group, query: {sortBy: 'channel'}, page: 'next to air'}, this.leftNavClose) } } title="sort by channel number">filter_8</FontIcon>
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
		this.setState( { open: !this.state.open } );
	} 
	
	toggleDrawer ( open ) {
		debug('toggleDrawer', open);
		this.setState( { open } );
	} 
	
	leftNavClose ( ) {
		this.setState( { open: false }, this.forceUpdate );
	}
	
	render ( ) { 
		debug('## render  ##  EPG Home render', this.props, this.state);
		if ( !this.state.guideLoaded || !this.state.channelsLoaded ||  !this.state.groupsLoaded ) {
			
			return (
				<div style={{ padding: 50, color: this.props.theme.baseTheme.palette.accent1Color }}>
					{ !this.state.guideLoaded ? 'Waiting for Guide Data' : <span style={{ color: Styles.Colors.limeA400 }} children='Guide Ready'  /> }
					<br />
					<LinearProgress mode="indeterminate" />
					
					<br />
					{ !this.state.channelsLoaded ? 'Waiting for Channels' : <span style={{ color: Styles.Colors.limeA400 }} children='Channels Ready' /> }
					<br />
					{ !this.state.groupsLoaded ? 'Waiting for Channel Groups' : <span style={{ color: Styles.Colors.limeA400 }} children='Channel Groups Ready' /> }
				</div>
			);
		
		} 
		
		// this.channelList = sortBy( this.props.groups[this.state.group], [this.state.sortBy] );
		
		// sort our list as a human would and attach the guide data
		this.channelList  = this.props.groups[this.state.group]
			.map( chan => chan[this.state.sortBy] )
			.sort(natSort)
			.map( o => {
					let ret = Find( this.props.groups[this.state.group], g => g[this.state.sortBy] === o );
					let channel = ret.channelName;
					let data = this.props.entries[channel];
					ret.guide = data; 
					return ret;
			});
		
		const rowCount = this.channelList.length;
				
		const {
			columnCount,
			rowHeaderHeight,
			columnWidth,
			height,
			overscanColumnCount,
			overscanRowCount,
			rowHeight,
		} = this.state;
		
		let hamburger =(<IconButton title="Menu" style={{ position: 'relative', textAlign: 'left', marginLeft: 0, padding: 0, width: 40, height: 40,   }} onClick={this.handleLeftNav} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.props.theme.appBar.textColor || 'initial'} >menu</FontIcon></IconButton>);
		
		return (
			
			<div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} >
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

					const leftBackgroundColor = mixColors(
						LEFT_COLOR_FROM,
						LEFT_COLOR_TO,
						y
					);
					const leftColor = "#ffffff";
					const topBackgroundColor = this.topBackgroundColor = mixColors(
						TOP_COLOR_FROM,
						TOP_COLOR_TO,
						x
					);
					const topColor = "#ffffff";
					const middleBackgroundColor = this.middleBackgroundColor = mixColors(
						leftBackgroundColor,
						topBackgroundColor,
						0.5
					);
					const middleColor = "#ffffff";
					return (
						<div className="GridRow">
							<div
								  className="LeftSideGridContainer"
								  style={{
										position: "absolute",
										left: 0,
										top: 0,
										color: 'chartreuse',
										//backgroundColor: `rgb(${topBackgroundColor.r},${topBackgroundColor.g},${topBackgroundColor.b})`
								  }}
							>
								<Grid
									cellRenderer={this._renderCurrentTimeCell}
									className="HeaderGrid"
									width={120}
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
									height={height - scrollbarSize()}
									rowHeight={rowHeight}
									rowCount={rowCount}
									scrollTop={scrollTop}
									width={120}
									ref={ ref => this.grid2 = ref }
								/>
							</div>
							<div className="GridColumn">
								<AutoSizer disableHeight>
									{({ width }) => {
										return ( <div>
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
													scrollLeft={scrollLeft}
													width={width - scrollbarSize()}
													ref={ ref => this.grid3 = ref }
												/>
											</div>
											<div
												style={{
													backgroundColor: `rgb(${middleBackgroundColor.r},${middleBackgroundColor.g},${middleBackgroundColor.b})`,
													color: middleColor,
													height,
													width
												}}
											>
												<Grid
													className="BodyGrid"
													columnWidth={columnWidth}
													columnCount={columnCount}
													height={height}
													onScroll={onScroll}
													overscanColumnCount={overscanColumnCount}
													overscanRowCount={overscanRowCount}
													cellRenderer={this._renderBodyCell2}
													//cellRangeRenderer={this._cellRangeRenderer}
													rowHeight={rowHeight}
													rowCount={rowCount}
													width={width}
													ref={ ref => this.grid4 = ref }
												/>
											</div>
										</div>
										)
									} }
								</AutoSizer>
							</div>
						</div>
					);
				}}
			</ScrollSync>
		</div>
		);
		
	}
	
	_getEPGColumnWidth({ index }) {
		
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
	
	_cellRangeRenderer (props) {
				
		const children = defaultCellRangeRenderer(props);
		children.push(
			this._renderBodyCell2( { columnIndex: props.columnStartIndex, rowIndex: props.rowStartIndex, style: props.styleCache } )
		)
		// debug('cellRangeRenderer', children);
		return children
	}
	
	_renderBodyCell( { columnIndex, key, rowIndex, style } ) {
		if (columnIndex < 1) { 
			return;
		}
		
		const classNames = { 
			  height: '100%',
			  display: 'flex',
			  flexDirection: 'column',
			  justifyContent: 'center',
			  alignItems: 'left',
			  textAlign: 'left',
			  padding: 2,
			  border: "2px solid "  + ColorMe( 2.5, ((1 << 24) + (this.middleBackgroundColor.r << 16) + (this.middleBackgroundColor.g << 8) + this.middleBackgroundColor.b).toString(16).slice(1) ).bgcolor ,
			  ...style
		};
		
		return ( <div style={classNames} key={key}  /> );
	}
	_renderBodyCell2({ columnIndex, key, rowIndex, style }) {
		if (columnIndex < 1) { 
			return;
		}
		
		let bTime = moment().startOf('hour').subtract(30, 'm').add( ( columnIndex*30), 'm').unix();
		let eTime = moment().startOf('hour').add( ( columnIndex*30), 'm').unix();
		let data = this.channelList[rowIndex].guide;
		let fits = Filter(data,  v  => (v.startTime <= eTime && v.startTime >= bTime ) )

		if ( fits.length == 0 ) {
			return;
		}
		//let data = this.props.entries[channel];
		
		//debug('renderBodyCell', ColorMe( 10, "#" + ((1 << 24) + (this.middleBackgroundColor.r << 16) + (this.middleBackgroundColor.g << 8) + this.middleBackgroundColor.b).toString(16).slice(1) ));
		
		const classNames = { 
			  height: '100%',
			  display: 'flex',
			  flexDirection: 'column',
			  justifyContent: 'center',
			  alignItems: 'left',
			  textAlign: 'left',
			  padding: 2,
			  border: "2px solid "  + ColorMe( 2.5, ((1 << 24) + (this.middleBackgroundColor.r << 16) + (this.middleBackgroundColor.g << 8) + this.middleBackgroundColor.b).toString(16).slice(1) ).bgcolor ,
			  ...style
		};

		let print = fits.filter( d => d.title != '' ).map( ( d ) => (
			<div 
				style={{ 
					...classNames, 
					width: ( (d.endTime - d.startTime) / 60 ) * 4, 
					backgroundColor : "#" + Number("" + d.genreSubType + d.genreType).toString(16),
					marginLeft: ( (d.startTime - bTime) / 60 ) * 4,
					
				}} 
				key={key} 
			>
				<span children={d.title} /> 
			</div>
		) )

		return ( print )
		
	}

	_renderHeaderTimeCell({ columnIndex, key, rowIndex, style }) {
		
		return (
			<div className="headerCell" key={key} style={{
				...style,
				 border: "2px solid "  + ColorMe( 2, ((1 << 24) + (this.topBackgroundColor.r << 16) + (this.topBackgroundColor.g << 8) + this.topBackgroundColor.b).toString(16).slice(1) ).bgcolor
			}}>
				{moment().startOf('hour').subtract(30, 'm').add( ( columnIndex*30), 'm').format(' h:mm a')}
				<div style={{ 
						width: 1,
						height: '30%',
						left: '50%',
						top: '70%',
						position: 'absolute',
						borderLeft: "4px solid "  + ColorMe( 2, ((1 << 24) + (this.topBackgroundColor.r << 16) + (this.topBackgroundColor.g << 8) + this.topBackgroundColor.b).toString(16).slice(1) ).bgcolor
				}} />
			</div>
		);
	}

	_renderCurrentTimeCell({ columnIndex, key, style }) {
		if ( columnIndex === 0 ) return;
		return (
			<div 
				className="headerCell" 
				key={key} 
				style={{
					backgroundColor: 'rgb(51, 51, 51)',
					color: 'chartreuse',
					paddingLeft: 21
				}} 
				children={ <Clock format={'h:mm:ss a'} ticking={true} timezone={'US/Eastern'} /> }
			/>
				
		);
	}
	
	_renderChannelCell({ columnIndex, key, rowIndex, style }) {
				
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
			const channel = Find( this.props.channels, [ 'channel', this.channelList[rowIndex].channel ] );
			const className = { 
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				textAlign: 'center',
				//padding: '0 .5em',
				fontSize: 9,
				//background: 'url("' +  + '") no-repeat center',
				overflow: 'hidden',
				...style,
				 ...rowClass2, 
			};
			return (
				<div style={className} children={ channel.iconPath == '' ? this.channelList[rowIndex].name : <img style={{ maxWidth: '100%', maxHeight: '100%' }} src={channel.iconPath} /> } />
			);
		}
		
		return (
			<div style={classNames} key={key} >
			{this.channelList ? <div style={{overflow: 'hidden' }}>{this.channelList[rowIndex].channel}</div> : ''}
			</div>
		);
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
