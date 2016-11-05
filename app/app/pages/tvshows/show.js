import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardMedia, CardText, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn, Toggle } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';
import Video from '../../common/components/video5';

let debug = Debug('lodge:app:pages:tvshows:show');

export default class Show extends React.Component {
	constructor(props) {
		super(props)
		
		let show = {};
		let channels = {};
		if(props.initialData) {
			if (props.initialData.show) {	
				show = props.initialData.show.show || {};
				channels = props.initialData.show.channels || {};
				this._skipMount = true;
			}
		}
		this.displayName = 'Show';
		this.state = {
			loading: true,
			show,
			channels,
			episode: {},
			fixAudio: false,
			fixVideo: false,
			play: false,//'http://studio:7001/alvin/channel/recentEpisodes'
		};
		
		this.gotShow = this.gotShow.bind(this);

		this._update = true;		
		
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Show',  this.props);
		if(!this._skipMount) {
			this.getShow();
		}
		this._skipMount = false;
		this.props.Sockets.io.on('tvshow:'+ this.state.show.imdb, this.gotShow);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('tvshow:' + this.state.show.imdb, this.gotShow);
		if(document) document.body.style.background = this.props.theme.baseTheme.palette.canvasColor;
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## TVShows got props', props);
		if(props.params.imdb !== this.state.show.imdb) { 
			this.getShow(props.params.imdb);
		}
	}	
	
