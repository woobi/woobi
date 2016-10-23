import React from 'react';
import Debug from 'debug'
import { IconButton, IconMenu, FontIcon } from 'material-ui';
import { Styles } from '../styles';
import { ColorMe } from 'app/common/utils';
import { map } from 'lodash';

let debug = Debug('lodge:app:common:components:scoreboard'); 

		
export default class ScoreBoard extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'ScoreBoard Component'	
		this.state = { };
		
		//update bit
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		if(props.force || props.game != this.state.game) {
			debug('## componentWillReceiveProps ## menu update props:', props);
			this.setState(props);
			this._update = true;
		}
		if(props.children !== this.props.children) this._update = true;
	}
	
	shouldComponentUpdate() {
		if(this._update || this.props.force) {
			debug('## shouldComponentUpdate ## ', this._update);
			this._update = false;
			return true;
		}
		return true;
	}
	
	scoreboard() {
		
		let game = this.props.game;
		
		let styles = {
			table: {
				width: '100%'
			},
			tr: [
				{ height: 20 },
				{ height: 45 },
				{ height: 45 }
			],
			td: [
				{ width: 120, padding: 2 },
				{ width: 30, padding: 2 },
				{ padding: 5 },
			],
			record: {
				fontSize: '12px',
				padding: 5
			}
		}
		
		let line = <span />;
		
		if (this.props.game.innings) {
			line = map(this.props.game.innings, (i, k) => {
				
				return (<td key={i.inning + k + 'fred'} style={styles.td[1]}>
					<table style={styles.table}>
						<tbody>
						<tr style={styles.tr[0]} >
							<td style={styles.td[2]}>{k}</td>
						</tr>
						<tr style={styles.tr[1]} >
							<td style={styles.td[2]}>{i.away_runs_scored}</td>
						</tr>
						<tr style={styles.tr[2]} >
							<td style={styles.td[2]}>{i.home_runs_scored}</td>
						</tr>
						</tbody>
					</table>
				</td>);
			});
			
			
		} 
		let totalLine = {
			e: {
				home: game.home_team_errors,
				away: game.away_team_errors,
			},
			h: {
				home: game.home_team_hits,
				away: game.away_team_hits,
			},
			r: {
				home: game.home_team_runs,
				away: game.away_team_runs,
			},
		}
		
		let totals1 = (<td style={styles.td[1]}>
			<table style={styles.table}>
				<tbody>
				<tr style={styles.tr[0]} >
					<td style={styles.td[2]}>R</td>
				</tr>
				<tr style={styles.tr[1]} >
					<td style={styles.td[2]}>{totalLine.r.away}</td>
				</tr>
				<tr style={styles.tr[2]} >
					<td style={styles.td[2]}>{totalLine.r.home}</td>
				</tr>
				</tbody>
			</table>
		</td>);
		let totals2 = (	<td style={styles.td[1]}>
			<table style={styles.table}>
				<tbody>
				<tr style={styles.tr[0]} >
					<td style={styles.td[2]}>H</td>
				</tr>
				<tr style={styles.tr[1]} >
					<td style={styles.td[2]}>{totalLine.h.away}</td>
				</tr>
				<tr style={styles.tr[2]} >
					<td style={styles.td[2]}>{totalLine.h.home}</td>
				</tr>
				</tbody>
			</table>
		</td>);
		let totals3 = (	<td style={styles.td[1]}>
			<table style={styles.table}>
				<tbody>
					<tr style={styles.tr[0]} >
						<td style={styles.td[2]}>E</td>
					</tr>
					<tr style={styles.tr[1]} >
						<td style={styles.td[2]}>{totalLine.e.away}</td>
					</tr>
					<tr style={styles.tr[2]} >
						<td  style={styles.td[2]}>{totalLine.e.home}</td>
					</tr>
				</tbody>
			</table>
		</td>);
		
		let table = (<table><tbody>
			<tr>
				<td style={styles.td[0]}>
					<table style={styles.table}>
						<tbody>
							<tr style={styles.tr[0]} >
								<td style={styles.record}>{this.props.game.venue}</td>
							</tr>
							<tr style={styles.tr[1]} className={`mlb-${this.props.game.away_file_code}`} >
								<td style={styles.td[2]}>{this.props.game.away_name_abbrev} <span style={styles.record}>({this.props.game.away_win} - {this.props.game.away_loss})</span></td>
							</tr>
							<tr style={styles.tr[2]}  className={`mlb-${this.props.game.home_file_code}`} >
								<td style={styles.td[2]}>{this.props.game.home_name_abbrev} <span style={styles.record}>({this.props.game.home_win} - {this.props.game.home_loss})</span></td>
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
				{line}
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
				{totals1}
				{totals2}
				{totals3}
			</tr></tbody>
		</table>)
		
		return table;
	}
	
	render() {
		debug('## RENDER ## scoreboard',  this.state, this.props);
								
		return (<div className="scoreboard">{this.scoreboard()}</div>);
	}
}

ScoreBoard.propTypes = {
	game: React.PropTypes.object
};

ScoreBoard.defaultProps = {
	game: {
		innings: {}
	}
};
