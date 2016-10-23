import React from 'react';
import { Avatar, Card, CardActions, CardHeader, CardMedia, CardText, CardTitle, FlatButton, FontIcon, GridList, GridTile, IconButton } from 'material-ui';
import { Styles } from '../styles';
import { isObject, isFunction, defaultsDeep as deep } from 'lodash';
import TinyColor from 'tinycolor';
import { ColorMe as colorMe } from '../utils';
import Marked from 'marked';
import moment from 'moment';
import { Table } from './table';

import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:page');

export default class Pre extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Page Pre';		
		
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	render() {
		let preed
			try {
				preed = JSON.stringify(this.props.asset, null, 4);
			} catch(e) {
				preed = e
			}
		return (
			<pre>{preed}</pre>
		);
	}
}

Pre.defaultProps = {
	asset: {},
	theme: {}, 
	style: {},
	
};
Pre.childContextTypes = {
    muiTheme: React.PropTypes.object
};

const defstyles = {
	root: {
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
	},
	minibox: {
		padding: 3,
		//borderWidth: 1,
		fontSize: 10,
		//borderStyle: 'dotted',
		//fontWeight: 'bold',
		display: 'inline-block',
		margin: '3px 3px 3px 0',
		borderRadius: 3
	},
	specbox: {
		padding: 4,
		fontSize: 10,
		fontWeight: 400,
		display: 'inline-block',
		//margin: '3px 3px 3px 0',
		borderRadius: 3,
		textAlign: 'center',
		overflow: 'hidden',
		width: '100%',
		height: 22,
	},
	rowTop: {
		borderBottom: '1px solid', 
		fontSize: 13,
		margin: '0 5px  0 5px',
		textAlign: 'center'
	},
	rowBottom: {
		margin: '0 5px  0 5px',
		fontSize: 13,
		textAlign: 'center'
	},
	rowTopB: {
		borderBottom: '1px solid', 
		fontSize: 13,
		margin: '0 5px  0 5px',
		textAlign: 'center'
	},
	rowBottomB: {
		margin: '0 5px  0 5px',
		fontSize: 13,
		textAlign: 'center'
	},
	specHead: {
		borderBottom: '1px solid', 
		fontSize: 12,
		textAlign: 'left'
	}
};

/**
 * TILES
 * 
 * **/
export class Tiles extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Page Tiles';		
		
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	render() {
		let styles = deep({
			specHead: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).color,  
			},
			rowTop: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
			},
			rowTopB: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
			},
			specbox: {
				backgroundColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(25, this.props.theme.baseTheme.palette.canvasColor).color,
				fontSize: 12,
			},
			minibox: {
				backgroundColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(25, this.props.theme.baseTheme.palette.canvasColor).color,
			}
		}, deep( { ...this.props.styles }, { ...defstyles }));	
			
		const GridListExampleComplex = () => (
			<div style={styles.root} className="no-gutter" >
					{this.props.list.map((tile, k) => {
						const card = (tile) => {
							return (
								<Card style={{ padding: 3, boxSizing: 'border-box', marginBottom: 15 }} >
									<CardHeader
										title={tile.name}
										subtitle={tile.sub}
										actAsExpander={this.props.expands === null ? this.props.expands : tile.expands === null || tile.expands === false ? tile.expands : true}
										showExpandableButton={this.props.expands === null ? this.props.expands : tile.expands === false ? tile.expands : true}
										initiallyExpanded={this.props.expands === null ? this.props.expands : tile.expanded === false ? tile.expanded : true}
										expanded={tile.expanded === false || tile.expanded === null ? tile.expanded : true} 
									/>
									<CardText expandable={this.props.expands === null ? this.props.expands : tile.expands === false ? tile.expands : true} >
										<div className="" style={{ width: '90%', margin: '-20 auto 0' }}>
											{tile.tile}
										</div>
										<div style={{ marginBottom: 5}} className="clearfix" />
									</CardText>
								</Card>
							);
						}

						
						let devices = card({ name: 'Devices', sub: tile.romboxes.length + ' devices are matched with this Tool.', tile: tile.romboxes.map(d => (<div children={(<a
							href={"/noscript/devices/" + d.slug} 
							onClick={ e => {
								e.preventDefault();
								this.props.goTo({ 
									page: 'device', 
									path: '/devices/' + d.slug, 
									searchTerms: { 
										device: d.slug 
									} 
								}); 
							}} 
							children={d.name} 
						/>)} />) )});
						
						let desc = (<Card>
							<CardHeader
								title={tile.name}
								subtitle={moment(tile.publishedDate).format('LLLL')}
								actAsExpander={this.props.expands === null ? this.props.expands : true}
								showExpandableButton={this.props.expands === null ? this.props.expands : true}
							/>
							<CardText expandable={this.props.expands === null ? this.props.expands : true}>
								<div className="" style={{ width: '90%', margin: '-20 auto 0' }}>
									<div style={{ marginBottom: 5}} className="clearfix" />
									<a href={tile.url} onClick={e=>{e.preventDefault();goAwayLink(props, (<a href={tile.url} target="_blank" children={tile.url} style={{ fontSize: 14 }} />));}} target="_blank" children={tile.url} />
									<div style={{ marginBottom: 5}} className="clearfix" />
									{devices}
								</div>
								<div style={{ marginBottom: 5}} className="clearfix" />
							</CardText>
							
						</Card>);
						
						let Tstyle = {
							//height: 400, //this.props.desktop ? 400 : 200,
							//overflow: 'hidden',
							borderBottomWidth: 10,
							borderColor: this.props.theme.baseTheme.palette.accent1Color,
							borderStyle: 'solid',
							borderLeftWidth: k === 0 || k%2 !== 0 ? 0 : 5,
							borderRightWidth: k === 0 || k%2 === 0 ? 0 : 5,
							borderTopWidth: k === 0 ? 10 : 0,
						};
						
						if(this.props.containerStyle) {
							Tstyle = { ...this.props.containerStyle };
							Tstyle.borderTopWidth =  k === 0 ? 10 : 0;
						}
						
						return (
							<div 
								className={k === 0 || !this.props.desktop ? "col-xs-12" : 'col-xs-6'} 
								style={ Tstyle }
							>
								{desc}
							</div>
						)
					})}
			</div>
		);
		if(this.props.list.length === 0) {
			return <div style={{marginTop:20, textAlign:'center'}} >No Page(s) found</div>
		} else {
			return GridListExampleComplex();
		}
	}
}

