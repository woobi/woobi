import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import GameDay from 'app/lib/gameday/index';
import { ColorMe } from 'app/common/utils';
import Modal from 'app/common/components/dialog';

let debug = Debug('lodge:app:common:components:lineups'); 
	
export default class Lineups extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Lineups Component'	
		this.state = { 
			id: props.id,
			lineups: {},
		};
		if (props.id) {
			this._getlineup = true;
		}
		this.getLineups = this.getLineups.bind(this);	
		this.iconButton = this.iconButton.bind(this);
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.id != this.state.id) {
			debug('## componentWillReceiveProps ## Plays props:', props);
			this.getLineups(props);
			this._update = true;
			this.setState({
				id: props.id,
				lineups: {}
			});
		}
	}
	
	componentDidMount() {
		if (this._getlineup == true) {
			this.getLineups(this.state);
			this._getlineup = false;
		}
	}
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate Plays ## ', this._update);
			this._update = false;
			return true;
		}
		return false;
	}
	
	getLineups(props) {
		GameDay.lineups(props.id)
			.then(data => {
				// Array of objects with data related to a single game
				debug('#### Lineups Data', data);
				this._update = true;
				this.setState({ lineups: data, loading: false });
				return data;
			})
			.catch(error => console.log('ERROR from lineups', error));
	}
	
	lineups() {
		let modall = <span />;
		if(this.state.modal) {
			modall = this.modal((<div className="clearfix">
				{this.state.modal}
			</div>), 'Lineups');
		} 
		if(!this.state.lineups.lineups) {
			return <span />;
		} else {
			let l = this.state.lineups.lineups;
			let h = l[0];
			let a = l[1];
			debug('## Lineups ##', l, h, a);			
			return (<div className="lineups">
				<table style={{ width: '100%'}}>
					<thead>
						<tr>
							<th className={`mlb-${h.team_file_code}`} >{h.team_name_full}</th>
							<th className={`mlb-${a.team_file_code}`} >{a.team_name_full}</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<table style={{ width: '100%' }} >
									<tbody>
									{!h.players ? <tr /> : h.players.map((p,i) => {
										return (<tr key={i}>
											<td>{i+1}</td>
											<td>{p.first_name + ' ' + p.last_name}</td>
											<td>{p.position}</td>
											<td>{p.bats}</td>
										</tr>);
									})}
									</tbody>
								</table>
							</td>
							<td>
								<table style={{ width: '100%' }} >
									<tbody>
									{!a.players ? <tr /> : a.players.map((p,i) => {
										return (<tr key={i}>
											<td>{i+1}</td>
											<td>{p.first_name + ' ' + p.last_name}</td>
											<td>{p.position}</td>
											<td>{p.bats}</td>
										</tr>);
									})}
									</tbody>
								</table>
							</td>
						</tr>
					</tbody>
				</table>
				{modall}
				
			</div>);
		}		
	}
	
	modal(component, title = "Lineups") {
		return (
			<Modal
				title={title}
				open={true}
				size="small" 
				autoScrollBodyContent={true}
				component={component} 
				answer={() =>  { this._update = true; this.setState({ modal: false }) }} 
				bodyStyle={{ overflow: 'auto' }}
			/>
		);
	}
	
	pre(data, text = 'Lineup Data', icon = 'chrome_reader_mode') {
		let style = {
			iconStyle: {},
			buttonStyle: {
				borderRadius: 2,
				border: '1px solid #505050',
				borderColor: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				background: ColorMe(5, snowUI.__state.theme.baseTheme.palette.canvasColor).bgcolor,
				padding: 5,
				cursor: 'hand',
				textDecoration: 'none',
				color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
			},
			hoverColor: Styles.Colors.limeA700,
			color: ColorMe(10, snowUI.__state.theme.baseTheme.palette.canvasColor).color,
		}
		return this.iconButton(icon, text, style, e => {
			e.preventDefault();
			this._update = true;
			this.setState({ 
				modal: (<pre> 
					{JSON.stringify(data, null, 4)} 
				</pre>) 
			});
		});

	}
	
	iconButton(icon, title, style, onClick ) {
		let props = {};
		if(onClick) {
			props.onClick = onClick;
		}
		return (<IconButton 
				title={title}
				style={style.buttonStyle} 
				{ ...props }
			> 
				<FontIcon className="material-icons" hoverColor={style.hoverColor} style={style.iconStyle}  color={style.color} >{icon}</FontIcon>
		</IconButton>);
	}
	
	
	render() {
		debug('## RENDER ## Lineups',  this.state, this.props);
		return this.lineups();
	}
}

Lineups.propTypes = {
	id: React.PropTypes.string
};

Lineups.defaultProps = {
	id: '',
};
