import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Path from 'path';
import wrapListeners from './listen';
import Debug from 'debug';
import MainMenu from './common/components/mainMenu';
import Confirm from './common/components/confirm';
import Dialog from './common/components/dialog';
import Snackbar from './common/components/snackbar';
import Gab from './common/gab';
import routes from './routes';
import { AppBar, Card, CardText, Divider, FlatButton, FontIcon, IconButton, IconMenu, LeftNav, List, ListItem, MenuItem, RaisedButton, TextField } from 'material-ui';
import { Styles } from './common/styles';
import { defaultsDeep as deep, every as Every, isFunction } from 'lodash';

let debug = Debug('woobi:app:render');

let merge = Object.assign;

let styles = {
	'woobi': Styles.getMuiTheme(deep(Styles.WOOBI, snowUI.materialStyle.serverRendered)),
	'nitelite3': Styles.getMuiTheme(deep(Styles.NITELITE, snowUI.materialStyle.serverRendered)),
	'night': Styles.getMuiTheme(deep(Styles.NIGHT,  snowUI.materialStyle.serverRendered)),
	'light': Styles.getMuiTheme(deep(Styles.LIGHT,  snowUI.materialStyle.serverRendered)),
	'cream': Styles.getMuiTheme(deep(Styles.CREAM,  snowUI.materialStyle.serverRendered)),
	'alternate blue': Styles.getMuiTheme(deep(Styles.ALTERNATEBLUE,  snowUI.materialStyle.serverRendered)),
	'blue': Styles.getMuiTheme(deep(Styles.BLUE,  snowUI.materialStyle.serverRendered)),
	'dark': Styles.getMuiTheme(deep(Styles.DARK, snowUI.materialStyle.serverRendered)),
	'default': Styles.getMuiTheme(deep(Styles.DEFAULT, snowUI.materialStyle.serverRendered )),
	'graphite': Styles.getMuiTheme(deep(Styles.GRAPHITE,  snowUI.materialStyle.serverRendered)),
	'nitelite': Styles.getMuiTheme(deep(Styles.NITELITE, snowUI.materialStyle.serverRendered)),
	'nitelite2': Styles.getMuiTheme(deep(Styles.NITELITE2, snowUI.materialStyle.serverRendered)),
	'nitelite4': Styles.getMuiTheme(deep(Styles.ROMS, snowUI.materialStyle.serverRendered)),
}

let _DEFAULTS = function() {
	return {
		leftNav: false,
		newalert: {},
		newconfirm: {
			open: false
		},
		dialog: {
			open: false
		},
	}
}

class Render extends Component {
	constructor(props) {
		// we get props from Listener
		super(props);
		
		this.displayName = 'Render';
					
		var state = merge({
			theme: styles[snowUI.__userTheme] || styles[snowUI.defaultTheme] || styles.rommie,
			styles,
		}, _DEFAULTS());
				
		this.handleLeftNav = this.handleLeftNav.bind(this);
		snowUI.__toggleDrawer = this.handleLeftNav.bind(this);
		this.LeftNavClose = this.LeftNavClose.bind(this);
		this.goTo = this.goTo.bind(this);
		this.appState = this.appState.bind(this);
		this.answerConfirm = this.answerConfirm.bind(this);
		this.switchTheme = this.switchTheme.bind(this);
		this.searchToggle = this.searchToggle.bind(this);
		this.isConnectedIcon = this.isConnectedIcon.bind(this);
		this.confirmBox = this.confirmBox.bind(this);
		this.snackbar = this.snackbar.bind(this);
		this.answerDialog = this.answerDialog.bind(this);
		this.dismissDialog = this.dismissDialog.bind(this);
		this.appBar = this.appBar.bind(this);
		this.appBarRightIcons = this.appBarRightIcons.bind(this);
		
		this.state = merge({ ...props }, state);
		
		debug('## switching to state.currentTheme ##');
		let themer = this.switchTheme(snowUI.__userTheme || snowUI.defaultTheme, false, null, snowUI.__userTheme ? true : false );
		debug('## switched to state.currentTheme ##', themer);
							
		this.state = merge(this.state, themer);
		
		snowUI.__state = this.state;
		snowUI.__appForceUpdate = this.forceUpdate.bind(this);
		
		debug('## FRESH STATE ##', this.state);
		
		this._update = !this.state.firstrun;
						
		debug('Started LOADing Render');
	}
	
