import React from 'react';
import { AutoComplete, Avatar, FontIcon, MenuItem } from 'material-ui';
import { Styles } from '../styles';
import Gab from '../gab';

import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:auto-search-bar');

export default class AutoSearchBar extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'AutoSearch';		
		this.state = {
			dataSource: [],
			searchText: props.searchText
		}
		
		this.onNewRequest = this.onNewRequest.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.search = this.search.bind(this);
		this.handleSearchInput = this.handleSearchInput.bind(this);
		
	}
	
	componentWillUnmount() {
		Gab.removeListener('ROMSearch12', this.onSearchResults);
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	search(e) {
		e.preventDefault();
		let x = document.getElementsByName("miniSearchBar");
		if(!x[0].value) {
			this.props.props.appState({
				newalert: {
					show: true,
					data: 'A search term is required.',
					autoHideDuration: 10000,
					style: 'warning'
				}
			});	
			return;
		}
		if(typeof this.props.search === 'function') {
			this.props.search(x[0].value);
		} else {
			this.props.props.goTo({
				page: this.props.path,
				path: '/' + this.props.path + '/search/' + x[0].value,
				searchTerms: {
					search: x[0].value,
				}
			});
		}
			
	}
	
	handleSearchInput(value) {
		debug('## handleSearchInput ## search', value);
		if(value) {		
			this.props.props.Request({ 
				find: { 
					$or : [
						{ name: { $regex: '' + value , $options: 'i' } },
						{ tags: { $regex: '' + value , $options: 'i' } },
						{ 'description.brief': { $regex: '' + value , $options: 'i' } } 
					]
				}, 
				select: ' _id name slug ', 
				sort: { name: 1 } 
			}, 'ROMSearch12');
			
			Gab.on('ROMSearch12', this.onSocketResults.bind(this), this.props.list);
		}
		/** http request */
		/* *
			let find;
			try {
				find = JSON.stringify({ 
					$or : [
						{ name: { $regex: '' + value , $options: 'i' } },
						{ tags: { $regex: '' + value , $options: 'i' } },
						{ 'description.brief': { $regex: '' + value , $options: 'i' } } 
					]
				});
			} catch(e) {
				debug.error('## onKey Down ## error:', e);
			}		
			Gab.rawRequest(snowUI.api.uri + 'rombox/find/?list=&emit=find&path=rombox&select=name slug&find=' + find, 'nobody', {}, this.onSearchResults.bind(this));
		* *
		* */
		
	}
	
	onSocketResults(results) {
		let dataSource = [];
		debug('## onSearchResults  ## RESULTS', results);
		if(Array.isArray(results.data['rom-boxes'])) dataSource = results.data['rom-boxes'].map(rom => ({ value: (<MenuItem style={this.props.menuStyle} primaryText={rom.name} value={rom.slug} />), text: '', slug: rom.slug }));
		debug('## onSearchResults  ## SAVE OBJ', results['rom-boxes']);
		this._update = true;
		
		this.setState({	dataSource });
		return dataSource;
	}
	
	onSearchResults(err, results) {
		let dataSource = [];
		debug('## onSearchResults  ## RESULTS', results, err);
		if(Array.isArray(results['rom-boxes'])) dataSource = results['rom-boxes'].map(rom => ({ value: (<MenuItem style={this.props.menuStyle} primaryText={rom.name} value={rom.slug} />), text: '', slug: rom.slug }));
		debug('## onSearchResults  ## SAVE OBJ', results['rom-boxes']);
		this._update = true;
		
		this.setState({	dataSource });
		return dataSource;
	}
	
	onNewRequest(value, index) {
		if(!value) {
			this.props.props.appState({
				newalert: {
					show: true,
					data: 'A search term is required.',
					autoHideDuration: 10000,
					style: 'warning'
				}
			});	
			return;
		}
		if(index > -1) {
			debug('## onNewRequest ## got a device ', value, index);
			this.props.props.goTo({
				page: value.slug,
				path: '/devices/' + value.slug,
			});
		} else {
			this.props.props.goTo({
				page: this.props.path,
				path: '/' + this.props.path + '/search/' + value,
				searchTerms: {
					search: value,
				}
			});
		}
		this.props.toggleDrawer();	
	}
	
	onKeyDown(e) {
		
		const key = e.which || e.keyCode;
		const keyCodes = {
			ENTER: 13,
			ESCAPE: 27,
			UP: 38,
			DOWN: 40
		};
		switch (key) {
			case keyCodes.UP:
			case keyCodes.DOWN:
				e.preventDefault();
				//this.scroll(key);
				break;

			case keyCodes.ENTER:
				//this.search();
				break;

			case keyCodes.ESCAPE:
				//this.refs.input.blur();
				break;
		}
		debug('## onKeyDown ## KEYDOWN search', key);
	}
	
	render() {
		debug('## render ## ', this.state.dataSource);
		return (
			<div className={this.props.container.class}  style={this.props.container.style} >
				<div className={this.props.avatarContainer.class}  style={this.props.avatarContainer.style} >
					<Avatar className={this.props.avatar.class}  style={this.props.avatar.style}  onClick={this.search} style={{cursor:'pointer'}} icon={<FontIcon className="material-icons">search</FontIcon>} />
				</div>
				<div className={this.props.searchBar.class}  style={this.props.searchBar.style}>
					<AutoComplete 
						className={this.props.autoComplete.class}
						onNewRequest={this.onNewRequest}
						onKeyDown={this.onKeyDown}
						onUpdateInput={this.handleSearchInput} 
						inputStyle={this.props.inputStyle} 
						name="miniSearchBar" 
						searchText={this.state.searchText} 
						style={this.props.autoComplete.style} 
						hintText={this.props.hintText} 
						hintStyle={this.props.hintStyle} 
						dataSource={this.state.dataSource}
						dataSourceConfig={{
							text: 'text',
							value: 'value'
						}}
						animated={true}
						maxSearchResults={15}
						filter={AutoComplete.noFilter}
						listStyle={this.props.listStyle}
						menuStyle={this.props.menuStyle}
					/>
				</div>
				<div className="clearfix" />
			</div>
		); 
	}
}

AutoSearchBar.defaultProps = {
	list: 'devices',
	container: {
		class: 'searchBarMini',
		style: {},
	},
	avatar: {
		class: '',
		style: {},
	},
	avatarContainer: {
		class: 'searchAvatar',
		style: {}
	},
	searchBar: {
		class: 'searchBar',
		style: {},
	},
	autoComplete: {
		class: '',
		style: { width:'100%' },
	},
	onNewRequest: ()=>{},
	search: ()=>{},
	onKeyDown: ()=>{},
	onUpdateInput: ()=>{},
	hintText: '',
	searchBarValue: '',
	searchBarDataSource: [],
	theme: {}, 
	inputStyle: { paddingLeft: 2 },
	listStyle: { paddingLeft: 0 },
	menuStyle: { lineHeight: 2 },
	hintStyle: { fontSize:11 },
	
};

AutoSearchBar.childContextTypes = {
    muiTheme: React.PropTypes.object
};

