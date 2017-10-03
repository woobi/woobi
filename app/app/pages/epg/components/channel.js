import React, { PureComponent } from "react";
import Debug from 'debug';
import { Styles } from '../../../common/styles';
import moment from 'moment';
import Table from '../../../common/components/table';
import { Divider, FontIcon, IconButton } from 'material-ui';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { isObject, find as Find, filter as Filter } from 'lodash';

let debug = Debug('woobi:app:pages:epg:components:channel');

export default class EPGChannel extends PureComponent {
	constructor( props, context ) {
		super( props, context )
				
		this.displayName = 'EPGChannel';
		let _this = this;
		
		this.state = {
			broadcastUid: props.params.episode,
			boxHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto': props.window.height - 195,
			show: 'plot',
			wrapperHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 130,
		};
		
		this.changeProgram = this.changeProgram.bind(this);
		this.renderFutureEpisodes = this.renderFutureEpisodes.bind(this)
		this.show = this.show.bind(this);
			
	}
	
	componentWillReceiveProps ( props ) {
		let state = {
			boxHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 200,
			wrapperHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 130,
		}
		if ( props.params.episode && ( props.params.episode !== this.state.broadcastUid ) ) {
			state.broadcastUid = props.params.episode;
		}
		debug( 'componentWillReceiveProps', state);
		this.setState( state );
	}
	
	changeProgram ( rowId ) {
		let broadcastUid = this.props.renderChannel.guide[rowId].broadcastUid;
		this.props.goTo({ path: '/tv/channel/' + this.props.renderChannel.channel + '/' + broadcastUid, page: 'Program Info' } );
		window.scrollTo(0, 0);
	}
	
	renderFutureEpisodes ( program ) {
		let fields = [
			{ 
				field: 'startTime', 
				style: { width: 115, fontSize: 11  } , 
				label: 'Time' , 
				print: (v, props, obj) => { 
					let div = (<div style={{ position: 'relative', width: '100%', height: 18,  marginTop: -15, marginLeft: -23, padding: '2px 0px 0px 5px'}}>{moment.unix(v).format('ddd MMM Do')}</div>);
					return <div>{div}{moment.unix(v).format('h:mm a')}</div> 
				} 
			},
			{ field: 'info',  label: 'Episode', style: { fontSize: 11 },  },
			{ field: 'channel',  label: 'Channel', style: { fontSize: 11 },  },
		];
		return (
			<Table 
				fields={fields} 
				list={ Filter( this.props.entriesMap, ['title', program.title] ).map( ( v ) => ( 
					{
						startTime: this.props.entries[v.channelName][v.key].startTime, 
						info:  this.props.entries[v.channelName][v.key].episodeName ||  this.props.entries[v.channelName][v.key].plotOutline, 
						channel: v.channelName
					}
				)  ) }
				tableProps={ { 
					style: { background: 'none', fontSize: 11 },
					fixedHeader: true,
					height: this.state.boxHeight - 150,
					selectable: false ,
				} }
				tableRowProps={ { 
					style: { cursor: 'pointer', fontSize: 11 },
					displayBorder: false,
					selectable: false ,
				} }
				tableBodyProps={ { 
					
					displayBorder: false,
					displayRowCheckbox: false
				} }
				tableRowColumnProps={{
					style: { fontSize: 11 },
				}}
			 />
		);
			
	}
	
	renderSchedule ( entries ) {
		return ( 
			<Table 
				day={ moment().format('D') } 
				list={ entries }
				tableRowProps={ { 
					style: { cursor: 'pointer' },
					displayBorder: false,
				} }
				tableProps={ { 
					style: { background: 'none' },
					fixedHeader: true,
					height: this.state.boxHeight,
					selectable: true ,
					onRowSelection: this.changeProgram 
				} }
				fields={ [
					{ 
						field: 'startTime', 
						style: { width: 115 } , 
						label: 'Time' , 
						print: (v, props, obj) => { 
							let div = (<div style={{ position: 'relative', width: '100%', height: 18,  marginTop: -15, marginLeft: -23, padding: '2px 0px 0px 5px'}}>{moment.unix(v).format('dddd')}</div>);
							return <div>{div}{moment.unix(v).format('h:mm a')}</div> 
						} 
					},
					{ field: 'title',  label: 'Program'  },
				] }
			/> 
		);
	}
	
	show ( what ) {
		this.setState( { show: what } );
	}
	