	getChildContext() {
		return {
			muiTheme: this.state.theme,
		};
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		var update = this._update ? true : false;
		debug('## shouldComponentUpdate ## before', update, nextProps.firstrun, this._update);
		this._update = !nextProps.firstrun;
		debug('## shouldComponentUpdate ## after', update, nextProps.firstrun, this._update);
		return true;//update;
	}
	
	componentDidMount() {
		debug('LOADED RENDER');
	}
	
	componentWillReceiveProps(props) {
		var p = { ...props };
		debug('## render received props ##', p);
		this.setState(p, () => { snowUI.__state = { ...this.state } });	
	}
	
	componentWillUnmount() {
		//Gab.removeListener('Render', this.onData);
	}
	
	switchTheme(theme = 'rommie', update = true, callback, userSelect = false) {
		let style = this.state.styles[theme];
		if(!style) {
			style = this.state.styles.rommie;
		} 
		if( theme == 'dark' ) {
			snowUI.setTheme('dark-theme');
			snowUI.shortenTitle = false;
		} else if( theme == 'graphite' ) {
			snowUI.setTheme('dark-theme graphite');
			snowUI.shortenTitle = true;
		} else if( theme == 'default' ) {
			snowUI.setTheme('');
			snowUI.shortenTitle = false;
		} else if( theme == 'cream'  ) {
			snowUI.setTheme('light-theme');
			snowUI.shortenTitle = true;
		} else if( theme == 'light'  || theme == 'reset' ) {
			snowUI.setTheme('light-theme theme-light ');
			style = this.state.styles.light;
			snowUI.shortenTitle = true;
		} else if( theme == 'nitelite' || theme == 'nitelite2' ) {
			snowUI.setTheme('dark-theme default');
			snowUI.shortenTitle = false;
		} else if( theme == 'nitelite3' || theme == 'nitelite4' ) {
			snowUI.setTheme('nitelite');
			snowUI.shortenTitle = false;
		} else if( theme == 'alternate blue' ) {
			snowUI.setTheme('light-theme bluealt');
			snowUI.shortenTitle = false;
		} else if( theme == 'blue' ) {
			snowUI.setTheme('light-theme blue');
			snowUI.shortenTitle = false; 
		} else if( theme == 'woobi' ) {
			snowUI.setTheme('night default');
			snowUI.shortenTitle = false; 
		} else {
			/** theme == 'night' || reset **/
			snowUI.setTheme('dark-theme default');
			snowUI.shortenTitle = false;
		}
		
		debug('## switchTheme ##');
		if (!snowUI.serverRendered) {
			document.body.style.background = null;
		}
		snowUI.__lastTheme = { ...snowUI }.__currentTheme;
		snowUI.__currentTheme = theme != 'reset' ? theme : snowUI.defaultTheme;
		let appstate = {
			theme: style,
			currentTheme: theme,
			forceUpdate: true,
			firstrun: false
		};
		if(userSelect) {
			appstate.__userTheme = theme != 'reset' ? theme : false;
			snowUI.__userTheme = theme != 'reset' ? theme : false;
		}
		if(update !== false) {
			this.appState(appstate, function() {
				debug('#### SWITCHED THEME ####', theme);
				if(typeof callback === 'function') {
					callback();
				}
			});
		}
		return appstate;
	}
	
	handleLeftNav(e , stated) {
		if(e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}
		debug('handleLeftNav', this.state);
		let state = stated ? stated : !this.state.leftNav;
		this.appState({leftNav: !this.state.leftNav});
	} 
	
	LeftNavClose () {
		this.appState({ leftNav: false });
	}
	