	shouldComponentUpdate() {
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShow(imdb) {
		this.props.Request({
			action: 'tvshow',
			type: 'imdb',
			imdb: imdb || this.props.params.imdb
		})
		.then(this.gotShow)
		.catch(error => {
			debug('ERROR from TV Show', error)
		});
	}
	
	gotShow(data) {
		this._update = true;
		this.setState({
			show: data.show,
			channels: data.channels,
		});	
	}
	
	dialog(row, col) {
		let c = this.state.show;
		let s = c.episodes[row];
		debug(s);
		const buttonStyle = {
			margin: '30 0 0 12',
			borderRadius: 0,
			float: 'right',
		};
		const buttonStyleP = {
			margin: '30 12 0 0',
			borderRadius: 0,
			float: 'left',
			color: 'white',
		};
		Gab.emit('dialog open', {
			component: (<div>
				
				
				<b>Season {s.season} Episode {s.episode}</b><br />
				<p>{s.description}</p> 
				<p><br />{s.filename}</p>
				<RaisedButton style={buttonStyleP} key="play"  secondary={true} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play Direct" onClick={e => {
						Gab.emit('dialog open', { open: false });
						window.scrollTo(0,0);
						this._update = true;
						this.setState({
							play: encodeURI(snowUI.videoStringReplace(s.file)),
							episode: s,
						});	
				}} />
				<RaisedButton style={buttonStyleP} key="create"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Create Channel" onClick={(e) => {
					e.preventDefault();
					Gab.emit('dialog open', { open: false });
					Gab.emit('dialog2 open', {
						title: s.name +  "",
						answer:(yesno) => { 
							Gab.emit('dialog2 open', { open: false });
							if(yesno) {
								
							} else {
								Gab.emit('dialog open', { open: true });
							}
						},
						open: true,
						noText: 'Cancel',
						component: (<div>
							<p>Some files can not be streamed directly.  You can create a channel to convert those files so they can be viewed everywhere.</p>
							
							<RaisedButton style={buttonStyleP} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Create Channel"  />
							
							<RaisedButton style={buttonStyle} key="clodes"  primary={true}  label="Cancel" onClick={(e) => {
								e.preventDefault();						
								Gab.emit('dialog2 open', { open: false });
								Gab.emit('dialog open', { open: true });
							}} />
							<div className="clearfix" />
							
						</div>)
					})
				}} />	
				<RaisedButton style={buttonStyleP} key="info"  primary={true}  label="Info" onClick={(e) => {
					e.preventDefault();						
					this.props.goTo({
						page: s.name,
						path: '/library/tv/episode/' + s.idShow + '/' + s.episodeID
					});
				}} />
				<div className="clearfix" style={{ height: 20, width:1}} />
				
							
			</div>),
			title: s.name +  "",
			answer:(yesno) => { 
				Gab.emit('dialog open', { open: false });
			},
			open: true,
			noText: 'Close'
		});
	}
	
	fixAudio(s,e,t) {
		debug(s,e)
		this.setState({
			fixAudio: e
		});
	}
	
	list(list) {
		let c = this.state.show;
		let poster= '/images/fanart.gif';
		
		let sourceMap = list.map((s, iii) => {
			if(s.thumb) {
				poster = s.thumb;
			}
			return (<TableRow style={{ background: this.props.theme.palette.canvasColor, opacity: '0.80', fontWeight: 'bold' }}>
				<TableRowColumn style={{ width: 100 }}>S{s.season}E{s.episode}</TableRowColumn>
				<TableRowColumn style={{ width: 64, paddingLeft: '0' }}><img src={poster} width="64" height="36"  /></TableRowColumn>
				<TableRowColumn style={{ cursor: 'pointer' }}>{s.name}</TableRowColumn>
			</TableRow>)
		});
		
		let art = '';
		let banner = 'initial';
		if(c.thumb) {
			art = "url('" + encodeURI(c.thumb) + "')   no-repeat center fixed " + this.props.theme.palette.canvasColor;
		
		} else if(c.art) {
			var asset = Find(c.art, { type: 'fanart' , media_type: 'tvshow' });
			if(asset) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')   no-repeat center fixed " + this.props.theme.palette.canvasColor;
		}
		
		if (!this._skipMount) {
			//document.body.style.backgroundColor = this.props.theme.pallete.canvasColor;
			document.body.style.background = art;
			document.body.style.backgroundSize = 'cover';
		}
		
		return (
				<Table
					style={{ background: 'transparent' }}
					fixedHeader={true}
					selectable={false}
					multiSelectable={true}
					onCellClick={this.dialog.bind(this)}
				>
					<TableHeader
						displaySelectAll={false}
						adjustForCheckbox={false}
						enableSelectAll={false}
					>
						<TableRow>
							<TableHeaderColumn style={{ width: 100 }}></TableHeaderColumn>
							<TableHeaderColumn></TableHeaderColumn>
						</TableRow>
					</TableHeader>
					<TableBody
						displayRowCheckbox={false}
						deselectOnClickaway={true}
						showRowHover={true}
						stripedRows={false}
						
					>
						{sourceMap}
					</TableBody>
				</Table>
		);
	}
	
	video() {
		if(this.state.play) {
			let art = false;
			if(this.state.episode.thumb) {
				art = this.state.episode.thumb;
			} else if (this.state.episode) {
				var asset = Find(this.state.episode.art, { type: 'fanart', media_type: 'tvshow' });
				if(asset) art =  encodeURI(snowUI.artStringReplace(asset.url));
			} else if (this.state.show.art) {
				var asset = Find(this.state.show.art, { type: 'fanart', media_type: 'tvshow'  });
				if(asset) art =  encodeURI(snowUI.artStringReplace(asset.url));
			}
			let source = this.state.play + '?';
			if(this.state.fixAudio) source += 'audio=yes';
			if(this.state.fixVideo) source += '&video=yes';
			return (<div style={{  background: 'transparent', width: '100%', position: 'relative' }} ><Video  style={{ margin: 'auto'  }} chromeless={true} source={source} poster={art} mimeType="video/mp4"  width={480} height={270} mute={false} controls={true} listenTo={this.state.show.name + ":video"}  /></div>);
		}
		return <span />;
	}
	
	render() { 
		debug('## render  ##  TV Show render', this.props, this.state);
		let ret = this.state.show.name ? this.list(this.state.show.episodes) : <Card ></Card>;
		let head = this.state.show.name ? this.state.show.name : 'Loading TV Show';
		
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 0px' }}>
				<Card   zDepth={1} style={{}} initiallyExpanded={this.state.play == ''} style={{ overflow: 'hidden', background: this.props.theme.palette.canvasColor, opacity: '.85' }}>
					<CardHeader 
						
						title={this.state.show.description}
						avatar={<FontIcon style={{fontSize:'42px', cursor: 'pointer'}} className="material-icons" onClick={(e) => {this.props.goTo({page: 'TV Shows', path: '/library/tv'})}} color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color} title={'Return to TV Shows'} >backspace</FontIcon>}
						actAsExpander={false}
						showExpandableButton={false}
					/>
					
				</Card>
				{this.video()}
			</div>
			{ret}
		</div>);
	}
	
}

Show.getInitialData = function(params) {
	
	let ret = {
		show: {
			action: 'tvshow',
			type: 'imdb',
			imdb: params.imdb
		}
	}
	console.log('### RUN getInitialData TV Show ###',  params);
	return ret
}