	renderProgram ( ) {
		//debug( 'renderProgram', this.state.broadcastUid, this.props, Find( this.props.renderChannel.guide, ( v ) => ( v.broadcastUid == this.state.broadcastUid  ) ) );
		let channel = this.props.renderChannel;
		let program = Find( channel.guide, ( v ) => ( v.broadcastUid == this.state.broadcastUid  ) );
		if ( !program ) {
			program = channel.guide[0];
		}
		
		let episode = <span />;
		if ( program.episodeName ) {
			episode = (
				<div style={{ color: this.props.theme.baseTheme.palette.accent1Color, marginBottom: 5, overflow: 'hidden', fontSize: 18 }}>	
					<div className="channelProgramTitle" children={ program.episodeName } />
				</div>
			);
		}
		
		const isTimer = isObject( Find( this.props.timers, ( v ) => { return v.episodeId == program.broadcastUid  } ) );
		
		const isSeries = isObject( Find( this.props.series, ( v ) => ( v.show == program.title  ) ) );
		
		return (<div>
			
			<div style={{ height: '48px', marginTop: 10,  overflow: 'hidden', fontSize: 24 }}>	
				<div className="channelProgramTitle" children={ program.title } />
			</div>
			
			<div className="col-xs-1" style={{ marginTop: 0, padding: 0, height: this.state.boxHeight }}>
				<IconButton title="Plot" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('plot') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'plot' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >description</FontIcon></IconButton>
				<IconButton title="Cast" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('cast') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'cast' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >people</FontIcon></IconButton>
				<IconButton title={ isTimer ? "This episode will be recorded" : "Record Options" } style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.red400} style={{fontSize:'20px'}}  color={isTimer ? Styles.Colors.red800 : this.state.show === 'record' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >radio_button_checked</FontIcon></IconButton>
				{ !isSeries ? <span /> : <IconButton title="This program has a Series Pass" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons"  style={{fontSize:'20px'}}  color={Styles.Colors.blue500} >fiber_dvr</FontIcon></IconButton> }
			</div>
			<div className="col-xs-11" style={{ height: this.state.boxHeight, overflow: 'auto' }}>
				{ episode }
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'plot' ? 'block' : 'none' }}>
					<span>{moment.unix(program.startTime).format("dddd LT")}</span>
					<br />
					{moment.unix(program.firstAired).add(1, 'd').format("dddd M/D/YYYY") == moment.unix(program.startTime).format("dddd M/D/YYYY") ? <FontIcon className="material-icons" color={this.props.theme.baseTheme.palette.accent3Color} style={{fontSize:'20px'}}   >fiber_new</FontIcon> : <span>First Aired: {moment.unix(program.firstAired).add(1, 'd').format("dddd M/D/YYYY LT")} </span>}
					<div style={{ marginTop: 5 }} className="channelProgramPlot" children={ program.plot } />
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'cast' ? 'block' : 'none' }}>
					<div className="channelProgramPeopleHeader">Cast</div>
					<div className="channelProgramCast" children={ program.cast.split(',').map((v) => ( <div children={<a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + v.trim()} target="_blank" >{v}</a>} /> ) ) } />
					<div className="channelProgramPeopleHeader">Director(s)</div>
					<div className="channelProgramDirector" children={ program.director.split(',').map((v) => ( <div children={<a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + v.trim()} target="_blank" >{v}</a>} /> ) ) } />
					<div className="channelProgramPeopleHeader">Writer(s)</div>
					<div className="channelProgramWriter" children={ program.writer.split(',').map((v) => ( <div children={<a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + v.trim()} target="_blank" >{v}</a>} /> ) ) } />
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'record' ? 'block' : 'none' }}>					
					{ this.renderFutureEpisodes( program ) }
					
				</div>
			</div>
		</div>)
	}
	
	render ( ) {
		debug('renderChannel', this.props.renderChannel, this.state);
		const channel = this.props.renderChannel;
		return (
			<div style={{ 
				zIndex: 1500,
				backgroundColor: this.props.bgcolor,  
				position: 'absolute', 
				top: 0, 
				left: 0, 
				width: '100%', 
				height: '100%',
				
			}} >
				<div style={{ 
					display: 'flex',
					flexDirection: 'column',
					height: '100vh',
				}} >
					<div style={{
						    //display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							width: '100%',
							flexShrink: '0'
					}} >
						<div className="col-xs-3" style={{ height: 40 }} >
							<IconButton iconStyle={{fontSize: '36px'}} title="Menu" style={{ position: 'absolute', top: 5, left: 5, textAlign: 'left', marginLeft: 0, padding: 0, width: 40, height: 40,   }} onClick={this.props.goBack} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'40px'}}  color={this.props.theme.appBar.textColor || 'initial'} >arrow_back</FontIcon></IconButton>
						</div>
						<div className="col-xs-6" />
						<div className="col-xs-3" style={{ textAlign: 'right', padding: '10px 10px 0 0',  height: 40,  }}>
							<img style={{ maxWidth: 100 }} src={channel.iconPath} />
						</div>
					
						<div className="col-xs-12" style={{ marginTop: 10, color: 'white', paddingLeft: 15, textAlign: 'left', fontWeight: 400, fontSize: 32 }}>
							{ channel.name }
							<br />
							<div style={{ fontSize: 16, marginTop: -6 }} children={channel.channel} />
						</div>
					</div>
					
					<div  style={{ position: 'relative', height: this.state.wrapperHeight }}>
						<div  className="col-xs-12 col-md-6" style={{ padding: '0 15px' }}  children={ this.renderProgram() } />
						<div  className="col-xs-12 col-md-6" style={{ height: '100%', padding: '0 15px' }} children={ this.renderSchedule( channel.guide ) } />
					</div>
										
				</div>		
			</div>
		)
	}	
}
