import React, { PureComponent } from "react";
import Debug from 'debug';
import Gab from '../../../common/gab';
import { Styles } from '../../../common/styles';
import moment from 'moment';
import Table from '../../../common/components/table';
import { FlatButton, Divider, FontIcon, IconButton } from 'material-ui';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { isObject, find as Find, filter as Filter } from 'lodash';

let debug = Debug('woobi:app:pages:epg:components:channel');

export default class EPGChannel extends PureComponent {
	constructor( props, context ) {
		super( props, context )
				
		this.displayName = 'EPGChannel';
						
		this.state = {
			programId: props.params.episode,
			program: {},
			guide: [],
			boxHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto': props.window.height - 172,
			show: 'plot',
			wrapperHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 122,
			anyChannel: 1, // any channel
			anyTime: 1, // anytime
			runType: 1 // new eps only
		};
		
		this.changeProgram = this.changeProgram.bind(this);
		this.renderFutureEpisodes = this.renderFutureEpisodes.bind(this);
		this.show = this.show.bind(this);
		this.changeFutureEpisode = this.changeFutureEpisode.bind(this);
		this.getGuideProgram = this.getGuideProgram.bind(this);
		this.getGuideData = this.getGuideData.bind(this);
		this.getOtherPrograms = this.getOtherPrograms.bind(this);
		this.deleteTimer = this.deleteTimer.bind(this);
		this.deleteSeries = this.deleteSeries.bind(this);
		this.addTimer = this.addTimer.bind(this);
		this.addSeries = this.addSeries.bind(this);
		this.renderRecordScreen = this.renderRecordScreen.bind(this);
			
	}
	
	componentDidMount ( ) {
		if ( this.state.programId ) this.getGuideProgram( );
		this.getGuideData( );
	}
	
	componentWillReceiveProps ( props ) {
		let state = {
			boxHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 172,
			wrapperHeight: props.desktop === 'xs' || props.desktop === 'sm' ? 'auto' : props.window.height - 122,
		}
		if ( props.params.episode && ( props.params.episode !== this.state.programId ) ) {
			state.programId = props.params.episode;
			state.show = 'plot';
		}
		if ( this.state.guide.length === 0 || this.props.params.channel != this.state.guide[0].channel ) {
			this.getGuideData(); 
		}
		debug( 'componentWillReceiveProps', state);
		this.setState( state, this.getGuideProgram );
	}
	
	getGuideData (  ) {
		debug( 'getGuideData', this.props.renderChannel.epgId );
		this.props.Request({
			action: 'getGuideData',
			id: this.props.renderChannel.epgId
		})
		.then(data => {
			debug('### got getGuideData ###', data);
			this._update = true;
			this.setState({
				guide: Filter( data.entries.groups[this.props.renderChannel.channel], v => ( Number(v.startTime) > moment().unix() ) ),
			});
		})
		.catch(error => {
			debug('ERROR from getGuideData', error)
		});
	}
	
