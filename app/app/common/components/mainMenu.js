import React from 'react';
import Debug from 'debug'
import { Divider, Drawer, IconButton, IconMenu, FontIcon, MenuItem } from 'material-ui';
import { Styles } from '../styles';
import ArrowDropRight from 'material-ui/svg-icons/navigation-arrow-drop-right';

let debug = Debug('woobi:app:common:components:mainMenu'); 

		
export default class mainMenu extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'mainMenu Component'	
		this.state = {
			page: props.page,
			leftNav: props.leftNav
		};
		this._update = true;
	}
	
	componentWillReceiveProps(props) {
		debug("## componentWillReceiveProps ## mainMenu WillReceiveProps", props.leftNav !== this.state.leftNav, props.update, this.state.page !== props.page);
		if(props.leftNav !== this.state.leftNav || props.update || this.state.page !== props.page) {
			this._update = true;
			this.setState({
				page: props.page,
				leftNav: props.leftNav
			});
			return;
		}
		
	}
	
	shouldComponentUpdate(nextProps) {
		debug('## shouldComponentUpdate ## mainMenu should update? ', this._update);
		if(this._update  || this.props.currentTheme !== nextProps.currentTheme) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	toggleDrawer() {
		
	}
	
	render() {
		debug('## RENDER ## mainMenu render', this.props);
		
		let page = this.props.anchor || this.props.page;
		
		let menuItems = []; 

        let LeftDrawer = (
			<Drawer 
				zDepth={5}
				docked={false}
				open={this.state.leftNav}
				style={{ zIndex: 1200 }}
				containerStyle={{ zIndex: 1200 }}
				openSecondary={false}
				width={225}
				onRequestChange={open => {
					debug('## RENDER ## mainMenu request change', open, this.props);
					this._update = true;
					this.props.appState({ leftNav: open });
				}}
			>
				<div className="" style={{
					height: 50,
					width: '100%',
					overflow: 'hidden',
					bottom: 0,
					left: 0,
					position: 'absolute',
					borderLeft: '10px solid ' + this.props.theme.baseTheme.palette.canvasColor
				}} >
					
					<div style={{float:'left',width:'33%', textAlign: 'center'}}>
						<IconButton 
							title="Home"
							onClick={(e)=>{
								e.preventDefault();
								this.props.goTo({page: snowUI.name, path: snowUI.homepage});
							}} 
						>
							<FontIcon 
								className="material-icons" 
								hoverColor={Styles.Colors.limeA400} 
								color={this.props.theme.appBar.buttonColor || 'initial'} 
							> 
								home
							</FontIcon>
						</IconButton>
					</div>
					<div style={{float:'left',width:'33%', textAlign: 'center'}}>
						<IconButton title="Status" onClick={(e)=>{e.preventDefault();this.props.goTo('status');}} ><FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} style={{fontSize:'20px'}}  color={this.props.theme.appBar.buttonColor || 'initial'} >router</FontIcon></IconButton>
					</div>
					<div style={{float:'left',width:'34%', textAlign: 'center', paddingTop: 12}}>
						<IconMenu
							title="Change Theme"
							iconButtonElement={<FontIcon className="material-icons" hoverColor={Styles.Colors.limeA400} color={this.props.theme.appBar.buttonColor || 'initial'} style={{cursor:'pointer'}}>invert_colors</FontIcon>}
							onItemTouchTap={(e, val) => {
								debug('clecked switch theme link', e, val);
								this.props.switchTheme(val.props.value, true, false, true); // this.props.handleLeftNav,
							}}
							useLayerForClickAway={true}
							menuStyle={{}}
						>
						  <MenuItem style={{lineHeight: 2}} primaryText="Default" value="reset" />
						  <MenuItem style={{lineHeight: 2}} primaryText="Light" value="light" />
						  <MenuItem style={{lineHeight: 2}} primaryText="Woobi" value="woobi"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Blue" value="nitelite3"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Night" value="night"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Graphite" value="graphite"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Nitelite" value="nitelite"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Orange" value="nitelite2"/>
						   <MenuItem style={{lineHeight: 2}} primaryText="Other" value="nitelite4"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Weird" value="blue"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Alternate" value="alternate blue"/>
						  <MenuItem style={{lineHeight: 2}} primaryText="Cream" value="cream" />
						  <MenuItem style={{lineHeight: 2}} primaryText="MUI Dark" value="dark" />
						  <MenuItem style={{lineHeight: 2}} primaryText="MUI Light" value="default" />
						</IconMenu>
					</div>
				</div>
				<div className="menu" style={{
					height: this.props.window.height - 50,
					width: '100%',
					overflow: 'hidden',
					marginTop: 0,
					borderLeft: '10px solid ' + this.props.theme.baseTheme.palette.canvasColor
				}} >
						<br />
						
						
					<div className="clearfix" style={{ height: 10 }} />
						<MenuItem
							primaryText="Channels"
							leftIcon={<FontIcon className="material-icons">line_style</FontIcon>} 
							onClick={(e) => {
								e.preventDefault(e);
								this.props.goTo({
									page: 'Stations',
									path: '/stations',
								}, {}, () => { this.toggleDrawer(false, false) });
							}}
						/>
						<Divider />	
						
								<MenuItem 
								primaryText="All Shows" 
								leftIcon={<FontIcon className="material-icons">tv</FontIcon>} 
								onClick={(e) => {
									e.preventDefault(e);
									this.props.goTo({
										page: 'TV Shows',
										path: '/library/tv',
									}, {}, () => { this.toggleDrawer(false, false) });
								}}
								style={{}}
								href="/noscript/library/tv"
							/>
							<MenuItem 
								primaryText="Recent Shows" 
								leftIcon={<FontIcon className="material-icons">queue_play_next</FontIcon>} 
								onClick={(e) => {
									e.preventDefault(e);
									this.props.goTo({
										page: 'Recent TV',
										path: '/library/tv/recent',
									}, {}, () => { this.toggleDrawer(false, false) });
								}}
								style={{}}
								href="/noscript/library/tv/recent"
							/>
							<Divider />				
							<MenuItem 
								primaryText="All Movies" 
								leftIcon={<FontIcon className="material-icons">local_movies</FontIcon>} 
								onClick={(e) => {
									e.preventDefault(e);
									this.props.goTo({
										page: 'Movies',
										path: '/library/movies',
									}, {}, () => { this.toggleDrawer(false, false) });
								}}
								style={{}}
								href="/noscript/library/movies"
							/>
							<MenuItem 
								primaryText="Recent Movies" 
								leftIcon={<FontIcon className="material-icons">slow_motion_video</FontIcon>} 
								onClick={(e) => {
									e.preventDefault(e);
									this.props.goTo({
										page: 'Recent Movies',
										path: '/library/movies/recent',
									}, {}, () => { this.toggleDrawer(false, false) });
								}}
								style={{}}
								href="/noscript/library/movies/recent"
							/>			
						
					
					<Divider />
					
							
				</div>
			</Drawer>
		);
		
		if(this.props.drawer) {
			return (LeftDrawer);
		} else {
			return (<div></div>);
		} 	
	}
}

