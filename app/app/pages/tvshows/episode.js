import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe, Random } from '../../common/utils';
import { map } from 'lodash';
import { find as Find } from 'lodash';

let debug = Debug('woobi:app:pages:tvshows:episode');

export default class Episode extends React.Component {
	constructor(props) {
		super(props)

		let show = {};
		let episode = {}
		if (props.initialData) {
			if (props.initialData.show) {
				show = props.initialData.show || {};
				episode = Find(show.episodes, { episodeID: props.params.episode }) || {};
				this._skipMount = true;
			}
		}
		this.displayName = 'Show Episode';
		this.state = {
			loading: true,
			show,
			episode,
		};
		
		this._update = true;
		
		this.gotShow = this.gotShow.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Show',  this.props);
		if(!this._skipMount) {
			this.getShow();
		}
		this._skipMount = false;
		this.props.Sockets.io.on('tvshow:'+ this.state.show.episodeID, this.gotShow);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('tvshow:' + this.state.show.episodeID, this.gotShow);
		if(document) document.body.style.background = this.props.theme.baseTheme.palette.canvasColor;
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## TVShows got props', props);
		if(props.params.episode !== this.state.episode.episodeID) { 
			this.getShow(props.params.show);
		}
	}	
	
	shouldComponentUpdate() {
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShow(idShow) {
		this.props.Request({
			action: 'tvshow',
			type: 'id',
			showId: idShow || this.props.params.show
		})
		.then(this.gotShow)
		.catch(error => {
			debug('ERROR from TV Show', error)
		});
	}
	
	gotShow(data) {
		this._update = true;
		debug(data, this.props.params.episode, data.show.episodes, Find(data.show.episodes, (r=>(r.episodeID == this.props.params.episode))));
		this.setState({
			show: data.show,
			episode: Find(data.show.episodes,  (r=>(r.episodeID == this.props.params.episode))),
		});	
	}
	
	list(list) {
		let c = this.state.episode;
		let s = c;
		let lll = { ...list };
		delete lll.art;
		let sourceMap = map(lll, (s, k) => {
				return (<TableRow  style={{ background: this.props.theme.palette.canvasColor, opacity: '0.855', fontWeight: 'bold' }}>
				<TableRowColumn key={k} style={{ width: 200 }}>{k}</TableRowColumn>
				<TableRowColumn key={k} style={{ cursor: 'pointer' }}>{s}</TableRowColumn>
			</TableRow>)
		});
		
		let art = '';
		if(c.art) {
			var asset = Find(c.art, { type: 'fanart' });
			if(asset) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')   no-repeat center fixed " + this.props.theme.palette.canvasColor;
			
			if (!this._skipMount) {
				debug(art, this._skipMount)
				document.body.style.background = art;
				document.body.style.backgroundSize = 'cover';
			}
		}
		
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
	
		let keys = Object.keys(c);
		
		return (
				<Table
					style={{ background: 'transparent' }}
					fixedHeader={true}
					selectable={false}
					multiSelectable={true}
					onCellClick={(row, col) => {
						debug(row, col, s[keys[row]])
						Gab.emit('dialog open', {
							html: s[keys[row]],
							title: keys[row],
							answer:(yesno) => { 
								Gab.emit('dialog open', { open: false });
							},
							open: true,
							noText: 'Close'
						});
					}}
				>
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
	
	render() { 
		debug('## render  ##  Episode render', this.props, this.state);
		let ret = this.state.episode.title ? this.list(this.state.episode) : <Card ></Card>;
		let head = this.state.episode.title ? this.state.episode.title : 'Loading Movie';
		let poster= '/images/fanart.gif';
		if(this.state.episode.thumb) {
			poster = this.state.episode.thumb;
		}
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 0px' }}>
				<Card   zDepth={1} style={{ background: this.props.theme.palette.canvasColor, opacity: '.90' }}>
					<CardHeader
						style={{ overflow: 'hidden' }}
						subtitle={<p><b>Season {this.state.episode.season} Episode {this.state.episode.episode}<br /><br />{this.state.episode.title}</b><br />{this.state.episode.description}</p>}
						title={<div><img src={poster} width="240" height="135"  style={{ float: 'left', margin: '0 10px' }} />{this.state.show.name}</div>}
						avatar={<FontIcon style={{fontSize:'42px', cursor: 'pointer'}} className="material-icons" onClick={(e) => {history.back();}}  color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color} title={'Return to Recent Episodes'} >backspace</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

Episode.getInitialData = function(params) {
	
	let ret = {
		show: {
			action: 'tvshow',
			type: 'id',
			showId: params.show
		}
	}
	console.log('### RUN getInitialData Episode ###',  params);
	return ret
}