	getGuideProgram ( programId ) {
		programId = programId || this.state.programId;
		debug(programId);
		this.props.Request({
			action: 'getGuideProgram',
			search: programId,
		})
		.then(data => {
			debug('### getGuideProgram ###', data);
			this._update = true;
			this.setState({
				program: data.program[0],
				futureEpisodes: [],
			}, () => { 
				this.getOtherPrograms( this.state.program.title.replace(/ *\([^)]*\) */g, "").trim(), 'title')
			} );
		})
		.catch(error => {
			debug('ERROR from getGuideProgram', error)
		});
	}
	
	getOtherPrograms ( search, key ) {
		this.props.Request({
			action: 'getGuideProgram',
			search,
			key
		})
		.then(data => {
			debug('### getOtherPrograms ###', data);
			this._update = true;
			this.setState({
				futureEpisodes: Filter( data.program, v => ( Number(v.startTime) > moment().unix() ) ),
			});
		})
		.catch(error => {
			debug('ERROR from getOtherPrograms', error)
		});
	}
	
	changeFutureEpisode ( rowId ) {
		let program = this.state.futureEpisodes[rowId];
		debug('changeFutureEpisode', this.state, program);
		let programId = program.programId;
		this.props.goTo({ path: '/tv/channel/' + program.channel + '/' + programId, page: 'Program Info' } );
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
			{ 
				field: 'title',  
				label: 'Program',
				style: { fontSize: 11 },  
				print: (v, props, obj) => { 
					return <div>{v}<br /> { obj.episode }</div> 
				}
			},	
			{ field: 'channelName',  label: 'Channel', style: { fontSize: 11 },  },
		];
		return (
			<Table 
				fields={fields}
				headerStyle={{
					padding: 0,
					height: 24,
					textAlign: 'left'
				}} 
				list={ this.state.futureEpisodes }
				tableProps={ { 
					style: { background: 'none', fontSize: 11 },
					fixedHeader: false,
					fixedFooter: true,
					height: this.state.boxHeight - 72,
					selectable: true ,
					onRowSelection: this.changeFutureEpisode 
				} }
				
				tableRowColumnProps={{
					style: { fontSize: 11 },
				}}
				footerStyle={{
						height: 24,
						textAlign: 'left'
				}}
				tableRowProps={ { 
					style: { cursor: 'pointer', fontSize: 11 },
					displayBorder: false,
					selectable: true,
					
				} }
				tableHeaderColumnProps ={ {
					style: {
						height: 24,
					}
				} }
				tableHeaderProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterRowProps = { {
					style: {
						padding: 0,
						height: 24,
					}
				} }
			 />
		);
			
	}
	
	changeProgram ( rowId ) {
		let programId = this.state.guide[rowId].programId;
		this.props.goTo({ path: '/tv/channel/' + this.props.renderChannel.channel + '/' + programId, page: 'Program Info' } );
		window.scrollTo(0, 0);
	}
	
	renderSchedule (  ) {
		return ( 
			<Table 
				day={ moment().format('D') } 
				list={ this.state.guide }
				footerStyle={{
						height: 24,
						textAlign: 'left'
				}}
				tableRowProps={ { 
					style: { cursor: 'pointer' },
					displayBorder: false,
					selectable: true
				} }
				tableHeaderColumnProps ={ {
					style: {
						height: 24,
						textAlign: 'left'
					}
				} }
				tableHeaderProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterRowProps = { {
					style: {
						padding: 0,
						height: 24,
						textAlign: 'left'
					}
				} }
				tableProps={ { 
					style: { background: 'none' },
					fixedHeader: false,
					fixedFooter: true,
					height: this.state.boxHeight - 15,
					selectable: true ,
					onRowSelection: this.changeProgram 
				} }
				fields={ [
					{ 
						field: 'startTime', 
						style: { width: 115 } , 
						label: 'Time' , 
						print: (v, props, obj) => { 
							let div = (<div style={{ position: 'relative', width: '100%', height: 18,  marginTop: -15, marginLeft: -23, padding: '2px 0px 0px 5px'}}>{moment.unix(v).format('ddd MMM Do')}</div>);
							return <div>{div}{moment.unix(v).format('h:mm a')}</div> 
						} 
					},
					{ 
						field: 'title',  
						label: 'Program' ,
						print: (v, props, obj) => { 
							return <div>{v}<br /> { obj.episode }</div> 
						}
					},
				] }
			/> 
		);
	}
	
	show ( what ) {
		this.setState( { show: what } );
	}
	
	renderScheduled ( program, list ) {
		//debug('renderScheduled', program.title, this.props.timers, Filter( this.props.timers, ( t ) => { t.name.replace( '(R)', '' ).trim() == program.title.replace( '(R)', '' ).trim()  } ))
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
			{ 
				field: 'programId',  
				label: 'Program',
				style: { fontSize: 11 },  
				print: (v, props, obj) => { 
					const p = Find( this.state.futureEpisodes, b => ( b.programId == v ) ) || {}
					return <div>{ p.episode || program.title }</div> 
				}
			},	
			{ 
				field: 'channelId',  
				label: 'Channel', 
				style: { fontSize: 11 },
				print: (v, props, obj) => { 
					const p = Find( this.props.channels, b => ( b.channelId == v ) ) || {}
					return <div> { p.channelName }</div> 
				}  
			},
		];
		
		return (
			<Table 
				fields={fields} 
				list={ list }
				tableProps={ { 
					style: { background: 'none', fontSize: 11 },
					fixedHeader: false,
					fixedFooter: true,
					height: this.state.boxHeight - 121,
					selectable: true ,
					onRowSelection: ( i ) => {
						let programId = list[i].programId;
						let channel = Find( this.props.channels, (v) => ( v.channelId == list[i].channelId ));
						//debug(programId, list[i])
						if( channel ) this.props.goTo({ path: '/tv/channel/' + channel.channel + '/' + programId, page: 'Program Info' } );
					}
				} }
				
				tableRowColumnProps={{
					style: { fontSize: 11 },
				}}
				footerStyle={{
						height: 24,
						textAlign: 'left'
				}}
				tableRowProps={ { 
					style: { cursor: 'pointer', fontSize: 11 },
					displayBorder: false,
					selectable: true
				} }
				tableHeaderColumnProps ={ {
					style: {
						height: 24,
					}
				} }
				tableHeaderProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterProps ={ {
					adjustForCheckbox: false,
				}}
				tableFooterRowProps = { {
					style: {
						padding: 0,
						height: 24,
					}
				} }
				
			 />
		);	
	}
	
	renderRecordScreen ( ) {
		
		const { program } = this.state;
		
		if ( !program.title ) {
			return ( <span>waiting for the program information</span> );
		}
		
		const isTimer = isObject( Find( this.props.timers, ( v ) => { return v.programId == program.programId  } ) );
		
		const seriesO = Find( this.props.series, ( v ) => { 
			let byS = false;
			if( typeof v.show == 'string' && typeof program.title == 'string' ) {
				byS = ( v.show.replace(/ *\([^)]*\) */g, "").trim() == program.title.replace(/ *\([^)]*\) */g, "").trim() );
			}
			const byP = ( v.programId == program.programId );
			
			return ( byS || byP );
			  
		} )
		
		const isSeries = isObject( seriesO );
		
		let timer = (
			<FlatButton 
				title={ ( program.endTime < moment().unix() ) ? "Can not record a past program" : isTimer ? "This episode will be recorded.  Click to delete" : "Record This Episode" } 
				backgroundColor={isTimer ? Styles.Colors.red800 : 'initial'}
				hoverColor={Styles.Colors.red800}
				style={{ float: 'right', position: 'relative', textAlign: 'left'   }} 
				onClick={  isTimer ? this.deleteTimer : this.addTimer  } 
				icon={<FontIcon className="material-icons" children={'radio_button_checked'} />}
				label={ isTimer ? " Will be Recorded " : " Record Program " }
				disabled={ program.endTime < moment().unix() }
			/>
		);
		
		let series = (
			<FlatButton 
				title={ isSeries ? "This program has a Series Pass.  Click to delete it." : "Create a Series Pass for this Program" } 
				style={{ float: 'left', position: 'relative', textAlign: 'left'   }} 
				onClick={ isSeries ? this.deleteSeries.bind(this, seriesO) : this.addSeries }
				icon={<FontIcon className="material-icons" children={'fiber_dvr'} />}
				backgroundColor={isSeries ? Styles.Colors.blue500 : 'initial'}
				hoverColor={Styles.Colors.blue500}
				label={ isSeries ? " Series Pass " : " Add a Series Pass " }
				
			/>
		);
		
		let list = Filter( this.props.timers, ( t ) => ( t.name.replace(/ *\([^)]*\) */g, "").trim() == program.title.replace(/ *\([^)]*\) */g, "").trim() ) );
		
		let innerList = (<div>
			<h5 style={{ padding: 0, margin: '10 0 10 0' }} >Scheduled Recordings</h5>
			{ program.title ? this.renderScheduled.call( this, program, list ) : <span /> }
		</div>);
		
		return (<div style={{ paddingTop: 0 }}>
			{timer}{series}
			<div className="clearfix" style={{ paddingTop: 10 }} >
					{ list.length > 0 ? innerList : <div style={{ textAlign: 'center' }}>No upcoming episodes are scheduled to be recorded.</div> }
			</div>
		</div>);
	}
	
	renderProgram ( ) {
		//debug( 'renderProgram', this.state.broadcastUid, this.props, Find( this.props.renderChannel.guide, ( v ) => ( v.broadcastUid == this.state.broadcastUid  ) ) );
		let { programId, program } = this.state;
		
		if ( !programId ) {
			return ( <span>choose a program from the channel guide</span> );
		} else if ( !program.title ) {
			return ( <span>loading the program information</span> );
		}
		
		let episode = <span />;
		if ( program.episode ) {
			episode = (
				<div style={{ color: this.props.theme.baseTheme.palette.accent1Color, marginBottom: 5, overflow: 'hidden', fontSize: 14 }}>	
					<div className="channelProgramTitle" children={ program.episode } />
				</div>
			);
		}
		
		const isTimer = isObject( Find( this.props.timers, ( v ) => ( v.programId == program.programId  ) ) );
		
		const isSeries = isObject( Find( this.props.series, ( v ) => { 
			let byS = false;
			if( typeof v.show === 'string' && typeof program.title === 'string' ) {
				byS = ( v.show.replace(/ *\([^)]*\) */g, "").trim() == program.title.replace(/ *\([^)]*\) */g, "").trim() );
			}
			const byP = ( v.programId == program.programId );
			return ( byS || byP );
			  
		} ) );
		
		return (<div>
			
			<div style={{ height: '50px', marginTop: 5,  overflow: 'hidden', fontSize: 16 }}>	
				<div className="channelProgramTitle" children={ program.title } />
				{ episode }
			</div>
			
			<div className="col-xs-1" style={{ marginTop: 0, padding: 0, height: this.state.boxHeight }}>
				{ !isSeries ? <span /> : <IconButton title="This program has a Series Pass" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons"  style={{fontSize:'20px'}}  color={Styles.Colors.blue500} >fiber_dvr</FontIcon></IconButton> }
				<IconButton title={ isTimer ? "This episode will be recorded" : "Record Options" } style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('record') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.red400} style={{fontSize:'20px'}}  color={isTimer ? Styles.Colors.red800 : this.state.show === 'record' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >radio_button_checked</FontIcon></IconButton>
				<IconButton title="Plot" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('plot') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'plot' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >description</FontIcon></IconButton>
				<IconButton title="Cast" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('cast') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'cast' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >people</FontIcon></IconButton>
				<IconButton title="Other Showings" style={{ padding: 0, position: 'relative', textAlign: 'left'   }} onClick={ () => ( this.show('other') ) } ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.show === 'other' ? Styles.Colors.limeA400 : this.props.theme.appBar.textColor || 'initial'} >live_tv</FontIcon></IconButton>
				
				
			</div>
			<div className="col-xs-11" style={{ paddingTop: 6, paddingBottom: 0, height: this.state.boxHeight, overflow: 'auto' }}>
				
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'plot' ? 'block' : 'none' }}>
					<span>{moment.unix(program.startTime).format("dddd LT")}</span>
					<br />
					{moment.unix(program.firstAired).add(1, 'd').format("dddd M/D/YYYY") == moment.unix(program.startTime).format("dddd M/D/YYYY") ? <FontIcon className="material-icons" color={this.props.theme.baseTheme.palette.accent3Color} style={{fontSize:'20px'}}   >fiber_new</FontIcon> : <span>First Aired: {moment.unix(program.firstAired).add(1, 'd').format("dddd M/D/YYYY LT")} </span>}
					<div style={{ marginTop: 5 }} className="channelProgramPlot" children={ program.plot } />
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'cast' ? 'block' : 'none' }}>
					<div className="channelProgramPeopleHeader">Cast</div>
					<div className="channelProgramCast" children={ !program.cast ? 'no information provided' : program.cast.split(',').map((v) => ( <div children={<a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + v.trim()} target="_blank" >{v}</a>} /> ) ) } />
					<div className="channelProgramPeopleHeader">Director(s)</div>
					<div className="channelProgramDirector" children={ !program.director ? 'no information provided' : program.director.split(',').map((v) => ( <div children={<a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + v.trim()} target="_blank" >{v}</a>} /> ) ) } />
					<div className="channelProgramPeopleHeader">Writer(s)</div>
					<div className="channelProgramWriter" children={ !program.writer ? 'no information provided' : program.writer.split(',').map((v) => ( <div children={<a href={"http://www.imdb.com/find?s=nm&exact=true&q=" + v.trim()} target="_blank" >{v}</a>} /> ) ) } />
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'other' ? 'block' : 'none' }}>					
					<h5 style={{ padding: 0, margin: '7 0 10 0' }} >Upcoming Episodes</h5>
					{ this.renderFutureEpisodes( program ) }
					
				</div>
				<div className="" style={{  overflow: 'auto', display: this.state.show === 'record' ? 'block' : 'none' }}>					
					{ this.renderRecordScreen( program ) }
					
				</div>
			</div>
		</div>)
	}
	
	render ( ) {
		debug('render', this.props.renderChannel, this.state);
		const channel = this.props.renderChannel;
		const { program } = this.state;
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
							<div style={{ fontSize: 16, marginTop: -4 }} >
							{channel.channel } - <span>{!program.startTime ? '' : moment.unix(program.startTime).format("dddd LT")}</span>
							</div>
						</div>
					</div>
					
					<div  style={{ position: 'relative', height: this.state.wrapperHeight, overflow: 'hidden' }}>
						<div  className="col-xs-12 col-md-6" style={{ padding: '0 15px' }}  children={ this.renderProgram() } />
						<div  className="col-xs-12 col-md-6" style={{ height: '100%', padding: '0 15px' }}  >
							<h5 style={{ padding: 0, marginBottom: 10 }} >Channel Guide</h5>
							{ this.renderSchedule() }
						</div>
					</div>
										
				</div>		
			</div>
		)
	}	
	
	addTimer ( ) {
		Gab.emit('confirm open', {
			title: "Record Single Program ",
			html: "Do you want to record " + this.state.program.title + "?",
			answer: ( yesno ) => { 
				if ( yesno) {
					
					Gab.emit('confirm open', { open: false });
					// add a new timer
					const { program } = this.state;
					const send = {
						channelId: this.props.renderChannel.channelId, // Channel ID
						startTime: program.startTime, // Start date and time of listing
						endTime: program.endTime,  // End date and time of listing
						title: program.title.replace(/ *\([^)]*\) */g, "").trim(), // name of listing
						channel:  this.props.renderChannel.channel,
						channelName:  this.props.renderChannel.channelName,
						//priority: obj.priority || 0,  //XBMc Priotiry (not used)
						//marginStart: obj.marginStart || 0, // pre padding in minutes
						//marginEnd: obj.marginEnd || 0,  // post padding in minutes
						//isRepeating: obj.isRepeating || 0,  // XBMC bIsRepeating (not used)
						programId: program.programId,  // ScheduleEntry ID
						//isSeries: 0, 
						//type: 0, 
						//anyChannel: 0, 
						//anyTime: 0
					}
					debug('Record Program', send);
					this.props.setTimer( send ); 
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' Record Program ', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor: Styles.Colors.red800,
				labelStyle: {
					color: 'white',
				}
			}
		})
	}
	
	deleteTimer (  ) {
		const timer = Find( this.props.timers, ( v ) => { return v.programId == this.state.program.programId  } )
		Gab.emit('confirm open', {
			title: 'Scheduled Timer for ' + this.state.program.title + ' ',
			html: "Do you want to remove the scheduled timer for " + this.state.program.title + "?",
			answer: ( yesno ) => { 
				if ( yesno) {
					Gab.emit('confirm open', { 
						style: { backgroundColor: Styles.Colors.red300 },
						title: 'This is Permanent',
						open: true,
						html: "Are you positive? This will permanently remove the scheduled timer for "  + this.state.program.title,
						answer: ( yesno ) => { 
							Gab.emit('confirm open', { open: false });
							if ( yesno ) {
								const { program } = this.state;
								const send = {
									startTime: program.startTime, // Start date and time of listing
									title: program.title, // name of listing
									channel:  this.props.renderChannel.channel,
									channelName:  this.props.renderChannel.channelName,
									timerId: timer.timerId 
								}
								debug('Cancel Recording Program', send);
								this.props.deleteTimer( send ); 
							}
						},
						yesText: 'Permanently Delete', 
						noStyle: {
							backgroundColor: 'initial',
							labelStyle: {
								color: 'white',
							}
						},
						yesStyle: {
							backgroundColor: Styles.Colors.red800,
							labelStyle: {
								color: 'white',
							}
						}
					});
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' DELETE Timer', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor: Styles.Colors.red800,
				labelStyle: {
					color: 'white',
				}
			}
		})
	}
	
	addSeries ( ) {
		
		let { program, runType, anyChannel, anyTime } = this.state;
		
		Gab.emit('dialog open', {
			title: "Add a Series Pass for "  + program.title,
			open: true,
			closeText: false,
			component: (
				<div className="" > 

					<div className="col-xs-12">
						<select style={{ border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ runType: e.target.value}))} >
							<option value="1">Record New Episodes Only</option>
							<option value="0">Record New and Repeat Episodes</option>
							<option value="2">Record Live Showing Only</option>
						</select>
					</div>
					<div className="clearfix" style={{ marginBottom: 10 }}  />
					<div className="col-xs-12">
						<select style={{ border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ anyChannel: e.target.value}))} >
							<option value="1">Record on any channel</option>
							<option value="0">Record on {this.props.renderChannel.channel} only</option>
						</select>
					</div>
					<div className="clearfix" style={{ marginBottom: 10 }} />
					<div className="col-xs-12">
						<select style={{ border: 'none', backgroundColor: this.props.theme.baseTheme.palette.canvasColor }}  onChange={e => ( this.setState({ anyTime: e.target.value}))} >
							<option value="1">Record at any time</option>
							<option value="0">Record at { moment.unix(this.state.program.startTime).format("h:mm a") } only.</option>
						</select>
					</div>
					<div className="clearfix" style={{ marginBottom: 20 }} />
					<div >
						<FlatButton 
							title=" Add Series Pass " 
							//backgroundColor={Styles.Colors.blue500}
							hoverColor={Styles.Colors.blue500}
							style={{ float: 'left', position: 'relative', textAlign: 'left'   }} 
							onClick={  () => {
								
								let send = {
									channelId: this.props.renderChannel.channelId, // Channel ID
									startTime: program.startTime, // Start date and time of listing
									endTime: program.endTime,  // End date and time of listing
									title: program.title.replace(/ *\([^)]*\) */g, "").trim(), // name of listing
									channel:  this.props.renderChannel.channel,
									channelName:  this.props.renderChannel.channelName,
									//priority: obj.priority || 0,  //XBMc Priotiry (not used)
									//marginStart: obj.marginStart || 0, // pre padding in minutes
									//marginEnd: obj.marginEnd || 0,  // post padding in minutes
									isRepeating: 1,  // XBMC bIsRepeating (not used)
									programId: program.programId,  // ScheduleEntry ID
									isSeries: 1, 
									runType: this.state.runType, // the type of episodes to record (0->all, 1->new, 2->live)
									anyChannel: this.state.anyChannel, // whether to rec series from ANY channel 0/-1 true / false
									anyTime: this.state.anyTime // whether to rec series at ANY time 0/-1 true / false
								}
								debug('send', send, this.state)
								// add a new timer
								this.props.setTimer(send); 
								Gab.emit('dialog open', { open: false });
							} } 
							icon={<FontIcon className="material-icons" children={'fiber_dvr'} />}
							label={ " Add Series Pass " }
						/>
						<FlatButton 
							title=" Cancel " 
							//backgroundColor={Styles.Colors.blue500}
							//hoverColor={Styles.Colors.red800}
							style={{ float: 'left', position: 'relative', textAlign: 'left' , marginLeft: 15  }} 
							onClick={  () => ( Gab.emit('dialog open', { open: false }) ) } 
							label={ " Cancel " }
						/>
					</div>
				</div>
			)
		})
	}
	
	handleFormElement = function(field, e) {
		var nextState = {}
		nextState[field] = Number(e.target.value);
		debug('Change types', nextState );
		this.setState(nextState);
	}
	
	deleteSeries ( series ) {
		Gab.emit('confirm open', {
			title:  'Series Pass for ' + series.name,
			html: "Do you want to remove the Series Pass for " + series.name + "?",
			answer: ( yesno) => { 
				if ( yesno) {
					Gab.emit('confirm open', { 
						style: { backgroundColor: Styles.Colors.red300 },
						title: 'This is Permanent',
						open: true,
						html: "Are you positive? This will permanently remove the Series Pass for "  + series.name,
						answer: ( yesno ) => { 
							Gab.emit('confirm open', { open: false });
							if ( yesno ) {
								const send = {
									title: series.showName, // name of listing
									seriesId: series.seriesId,
									showName: series.showName,
									show: series.show
								}
								debug('Cancel Season Pass', send);
								this.props.deleteSeries( send ); 
							}
						},
						yesText: 'Remove Season Pass', 
						noStyle: {
							backgroundColor: 'initial',
							labelStyle: {
								color: 'white',
							}
						},
						yesStyle: {
							backgroundColor: Styles.Colors.red800,
							labelStyle: {
								color:  'white',
							}
						}
					});
				} else {
					Gab.emit('confirm open', { open: false });
				}
			},
			open: true,
			noText: 'Cancel',
			yesText: ' DELETE Series Pass', 
			noStyle: {
				backgroundColor: 'initial',
				labelStyle: {
					color: 'white',
				}
			},
			yesStyle: {
				backgroundColor:Styles.Colors.red800,
				labelStyle: {
					color:   'white',
				}
			}
		})
	}
	
	
}