mainMenu.defaultProps = {

}

/*
				<MenuItem
						primaryText="TV Shows"
						rightIcon={<ArrowDropRight />}
						leftIcon={<FontIcon className="material-icons">tv</FontIcon>} 
						menuItems={[
							
						]}
					/>
					<MenuItem
						primaryText="Movies"
						rightIcon={<ArrowDropRight />}
						leftIcon={<FontIcon className="material-icons">movie</FontIcon>} 
						menuItems={[
						]}
					/>
				
					<MenuItem
						primaryText="Live TV"
						rightIcon={<ArrowDropRight />}
						leftIcon={<FontIcon className="material-icons">live_tv</FontIcon>} 
						menuItems={[
							,
						]}
					
					/>
					* 
					<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="Guide"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/guide', page: 'Program Guide'});
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									view_list
								</FontIcon>
							</IconButton>
						</div>
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="TV Channels"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/channels', page: 'Live TV'});
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									featured_videos
								</FontIcon>
							</IconButton>
						</div>
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="Recordings"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/recordings', page: 'Recordings'}, this.leftNavClose);
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									play_circle_filled
								</FontIcon>
							</IconButton>
						</div>	
						<div style={{float:'left',width:'25%', textAlign: 'center'}}>
							<IconButton 
								title="Timers"
								onClick={(e)=>{
									e.preventDefault();
									this.props.goTo({path: '/tv/timers', page: 'Timers'}, this.leftNavClose);
								}} 
							>
								<FontIcon 
									className="material-icons" 
									hoverColor={Styles.Colors.limeA400} 
									color={this.props.theme.appBar.buttonColor || 'initial'} 
								> 
									fiber_dvr
								</FontIcon>
							</IconButton>
						</div>	
					*/
