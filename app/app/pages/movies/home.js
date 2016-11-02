import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';

let debug = Debug('lodge:app:pages:movies:movies');

export default class Movies extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		if(props.initialData) {
			shows = props.initialData.movies.movies || [];
			this._skipMount = true;
		}
		this.displayName = 'Movies';
		this.state = {
			loading: true,
			shows,
		};
		
		this._update = true;
		
		this.gotShows = this.gotShows.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Movies',  this.props, this.state);
		if(this.state.shows.length === 0) {
			this.getShows();
		}
		this.props.Sockets.io.on('movies', this.gotShows);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('movies', this.gotShows);
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## Movies got props', props);
		//this.getChannels();
		//this._update = true;
	}	
	
	shouldComponentUpdate() {
		debug('should movies update', this._update);
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShows() {
		this.props.Request({
			action: 'movies',
			limit: 50,
		})
		.then(this.gotShows)
		.catch(error => {
			debug('ERROR from Movies', error)
		});
	}
	
	gotShows(data) {
		this._update = true;
		return this.setState({
			shows: data.movies,
		});
	}
	
	render() { 
		//debug('## render  ##  Channels Home render', this.props, this.state);
		let ret = <span >Loading Movies</span>;
		if (this.state.shows.length > -1) {
			ret =  this.state.shows.map((c, i) => {
				let art = 'initial';
				let banner = 'initial';
				if(c.art) {
					var asset = Find(c.art, { type: 'fanart' });
					if(asset && this.props.movieImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')no-repeat center";
					var asset2 = Find(c.art, { type: 'poster' });
					if(asset2 && this.props.moviePosters) banner = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "')no-repeat right top";
					
				}
				return (<div className="col-xs-12 col-sm-6 col-md-4" style={{  padding: 10, cursor: 'pointer', height: 150, background: art, backgroundSize: 'cover'}}  onClick={(e) => {
						e.preventDefault();
						this.props.goTo({
							page: c.title,
							path: '/library/movies/' + c.imdb
						});
					}} > 
					<Card zDepth={1}  style={{ opacity: '.85' }}>
						<CardText
							children={c.name}
							style={{ height: 150, background: banner, backgroundSize: '35%' }}
						/>
					</Card>
				</div>)
			});
		}
		//return <div>{ret}</div>;
		return (<div style={{ padding: '0 10px' }}>
			{ret}
		</div>);
	}
	
}

Movies.getInitialData = function(params) {
	
	let ret = {
		movies: {
			action: 'movies'
		}
	}
	console.log('### RUN getInitialData Movies ###',  params);
	return ret
}
