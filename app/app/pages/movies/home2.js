import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader, CardText, FontIcon, Tab, Tabs } from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';
import virtualize from 'react-swipeable-views/lib/virtualize';
import SwipeableViews from 'react-swipeable-views';
const VirtualizeSwipeableViews = virtualize(SwipeableViews);

let debug = Debug('woobi:app:pages:movies:movies');

export default class Movies extends React.Component {
	constructor(props) {
		super(props)
		
		let movies = [];
		if(props.initialData) {
			movies = props.initialData.movies.movies || [];
			this._skipMount = true;
		}
		this.displayName = 'Movies';
		this.state = {
			loading: true,
			movies,
			pageRows: 3,
			map: [],
			slideIndex: 0,
			images: true
		};
		
		this._update = true;
		
		this.gotShows = this.gotShows.bind(this);
		this.movieViews = this.movieViews.bind(this);
		this.movieMap = this.movieMap.bind(this);
		this.handledChange = this.handledChange.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  Movies',  this.props, this.state);
		if(this.state.movies.length === 0) {
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
		let r = this.movieCounts(data);
		this.setState({
			movies: data.movies,
			...r
		});
	}
	
	movieCounts(data) {
		let count = data.movies.length;
		let blocks = this.props.desktop === 'md' ? 3 : this.props.desktop === 'sm' ? 2 : 2;
		//let rows = this.props.desktop === 'md' ? this.state.pageRows : this.state.pageRows - 1 || 1;
		let rows = this.state.pageRows;
		let perPage = rows * blocks;
		let pages = 1 + (count / perPage);
		return {
			count,
			blocks,
			rows,
			perPage,
			pages
		};
	}
	
	movieMap(c, current) {
		let map = <span />;
		let art = 'initial';
		let banner = 'initial';
		if(c.art && this.state.images && current) {
			var asset = Find(c.art, { type: 'fanart' });
			if(asset && this.props.movieImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')no-repeat center top";
			var asset2 = Find(c.art, { type: 'poster' });
			if(asset2 && this.props.moviePosters) banner = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "')no-repeat right top";
			
		}
		return (<div  className="col-xs-12 col-sm-6 col-md-4" style={{ padding: 10,  height: 150, background: art, backgroundSize: 'cover'}}  onClick={(e) => {
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
		</div>);
	}
	
	movieViews() {
		debug('movie views');
		
		let ret = [];
		let tabs = [];
		let tabs2 = [];
		let remem;
		for(let i=0;i<this.state.pages;i++) {
			let pages = [];
			let start = i * this.state.perPage;
			let end = (((i + 1) * this.state.perPage) -1);
			let current = (this.state.slideIndex === i);
			for (let s=start; s<= end; s++) {
				if(start===s && this.state.movies[start]) {
					let ini = this.state.movies[start].title[0].toUpperCase();
					remem = ini;
					if(ini === remem) ini +=  this.state.movies[start].title[1].toLowerCase();
					let uT = this.props.desktop === 'md' ? tabs : tabs.length > 10 ? tabs2 : tabs;
					uT.push(<Tab value={i} label={ini} />);
				} 
				if(this.state.movies[s]) {
					pages.push(this.movieMap(this.state.movies[s], true));
				}
			}
			ret.push((<div key={i}>{pages}</div>));
		}
		
		return { ret, tabs, tabs2 };

	}
	
	handleChange(slideIndex) {
		this._update = true;
		this.setState({
			slideIndex,
			images: false
		});
	}
	
	handledChange() {
		this._update = true;
		this.setState({
			images: true,
		});
	}
	
	render() { 
		debug('## render  ##  Movies Home render', this.state);
		let ret = <span >Loading Movies</span>;
		if (this.state.movies.length > 0) {
			let divs = this.movieViews();
			ret = (<div>
				<Tabs
					onChange={this.handleChange}
					value={this.state.slideIndex}
				>
					{divs.tabs}
					{divs.tabs2}
				</Tabs>
				<SwipeableViews onTransitionEnd={this.handledChange} onChangeIndex={this.handleChange} index={this.state.slideIndex} resistance={true}  slideCount={this.state.pages} children={divs.ret}  />
			</div>);
	
		}	
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
