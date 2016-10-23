import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';

let debug = Debug('lodge:app:common:components:miniScoreboard'); 

		
export default class miniScoreboard extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'ScoreBoard Component'	
		this.state = { 
			game: props.game
		};
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.game.gid != this.state.game.gid) {
			debug('## componentWillReceiveProps ## menu update props:', props);
			this.setState(props);
			this._update = true;
		}
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate ## ', this._update);
			this._update = false;
			return true;
		}
		return false;
	}
	
	scoreboard() {
		let game = this.state.game;
		let styles = {
			table: {
				width: '100%'
			},
			tr: [
				{ height: 20 },
				{ height: 45 },
				{ height: 45 },
				{ height: 110 }
			],
			td: [
				{ width: 175, padding: 2 },
				{ width: 30, padding: 2 },
				{ padding: 5 },
			],
			record: {
				fontSize: '12px',
				padding: 5
			},
			time: {
				//fontSize: '12px',
				padding: '0px 5px 5px 5px',
				
			}
		}
		let totalLine = {
			e: {
				home: game.home_team_errors || 0,
				away: game.away_team_errors || 0,
			},
			h: {
				home: game.home_team_hits || 0,
				away: game.away_team_hits || 0,
			},
			r: {
				home: game.home_team_runs || 0,
				away: game.away_team_runs || 0,
			},
		}
		let status = game.time;
		if(game.inning) {
			if(game.status === 'Final') {
				status = `F/${game.inning}`;
			} else {
				status = game.inning;
			}
		}
		let totals = (<span>
			<td style={styles.td[1]}>
				<table style={styles.table}>
					<tr style={styles.tr[0]} >
						<td style={styles.td[2]}>R</td>
					</tr>
					<tr style={styles.tr[1]} >
						<td style={styles.td[2]}>{totalLine.r.away}</td>
					</tr>
					<tr style={styles.tr[2]} >
						<td style={styles.td[2]}>{totalLine.r.home}</td>
					</tr>
				</table>
			</td>
			<td style={styles.td[1]}>
				<table style={styles.table}>
					<tr style={styles.tr[0]} >
						<td style={styles.td[2]}>H</td>
					</tr>
					<tr style={styles.tr[1]} >
						<td style={styles.td[2]}>{totalLine.h.away}</td>
					</tr>
					<tr style={styles.tr[2]} >
						<td style={styles.td[2]}>{totalLine.h.home}</td>
					</tr>
				</table>
			</td>
			<td style={styles.td[1]}>
				<table style={styles.table}>
					<tr style={styles.tr[0]} >
						<td style={styles.td[2]}>E</td>
					</tr>
					<tr style={styles.tr[1]} >
						<td style={styles.td[2]}>{totalLine.e.away}</td>
					</tr>
					<tr style={styles.tr[2]} >
						<td  style={styles.td[2]}>{totalLine.e.home}</td>
					</tr>
				</table>
			</td>
		</span>);
		let table = (<table>
			<tbody>
			<tr>
				<td style={styles.td[0]}>
					<table style={styles.table}>
						<tbody>
						<tr style={styles.tr[0]} >
							<td colSpan="2" style={styles.record}>{this.props.game.venue}</td>
						</tr>
						<tr style={styles.tr[1]} >
							<td rowSpan="2" style={styles.time}>{status}</td>
							<td  className={`mlb-${this.props.game.away_file_code}`} style={styles.td[2]}>{this.props.game.away_name_abbrev} <span style={styles.record}>({this.props.game.away_win} - {this.props.game.away_loss})</span></td>
						</tr>
						<tr style={styles.tr[2]} >
							<td  className={`mlb-${this.props.game.home_file_code}`} style={styles.td[2]}>{this.props.game.home_name_abbrev} <span style={styles.record}>({this.props.game.home_win} - {this.props.game.home_loss})</span></td>
						</tr>
						</tbody>
					</table>
				</td>
				<td style={styles.td[1]}>
					<table style={styles.table}>
						<tbody>
						<tr style={styles.tr[0]} >
							<td></td>
						</tr>
						<tr style={styles.tr[1]} >
							<td></td>
						</tr>
						<tr style={styles.tr[2]} >
							<td></td>
						</tr>
						</tbody>
					</table>
				</td>
				{totals}
			</tr>
			</tbody>
		</table>)
		return table;
	}
	
	render() {
		debug('## RENDER ## scoreboard',  this.state, this.props);		
		let board = this.state.game.gameday_link ? this.scoreboard() : <span children="Loading scores..." />;
		return (<div style={{ padding: 0 }} >
			<div className="scoreboard">{board}</div>
		</div>);
	}
}

miniScoreboard.propTypes = {
	game: React.PropTypes.object
};

miniScoreboard.defaultProps = {
	game: {}
};
