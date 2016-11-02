import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon, IconButton, RaisedButton, Table, TableRow, TableHeader, TableHeaderColumn, TableBody, TableRowColumn } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe, Random } from '../../common/utils';
import { map } from 'lodash';
import { find as Find } from 'lodash';

let debug = Debug('lodge:app:pages:movies:movie');

export default class Show extends React.Component {
	constructor(props) {
		super(props)

		let show = {};
		let channels = {}
		if (props.initialData) {
			if (props.initialData.movie) {
				show = props.initialData.movie.show || {};
				channels = props.initialData.movie.channels || {};
				this._skipMount = true;
			}
		}
		this.displayName = 'Show Movie';
		this.state = {
			loading: true,
			show,
			channels,
		};
		
		this._update = true;
		
		this.gotShow = this.gotShow.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Show Movie',  this.props);
		if(!this._skipMount) {
			this.getShow();
		} else {
			this.getShow({ movie: this.state.show, channels: this.state.channels })
			.catch(e => {
				debug('Error with art', e);
			});
		}
		this._skipMount = false;
		this.props.Sockets.io.on('movie', this.gotShow);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('movie', this.gotShow);
		document.body.style.background = this.props.theme.baseTheme.palette.canvasColor;
	}
	
	componentWillReceiveProps(props) {
		debug('##  ## Movie got props', this.state);
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
			action: 'movie',
			type: 'imdb',
			imdb: imdb || this.props.params.imdb
		})
		.then(this.gotShow)
		.catch(error => {
			debug('ERROR from Movie', error)
		});
	}
	
	gotShow(data) {
			this._update = true;
			this.setState({
				show: data.movie,
				channels: data.channels,
			});
	}
	
	list(list) {
		let c = this.state.show;
		let s = c;
		let lll = { ...list };
		delete lll.art;
		let sourceMap = map(lll, (s, k) => {
				return (<TableRow>
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
			<CardText expandable={false}>		
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
			</CardText>
		);
	}
	
	render() { 
		debug('## render  ##  Movie render', this.props, this.state);
		let ret = this.state.show.title ? this.list(this.state.show) : <Card ></Card>;
		let head = this.state.show.title ? this.state.show.title : 'Loading Movie';
		
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			<div style={{ padding: '10px 0px' }}>
				<Card   zDepth={1}>
					<CardHeader
						style={{ overflow: 'hidden' }}
						title={this.state.show.description}
						avatar={<FontIcon style={{fontSize:'42px', cursor: 'pointer'}} className="material-icons" onClick={(e) => {this.props.goTo({page: 'Movies', path: '/library/movies'})}}  color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color} title={'Return to Movies'} >backspace</FontIcon>}
					/>
				</Card>
			</div>
			{ret}
		</div>);
	}
	
}

Show.getInitialData = function(params) {
	
	let ret = {
		movie: {
			action: 'movie',
			type: 'imdb',
			imdb: params.imdb
		}
	}
	console.log('### RUN getInitialData Movie ###',  params);
	return ret
}
