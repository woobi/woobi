import React from 'react';
import classNames from 'classnames';
import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:searchBarMenu');

class Suggestions extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			activeItem: -1
		};
	}
	onTouchStart(index) {
		this.timer = setTimeout(() => {
			this.setState({activeItem: index});
		}, 200);
	}
	onTouchMove() {
		clearTimeout(this.timer);
		this.touchedMoved = true;
		this.setState({activeItem: -1});
	}
	onTouchEnd(suggestion) {
		if (!this.touchedMoved) {
			setTimeout(() => {
				this.props.onSelection(suggestion);
			}, 220);
		}
		this.touchedMoved = false;
	}
	render() {
		const {highlightedItem, searchTerm, suggestions, style} = this.props;
		const {activeItem} = this.state;
		debug('%#%# styles %$%$', style, this.props);
		return (
			<ul
				className="search-bar-suggestions"
				style={this.props.style}
				onMouseLeave={() => this.setState({activeItem: -1})}>
				{suggestions.map((suggestion, index) =>
					<li
						id={"id"+index}
						style={this.props.style}
						key={index}
						onClick={() => this.props.onSelection(suggestion)}
						onMouseEnter={() => {this.setState({activeItem: index}); $('#id'+index).css('background-color', style.highlight.background);}}
						onMouseLeave={() => {$('#id'+index).css('background-color', 'initial');}}
						onMouseDown={(e) => e.preventDefault()}
						onTouchStart={() => this.onTouchStart(index)}
						onTouchMove={() => this.onTouchMove()}
						onTouchEnd={() => this.onTouchEnd(suggestion)}>
						<span>
							{suggestion.name || suggestion.title}
						</span>
					</li>
				)}
			</ul>
		);
	}
}

Suggestions.propTypes = {
	highlightedItem: React.PropTypes.number,
	searchTerm: React.PropTypes.string.isRequired,
	suggestions: React.PropTypes.array.isRequired
};

export default Suggestions;