	searchToggle(e) { 
		let target = $(e.target).parent().prev();
		target.toggleClass('open');
		debug('searchToggle', target);
		let $input = target.find('input');
		$input.val('');
		$input.focus();
		$input.keypress((event) => {
			// keyboard Enter event
			if ( event.which == 13 ) {
				event.preventDefault();
				let state = {
					page: 'search::' + $input.val(),
					search:  $input.val()
				}
				
				this.appState(Object.assign({ ...this._defaults }, state), () => {
					this.state.history.push({
						pathname: 'search::',
						search: $input.val(),
					})
				});
			}
			
		});
	}
	
	goTo(route, state, callback, noFade = false, fadeMe) {
		
		if(typeof route === 'string') {
			// accept strings for the page
			route = {
				page: route,
			}
		}
		
		debug('goTo route', route)
		
		let run = () => {
			var send = Object.assign({ 
				mode: 'cors',
				leftNav: false,
				currentTheme: this.state.currentTheme,
			}, route);
			
			if(!send.path && send.page) {
				send.path = '/' + send.page;
			}
			if(send.slug) {
				send.path += '/' + send.slug;
			}
			
			if(!send.path) {
				send.path = '/500';
				send.error = 'Invalid page configuration';
				send.page = '500';
				send.FontIcon = {
					icon: 'help',
					Color: 'blue',
					HoverColor: 'cyan',
				};
				send.message = 'Bad Request';
			}
			
			debug('sendto', send);
			this.props.router.push({
				pathname: send.path,
				query: send.query,
				state: send
			});
			if(state) {
				this.setState(state);
			}
			if(isFunction(callback)) {
				callback();
			}
		}
		
		if(noFade) {
			run();
		} else if(fadeMe) {
			snowUI.fadeOut('slow', fadeMe, () => {
				run();
			});
		} else {
			// fade the content div before its replaced
			snowUI.fadeOut('slow', () => {
				run();
			});
		}
		
	}
	
	appState(newState, callback) {
		this.props.appState(newState, callback);
	}
	
