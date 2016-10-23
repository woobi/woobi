import 'es6-promise';
import classNames from 'classnames';
import React from 'react';
import Suggestions from './searchBarMenu'; //eslint-disable-line no-unused-vars
import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:searchBar');

const keyCodes = {
	ENTER: 13,
	ESCAPE: 27,
	UP: 38,
	DOWN: 40
};

class SearchBar extends React.Component {
  constructor(props) {
		super(props);
		
		this.state = {
			highlightedItem: -1,
			searchTerm: '',
			suggestions: [],
			value: ''
		};
		this.initialState = { ...this.state };
		if(props.value) this.state.value = props.value;
		
		this.onSearch = this.onSearch.bind(this);
	}
	
	componentDidMount() {
		if (this.props.autoFocus) {
			this.refs.input.focus();
		}
	}
	
	normalizeInput() {
		return this.state.value.toLowerCase().trim();
	}
	
	autosuggest() {
		if(this.props.onChange) {
			debug('## onChange ## RUN autosuggest', this.props.onChange);
			const searchTerm = this.normalizeInput();
			if (!searchTerm) return;
			new Promise((resolve) => {
				this.props.onChange(searchTerm, resolve);
			}).then((suggestions) => {
				if (!this.state.value) return;
				this.setState({
					highlightedItem: -1,
					searchTerm,
					suggestions
				});
			});
		}
	}
	
	scroll(key) {
		const {highlightedItem: item, suggestions} = this.state;
		const lastItem = suggestions.length - 1;
		let nextItem;

		if (key === keyCodes.UP) {
			nextItem = (item <= 0) ? lastItem : item - 1;
		} else {
			nextItem = (item === lastItem) ? 0 : item + 1;
		}

		this.setState({
			highlightedItem: nextItem,
			value: suggestions[nextItem]
		});
	}
	
	search(send = false, isClick = false) {
		debug('###  SEARCH ###', send, isClick, this.state.value);
		if (send === false && !this.state.value) {
			this.props.appState({
				newalert: {
					show: true,
					data: 'A search term is required.',
					autoHideDuration: 10000,
					style: 'warning'
				}
			});			
			return;
		}
		const value = send || this.normalizeInput();
		clearTimeout(this.timer);
		this.refs.input.blur();
		const {highlightedItem, suggestions} = this.initialState;
		this.setState({highlightedItem, suggestions});
		debug('### DO SEARCH ###', value, isClick);
		if (this.props.onSearch) {
			this.props.onSearch(value, isClick);
		}
	}
	
	onChange(e) {
		const input = e.target.value;
		if (!input) return this.setState(this.initialState);
		this.setState({value: input});
		this.autosuggest();
		if(this.props.altOnChange) {
			this.props.altOnChange(input);
		}
	}
	
	onKeyDown(e) {
		const key = e.which || e.keyCode;
		switch (key) {
			case keyCodes.UP:
			case keyCodes.DOWN:
				e.preventDefault();
				this.scroll(key);
				break;

			case keyCodes.ENTER:
				this.search();
				break;

			case keyCodes.ESCAPE:
				this.refs.input.blur();
				break;
		}
		
	}
	
	onSelection(suggestion) {
		this.search(suggestion, true)
	}
	
	onSearch(e) {
		debug('### ON SEARCH ###', e);
		e.preventDefault();
		this.search();		
	}
	
	render() {
		/*eslint-disable quotes*/
		let _this = this;
		
		return (
			<div className="search-bar-wrapper">
				<form onSubmit={this.onSearch} action={this.props.action} > 
					<div className={classNames(
						'search-bar-field',
						{'is-focused': this.state.isFocused},
						{'has-suggestions': this.state.suggestions.length > 0}
					)}>
						<input
							className="icon icon-left search-bar-submit"
							type="submit"
							onClick={this.onSearch} />
						<input
							className="search-bar-input"
							style={this.props.searchBarStyle}
							name={this.props.inputName}
							type="text"
							maxLength="100"
							autoCapitalize="none"
							autoComplete="off"
							autoCorrect="off"
							ref="input"
							value={this.state.value}
							placeholder={this.props.placeholder}
							onChange={this.onChange.bind(this)}
							onBlur={() => this.setState({isFocused: false, suggestions: []})}
							onKeyDown={this.state.suggestions && this.onKeyDown.bind(this)}
							onFocus={() =>  { this.autosuggest(); this.setState({isFocused: true}) } } />
							{ this.state.value &&
								<span
									className="icon search-bar-clear"
									onClick={() => this.setState(this.initialState, ()=>this.search(''))}>
								</span> }
						
					</div>
					{ this.state.suggestions.length > 0 &&
						<Suggestions
							searchTerm={this.state.searchTerm}
							style={this.props.searchMenuStyle}
							suggestions={this.state.suggestions}
							highlightedItem={this.state.highlightedItem}
							onSelection={this.onSelection.bind(this)} /> }
				</form>
			</div>
		);
	}
	/*eslint-enable quotes*/
}

SearchBar.propTypes = {
	autoFocus: React.PropTypes.bool,
	delay: React.PropTypes.number,
	inputName: React.PropTypes.string,
	onChange: React.PropTypes.func,
	onSearch: React.PropTypes.func,
	appState: React.PropTypes.func,
	placeholder: React.PropTypes.string
};

SearchBar.defaultProps = {
	autoFocus: false,
	delay: 0,
	inputName: 'searchBarInput',
	appState: ()=>{},
	action: "/noscript/search/"
};

export default SearchBar;
