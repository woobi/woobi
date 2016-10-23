import React from 'react';
import { Menu, MenuItem, Popover, PopoverAnimationVertical, RaisedButton } from 'material-ui';

export default class PopoverExampleAnimation extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			open: false,
		};
	}

	handleTouchTap = (event) => {
		// This prevents ghost click.
		event.preventDefault();
		this.setState({
			open: true,
			anchorEl: event.currentTarget,
		});
	};

	handleRequestClose = () => {
		this.setState({
			open: false,
		});
	};

	render() {
		return (
			<div>
				<RaisedButton
					onTouchTap={this.handleTouchTap}
					label={this.props.label}
				/>
				<Popover
					open={this.state.open}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
					targetOrigin={{horizontal: 'left', vertical: 'top'}}
					onRequestClose={this.handleRequestClose}
					animation={PopoverAnimationVertical}
				>
					{children}
				</Popover>
			</div>
		);
	}
}

PopoverExampleAnimation.defaultProps = {
	label: 'Sizes'
};