	isConnectedIcon() {
		let isConnectedIcon = ( this.state.connected === true || !snowUI.usesockets )
			? 
				<IconButton onClick={(e)=>{e.preventDefault();this.goTo('status');}} ><FontIcon className="material-icons" hoverColor={Styles.Colors.lime500} style={{fontSize:'20px'}}  color={this.state.theme.appBar.buttonColor || 'initial'} >router</FontIcon></IconButton>
			:
				(this.props.sockets.connected.firstRun) 
				?
					<span><IconButton onClick={(e)=>{e.preventDefault();this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px'}} color={Styles.Colors.lime500}  title="Connecting to server for the first time">router</FontIcon></IconButton></span>
				:
					<span><IconButton onClick={(e)=>{e.preventDefault();this.goTo('status');}} ><FontIcon className="material-icons" style={{fontSize:'20px', backgroundColor: Styles.Colors.red900}} color={Styles.Colors.red900}  title="Connection to server lost">cloud_offline</FontIcon></IconButton></span>
		return isConnectedIcon;
		
	}
	
	appBarRightIcons() {
		return (<div className="col-sm-12">
			<div style={{padding: '6px 0px 0', textAlign: 'right'}} >
				<FlatButton onClick={this.handleLeftNav} label="menu" />
			</div >
		</div>			
		);
	} 
	
	appBar() {
		
		let title = this.state.page; //this.props.noscript ? snowUI.name + ' noScript' : snowUI.name; //;
		let hamburger =(<IconButton title="Menu" style={{ textAlign: 'left', marginLeft: 10, padding: 0, width: 40, height: 40  }} onClick={this.handleLeftNav} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.state.theme.appBar.textColor || 'initial'} >menu</FontIcon></IconButton>);
		return (<div id="appbar"> 
			<div style={{zIndex:1000, width: '100%', height: '64px'  }} >
				<AppBar
					zDepth={3}
					title={<div id="appbarTitle" style={{height:65,width:'100%'}} >{title}</div>}
					style={{boxShadow: 'none'}}
					iconElementLeft={<span>{hamburger}</span>}
				/>
			</div>
			<div />
		</div>);
	}
	
	menu() {
		return (
			<MainMenu  { ...this.state } docked={false} drawer={true} secondary={false} searchToggle={this.searchToggle}  goTo={this.goTo} handleLeftNav={this.LeftNavClose} switchTheme={this.switchTheme}/>
		);
	}
	
	contents() {
		return (<div>
			<div className="clearfix" />
			<div className="react-hot-reload-container" >
				<div style={{paddingRight:0, paddingLeft:0}} className="no-gutter" >
					<div id="content-fader-old">
						{this.props.children && React.cloneElement(this.props.children, Object.assign({ handleLeftNav: this.handleLeftNav, goTo: this.goTo, switchTheme: this.switchTheme, ...this.state }, this.props.children.props))}
						<div className="clearfix" />
					</div>
				</div>
			</div>
			<div className="clearfix" />
			<div className="simpledocs-footer" id="simpledocs-footer"  />
		</div>);	
	}
	
	render() {
		debug('## RENDER STATE ##', this.state);
        
		return (<div>
			{this.appBar()}	
			{this.menu()}	
			{this.contents()}
			
			{this.dialogBox() }
			{this.snackbar() }
			{this.confirmBox() }
        </div>);

	}
	
	snackbar() {
		
			return (<Snackbar 
					style={this.state.newalert.style}
					setParentState={this.props.appState}
					html={this.state.newalert.html}
					data={this.state.newalert.data}
					component={this.state.newalert.component}
					open={this.state.newalert.show}
					autoHideDuration={this.state.newalert.duration >= 0 ? this.state.newalert.duration : 5000}
					onRequestClose={() => {this.setState({ newalert: { show: false }});}}
			/>);
		
	}
	
	dialogBox() {
		return (<div>
			<Dialog 
				component={this.state.dialog.component}
				html={this.state.dialog.html}
				title={this.state.dialog.title}
				answer={this.answerDialog}
				open={this.state.dialog.open}
				closeText={this.state.dialog.closeText}
				theme={this.state.theme}
			/>
			<Dialog 
				name="2"
				open={false}
			/>
			<Dialog 
				name="3"
				open={false}
			/>
			<Dialog 
				name="4"
				open={false}
			/>
		</div>);
	}
	
	dismissDialog() {
		this.appState({ 
			newconfirm: {
				show: false
			}
		});
	}
	
	answerDialog(success) {
		if(success) {
			if(typeof this.state.dialog.answer === 'function') {
				this.state.dialog.answer();
			} else if(typeof this[this.state.answerMethod] === 'function') {
				this[this.state.answerMethod]();
			}
		}
		this.appState({
			dialog: {
				open: false,
			},
		});
	}
	
	confirmBox() {
		return (
			<Confirm 
				component={this.state.newconfirm.component}
				html={this.state.newconfirm.html}
				title={this.state.newconfirm.title}
				answer={this.answerConfirm}
				open={this.state.newconfirm.open}
				yesText={this.state.newconfirm.yesText}
				noText={this.state.newconfirm.noText}
				theme={this.state.theme}
			/>
		);
	}
	
	dismissConfirm() {
		this.appState({ 
			newconfirm: {
				show: false
			}
		});
	}
	
	answerConfirm(success) {
		if(success) {
			if(typeof this.state.newconfirm.answer === 'function') {
				this.state.newconfirm.answer(this.state.answerConfirm);
			} else if(typeof this[this.state.answerMethod] === 'function') {
				this[this.state.answerMethod](this.state.answerConfirm);
			}
		}
		this.appState({
			newconfirm: {
				open: false,
			},
			answerConfirm: false
		});
		
	}
}



Render.childContextTypes = {
    muiTheme: React.PropTypes.object
};

export let myComponent =  wrapListeners(Render);

export default myComponent;
