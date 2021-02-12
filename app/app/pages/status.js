import React from 'react';
import Debug from 'debug';
import Gab from '../common/gab';
import { Styles } from '../common/styles';
import { GridList, GridTile, Divider, FontIcon, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui';

let debug = Debug('woobi:app:pages:status');
		
export default class Status extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'Status Component'	
		this.state = {
			status: '<span></span>'
		}
		this._update = false
		this.onData = this.onData.bind(this)
	}
	
	componentWillReceiveProps(props) {
		debug('receiveProps');
		this._update = true;
	}
	componentDidUpdate() {
		snowUI.fadeIn();
		debug('didUpdate');
	}
	
	onData(data) {
		debug('### STATUS ###', data);
		this.setState({
			status: data.html
		});
	}
	
	componentDidMount() {
		debug('did mount');
		snowUI.fadeIn();
		this.props.Sockets.io.on('status', this.onData);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('status', this.onData);
	}
	render() {
		debug('status render', this.state, this.props);
		let statusCheck = <div dangerouslySetInnerHTML={{ __html: this.state.status }} />
		let status;
		if(this.props.Sockets.connected.open || !snowUI.usesockets) {
			let msg = !snowUI.usesockets ? '' : "The server is online and accepting page requests.";
			status =  (
				<CardHeader 
					title={"Welcome to the lodge.  Enjoy your time with us!"}
					subtitle={msg}
					avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={Styles.Colors.lightBlue700} hoverColor={Styles.Colors.lightBlue500} >speaker_phone</FontIcon>}

				/>
			);
		} else if(this.props.Sockets && this.props.Sockets.connected.firstRun) {
			status = (
				<CardHeader 
					title={"Client trying to initate connection"}
					subtitle={"The client is currently setting up communication with the agent."}
					avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={Styles.Colors.orangeA700} hoverColor={Styles.Colors.orangeA400} >speaker_phone</FontIcon>}

				/>
			);
		} else {
			status = (
				<CardHeader 
					title={"Server Connection Issues"}
					subtitle={"The agent is currently not responding to socket requests"}
					avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={Styles.Colors.red600} hoverColor={Styles.Colors.amber500} >cloud_off</FontIcon>}
					titleColor={Styles.Colors.red600}
					
				/>
			);
		}
		let ghpages = <span />;
		
		return (<div className="col-xs-12" style={{paddingRight:0, paddingLeft:0}}  >
			<Card style={{paddingRight:0, paddingLeft:0}} >
				{status}				
				
				<Card>
					<CardHeader 
						title={"Theme"}
						subtitle={"switch between the available themes"}
						avatar={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >invert_colors</FontIcon>}

						actAsExpander={true}
						showExpandableButton={true}
					/>
				
					<CardText expandable={true}>
						<GridList
							cellHeight={100}
							style={{width:'100%'}}
							cols={5}
							padding={0}
							
						>
							<GridTile 
								key="Materiallreste"
								title={"Light"}
								onClick={e => this.props.switchTheme('reset')}
								style={{backgroundColor: 'white', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateraialDarkTheme"
								title={"Woobi"}
								onClick={e => this.props.switchTheme('woobi')}
								style={{backgroundColor: '#223E77', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateriaglDLfdasightTheme"
								title={"Night"}
								onClick={e => this.props.switchTheme('night')}
								style={{backgroundColor: '#303234', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateraihalDLissghtTheme"
								title={"Blue"}
								onClick={e => this.props.switchTheme('nitelite3')}
								style={{backgroundColor: '#283593', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateriawlDsarknn2Theme"
								title={"Orange"}
								onClick={e => this.props.switchTheme('nitelite2')}
								style={{backgroundColor: '#F57C00', cursor: 'pointer'}}
							/>
							
							<GridTile 
								key="MateriarlTheme"
								title={"Graphite"}
								onClick={e => this.props.switchTheme('graphite')}
								style={{backgroundColor: '#303030', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MaterialDarknn2Theme"
								title={"Other"}
								onClick={e => this.props.switchTheme('nitelite4')}
								style={{backgroundColor: '#2E41D0', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateritalDarknndTheme"
								title={"Nitelite"}
								onClick={e => this.props.switchTheme('nitelite')}
								style={{backgroundColor: 'rgb(40, 53, 147)', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MaterialDLightTheme"
								title={"Alternate"}
								onClick={e => this.props.switchTheme('alternate blue')}
								style={{backgroundColor: '#0C87C1', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MaterialeDLigffhtTheme"
								title={"Weird"}
								onClick={e => this.props.switchTheme('blue')}
								style={{backgroundColor: Styles.Colors.indigo800, cursor: 'pointer'}}
							/>
							<GridTile 
								key="MaterialL7ighytTheme"
								title={"Cream"}
								onClick={e => this.props.switchTheme('cream')}
								style={{backgroundColor: '#FFFCEF', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateriallDDharkTheme"
								title={"MUI Dark"}
								onClick={e => this.props.switchTheme('dark')}
								style={{backgroundColor: '#0097A7', cursor: 'pointer'}}
							/>
							<GridTile 
								key="MateriasllDdefTheme"
								title={"MUI Light"}
								onClick={e => this.props.switchTheme('default')}
								style={{backgroundColor: '#fff', cursor: 'pointer'}}
							/>
						</GridList>
			
					</CardText >
				</Card>
				<Card>
					<CardHeader 
						title={"Status"}
						subtitle={"woobi app state"}
						avatar={<FontIcon style={{}} className="material-icons" color={Styles.Colors.blueGrey600} hoverColor={Styles.Colors.blueGrey600} >info_outline</FontIcon>}

						actAsExpander={false}
						showExpandableButton={false}
					/>
					<CardText >
						<div className="clearfix" style={{marginLeft:40}}>{statusCheck}</div>		
						<div className="clearfix" />				
					</CardText>
				</Card>
			</Card>
		</div>);	
	}
}