Tiles.defaultProps = {
	asset: {},
	list: [],
	theme: {}, 
	style: {},
	
};
Tiles.childContextTypes = {
    muiTheme: React.PropTypes.object
};

/**
 * Compact
 * 
 * **/
export class Compact extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Page Compact';		
		debug('## Page compact');
	}
	
	componentWillReceiveProps(props) {
		debug('### Compact got props ###', props);
	}
	
	render() {
		debug('## render compact', this.props.theme.baseTheme.palette);
	
		return (
			<Tiles
				containerStyle={{
					border: 'none',
					marginBottom: 10,
					width: '100%',
					
					
				}}
				{ ...this.props }
			/>
		);
	}							
}

/**
 * Full
 * 
 * **/
export class Full extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Page Full';		
		debug('## RUN Full');
	}
	
	componentWillReceiveProps(props) {
		debug('### Full got props ###', props);
	}
	
	render() {
		debug('## render Full', this.props.theme.baseTheme.palette);
	
		return (
			<Tiles
				containerStyle={{
					border: 'none',
					borderBottomWidth: 10,
					width: '100%',
					borderColor: this.props.theme.baseTheme.palette.accent1Color,
					borderStyle: 'solid',
					borderLeftWidth: 0,
					borderRightWidth: 0,
					
				}}
				full={true}
				expands={null}
				{ ...this.props }
			/>
		);
	}							
}

/**
 * list
 * 
 * **/
export class List extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Page List';		
		debug('## RUN List');
	}
	
	componentWillReceiveProps(props) {
		debug('### List got props ###', props);
	}
	
	render() {
		debug('## render List', this.props);
		
		/*
		 * name
		 * version
		 * comments
		 * 
		*/
		let final = this.props.list.map((rom) => {
			let devices = rom.romboxes.map((box, k) => {
				return (<div style={{ float: 'left', padding: 5, borderLeft: k === 24 ? 'none' : '1px solid ' + colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor }}>
					{box.name}
				</div>);
			});
			return (<div id={rom.slug} style={{ margin: '0px 0 25px 0', padding: '5px 20px' }}  >
				<div style={{ fontSize: 12, paddingTop: 3 }}>{moment(rom.publishedDate).format('LL')} </div>
				<div style={{ padding: '5px 0', background: 'transparent' }} >
					{rom.name}
					<div style={{ marginBottom: 5}} className="clearfix" />
				</div>

				
				<div className="clearfix" style={{ padding: '0 5px', background: 'transparent', fontSize: 12, color1: this.props.theme.baseTheme.palette.alternateTextColor }} >
					<a href={rom.url} onClick={e=>{e.preventDefault();goAwayLink(this.props, (<a href={rom.url} target="_blank" children={rom.url} style={{ fontSize: 14 }} />));}} target="_blank" children={rom.url} />	
				</div>
				<div style={{ padding: '0 5px', fontSize: 12, color: colorMe(10, this.props.theme.baseTheme.palette.textColor).bgcolor }} className="clearfix" children={devices} />
			</div>);
		});
		
		if(this.props.list.length === 0 && this.props.noscript) {
			return <div />
		} else if(this.props.list.length === 0) {
			return <div style={{ marginTop: 0, marginBottom: 15, textAlign:'left', padding: '5px 20px' }} >No Pages found</div>
		} else {
			return (<div>{final}</div>);
		}
	}							
}

List.defaultProps = {
	assets: {},
	list: [],
	theme: {}, 
	style: {},
	
};
List.childContextTypes = {
    muiTheme: React.PropTypes.object
};

/** Table Class **/
export { Table } from './table';

export function Specs(specs, props) {
	return specs.map((spec) => (
		<div key={spec.slug} style={props.containerStyle} className={"col-xs-4 col-sm-2 " + props.containerClass}>
			<div style={props.indexed.indexOf(spec._id) > -1 ? props.specIndexedStyle : props.specboxStyle} className={props.specClass || ''}  children={spec.name || spec.title} onClick={e => props.onClick(spec._id)}  />
		</div>
	));
}

/** helper functions **/

function goAwayLink(props, link) {
	props.appState({
		dialog: {
			open: true,
			title: 'External Link',
			component: (<span><p>You have selected a link to an external site.  Click the link to continue...<br /></p><p>{link}<br /></p></span>),
			closeText: 'Cancel',
			answer: (success) => (success && alert('click the link'))
		}
	});
}
