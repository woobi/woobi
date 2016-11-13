import React from 'react';
import Debug from 'debug'
import Gab from '../common/gab'
import { Divider, FontIcon, CardText, Card, CardActions, CardHeader, CardMedia, CardTitle } from 'material-ui';
import { Styles } from '../common/styles';

let debug = Debug('woobi:app:pages:disconnect');
		
export default class Disconnect extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = '#CODE  Component'	
		this.state = {
			
		}
		this._update = false
	}
	
	componentWillReceiveProps(props) {
		debug('#CODE receiveProps');
		this._update = true;
	}
	componentDidUpdate() {
		snowUI.fadeIn();
		debug('#CODE didUpdate');
	}
	componentDidMount() {
		debug('#CODE did mount');
		snowUI.fadeIn();
	}
	render() {
		
		let _FontIcon = {	
			Color: Styles.Colors.red600,
			HoverColor: Styles.Colors.amber500,
			fontSize: '128px',
			className: "material-icons",
			icon: 'error'
		};
		let _def = {
			FontIcon: {},
			error: false,
			message: "404 Not Found",
			back: true,
			subtitle: 'Navigation Status Update',
			backMessage: (<p><a href="#" onClick={(e)=>{e.preventDefault();window.history.back();}}>Previous Page</a></p>),
			titleColor: Styles.Colors.red600,
			subtitleColor: Styles.Colors.grey500,
			
		}
		
		let settings = Object.assign( { ..._def }, { ...this.props.location.state });
		settings.FontIcon = Object.assign({ ..._FontIcon }, { ...settings.FontIcon });
		
		let message = [];
		if(settings.error) {
			message.push(<p><h2 style={{color:'red'}}>{settings.error}</h2></p>);
		}
		if(settings.message) {
			message.push(<p><h2 style={{color:'blue'}}>{settings.message}</h2></p>);
		} else {
			message.push(<p>The page you requested is not valid.</p>);
		}
		
		debug('#CODE render', this.props, settings, message);
		return (<div className="col-xs-12" >
			<Card>
				<CardTitle 
					// title={this.props.page}
					subtitle={settings.subtitle}
					titleColor={settings.titleColor}
					subtitleColor={settings.subtitleColor}
				/>
				<CardText style={{padding:0, height:300, textAlign:'center', paddingTop:20}} >
					<div className="" style={{color:Styles.Colors.grey600, fontSize:'76px', padding:0, height:100, paddingTop:0, paddingBottom:30}}>
						<FontIcon style={{fontSize: settings.FontIcon.fontSize}} className={settings.FontIcon.className} color={settings.FontIcon.Color} hoverColor={settings.FontIcon.HoverColor} >{settings.FontIcon.icon}</FontIcon>
					</div>
					<div style={{marginBottom:30}} />
					{message}
					<br />
					{settings.back ? settings.backMessage : <span />}
				</CardText>
			</Card>
		</div>);
	}
}

