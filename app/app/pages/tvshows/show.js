import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';

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
			channels
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
		let c = this.state.channel;
		let s = c.sources[row];
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
				{s.description}<br /> 
				<RaisedButton style={buttonStyleP} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Play" onClick={(e) => {
					e.preventDefault();
					Gab.emit('dialog open', { open: false });
					Gab.emit('confirm open', {
						title: s.name +  "",
						answer:(yesno) => { 
							Gab.emit('confirm open', { open: false });
							if(yesno) {
								
							}
							Gab.emit('dialog open', { open: true });
						},
						open: true,
						noText: 'Cancel',
						yesText: 'Please Play', 
						html: 'This will stop the current stream and play <b>' + s.name + '</b>.  It could take a couple minutes for your stream to show the change.  Continue?'
					})
				}} />
				
				<IconButton title="Remove this program from the source queue" style={buttonStyle} key="del" primary={true}   
					children={<FontIcon style={{ }} className="material-icons" color={Styles.Colors.orange600} hoverColor={Styles.Colors.redA400} >remove_from_queue</FontIcon>}
					onClick={(e) => {
						e.preventDefault();
						Gab.emit('dialog open', { open: false });
						Gab.emit('confirm open', {
							title: s.name +  "",
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									
								} else {
									Gab.emit('dialog open', { open: true });
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Yes, remove from queue',
							html: 'This will <b>REMOVE  </b>' + s.name + '.  Continue?'
						})
					}} 
				/>													
				
				<IconButton title="Skip this Program" disabled={true} style={buttonStyle} key="skip"  secondary={true}  >
					<FontIcon style={{ }} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blue600} >pause</FontIcon>
				</IconButton>
				
			</div>),
			title: s.name +  "",
			answer:(yesno) => { 
				Gab.emit('dialog open', { open: false });
			},
			open: true,
			noText: 'Close'
		});
	}
	
	list(list) {
		let c = this.state.show;
		
		let sourceMap = list.map((s, iii) => {
				return (<TableRow>
				<TableRowColumn style={{ width: 100 }}>S{s.season}E{s.episode}</TableRowColumn>
				<TableRowColumn style={{ cursor: 'pointer' }}>{s.name}</TableRowColumn>
			</TableRow>)
		});
		
		let art = '';
		let banner = 'initial';
		if(c.art) {
			var asset = Find(c.art, { type: 'fanart' });
			if(asset) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')   no-repeat center fixed " + this.props.theme.palette.canvasColor;
			
			if (!this._skipMount) {
				//document.body.style.backgroundColor = this.props.theme.pallete.canvasColor;
				document.body.style.background = art;
				document.body.style.backgroundSize = 'cover';
			}
		}
		
		return (
			<CardText expandable={false}>		
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
			</CardText>
		);
	}
	
	render() { 
		debug('## render  ##  TV Show render', this.props, this.state);
		let ret = this.state.show.name ? this.list(this.state.show.episodes) : <Card ></Card>;
		let head = this.state.show.name ? this.state.show.name : 'Loading TV Show';
		
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 0px' }}>
				<Card   zDepth={1} style={{ opacity: '.9' }}>
					<CardHeader 
						style={{ overflow: 'hidden' }}
						title={this.state.show.description}
						avatar={<FontIcon style={{fontSize:'42px', cursor: 'pointer'}} className="material-icons" onClick={(e) => {this.props.goTo({page: 'TV Shows', path: '/library/tv'})}} color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color} title={'Return to TV Shows'} >backspace</FontIcon>}
					/>
				</Card>
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
