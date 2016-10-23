import React from 'react';
import { Avatar, Card, CardActions, CardHeader, CardMedia, CardText, CardTitle, FlatButton, FontIcon, GridList, GridTile, IconButton } from 'material-ui';
import { Styles } from '../styles';
import { isObject, isFunction, defaultsDeep as deep, sortBy } from 'lodash';
import TinyColor from 'tinycolor';
import { ColorMe as colorMe } from '../utils';
import Marked from 'marked';
import moment from 'moment';
import Table from './table';
import ImageGallery from 'react-image-gallery';

import debugging from 'debug';
let	debug = debugging('lodge:app:common:components:device');

export default class Pre extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Device Pre';		
		
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
		fontWeight: 'bold',
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
		fontSize: 12,
		margin: '0 10px 0 0',
		textAlign: 'center'
	},
	rowBottom: {
		margin: '0 10px 0 0',
		fontSize: 12,
		textAlign: 'center'
	},
	rowTopB: {
		borderBottom: '1px solid', 
		fontSize: 12,
		margin: '0 0  0 10px',
		textAlign: 'center'
	},
	rowBottomB: {
		margin: '0 0  0 10px',
		fontSize: 12,
		textAlign: 'center'
	},
	specHead: {
		borderBottom: '1px solid', 
		fontSize: 12,
		textAlign: 'left'
	}
};

/**
 * Device
 * 
 * **/
export class Device extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Device Device';		
		this._imageGallery =  {}
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	render() {
		console.log('RENDER DEVICE FULL');
		let styles = deep({
			specHead: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				 
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
			<div style={styles.root} className="" >
					{this.props.list.map((tile, k) => {	
						console.log('RENDER DEVICE FULL Map');
						const card = (tile) => {
							console.log('RENDER CARD');
							return (
								<Card style={{ padding: 2, boxSizing: 'border-box', marginBottom: 15 }} >
									<CardHeader
										title={tile.name}
										subtitle={tile.sub}
										actAsExpander={tile.expands === null || tile.expands === false ? tile.expands : true}
										showExpandableButton={tile.expands === null || tile.expands === false ? tile.expands : true}
										initiallyExpanded={tile.expanded === false || tile.expanded === null  ? tile.expanded : true}
										expanded={tile.expanded === false || tile.expanded === null ? tile.expanded : true} 
									/>
									<CardText expandable={tile.expands === false || tile.expands === null  ? tile.expands : true} >
										<div className="" style={{ width: '100%', padding: 5, margin: '-20 auto 0' }}>
											{tile.tile}
										</div>
										<div style={{ marginBottom: 10}} className="clearfix" />
									</CardText>
								</Card>
							);
						}
						
						let romfields = [
							{ label: 'Published', style: { width: '15%', fontSize: 11 }, field: 'publishedDate', print: (v, props, obj) => (moment(v).format('l')) },
							{ 
								field: 'name',
								style: { width: '45%', fontSize: 11 },
								label: 'ROM', 
								print: (v, props, obj) => (
									<a
										href={"/noscript/roms/" + obj.slug} 
										onClick={ e => {
											e.preventDefault();
											this.props.goTo({ 
												page: 'rom', 
												path: '/roms/' + obj.slug, 
												roms: { 
													rom: obj.slug 
												} 
											}); 
										}} 
									>
										{v}
									</a>
								)
							},
							{ style: { width: '20%', fontSize: 11 }, label: 'Version', field: 'version' },
							{ style: { width: '20%', fontSize: 11 }, label: 'Downloads', field: 'downloads', print: (v, props, obj) => (v.map(b => {
								var rgxP = /\(([^)]+)\)/;
								var match = b.match(rgxP);
								var link = match && match[1];
								
								var rgx = /\[([^)]+)\]/;
								var match2 = b.match(rgx);
								var post = match2 && match2[1];
								//debug('## render ## regex dowload links', link, post);
								return (<p><a href={link} onClick={e=>{e.preventDefault();goAwayLink(this.props, (<a href={link} target="_blank" children={link} style={{ fontSize: 14 }} />));}} target="_blank" children={post} /></p>);
								
							})) },
						];
						console.log('RENDER ROMS');
						let roms2 = sortBy(tile.roms, function(o) { return o.publishedDate; }).reverse();
						let roms = roms2.length < 1 ? <span /> : card({ expanded: null, expands: null,  name: 'ROMS', sub: roms2.length + ' ROMs are matched with this Device.', tile: (<Table fields={romfields} theme={this.props.theme} list={roms2} />) });
						console.log('RENDER POSTS');
						let posts2 = sortBy(tile.posts, function(o) { return o.name; }); 
						let posts = posts2.length < 1 ? <span /> : card({ 
							expanded: null, 
							expands: null,  
							name: 'Webpages', 
							sub: posts2.length + ' available links', 
							tile: posts2.map(d => {
								debug('## POSTS ##', d, tile.posts);
								return (<a href={d.url} onClick={e=>{e.preventDefault();goAwayLink(this.props, (<a href={d.url} target="_blank" children={d.url} style={{ fontSize: 14 }} />));}} target="_blank" children={d.name} />);
							}) 
						});
						console.log('RENDER DESC', tile.description);
						let description = (!tile.description || (tile.description && tile.description.md == ''))  ? <span /> : card({  expanded: null, expands: null,  name: 'Description', tile: (<div dangerouslySetInnerHTML={{ __html: Marked(tile.description.md) }} />) });
						console.log('RENDER TAGS');
						let tags = !tile.tags ? <span /> : card({ expanded: null, expands: null,  name: 'Tags', tile: (<div dangerouslySetInnerHTML={{ __html: tile.tags }} />) });
						
						console.log('build Spec Table');
						let specfields = [
							{ style: { width: '40%', fontSize: 11 }, label: 'Type', field: 'type' },
							{ 
								field: 'spec',
								style: { width: '60%', fontSize: 11 },
								label: 'Spec',
							}
						];
						console.log('build Spec items Full');
						let spectableitems = [
							{ type: 'Brand', spec: !isObject(tile.brand) ? '' : tile.brand.name },
							{ type: 'Model', spec: tile.model },
							{ type: 'CPU', spec: !isObject(tile.chip) ? '' : tile.chip.name },
							{ type: 'GPU', spec: tile.gpu },
							{ type: 'Ram', spec: tile.ram + ' ' + tile.ramType },
							{ type: 'Storage', spec: tile.storage + ' ' + tile.storageType },
							{ type: 'Case', spec: tile.case },
							{ type: 'Colors', spec: !Array.isArray(tile.colors) ? '' : tile.colors.join(', ').substr(-2) },
							{ type: 'Type', spec: isObject(tile.type) ? tile.type.name : '' },
							{ type: 'OS', spec: tile.os },
							{ type: 'Bluetooth', spec: tile.bluetooth },
							{ type: 'Camera', spec: tile.camera },
							{ type: 'Resolution', spec: tile.resolution },
							{ type: 'Mobile', spec: tile.mobile },
							
						]
						console.log('RENDER Spec Table'); 
						let stable = card({ expanded: null, expands: null,  name: 'Device Information', tile: (<Table fields={specfields} theme={this.props.theme} list={spectableitems} />) });
						
						
						console.log('RENDER TOOLFIELDS');
						let toolfields = [
							{ style: { width: '15%', fontSize: 11 }, label: 'Version', field: 'version' },
							{ 
								field: 'name',
								style: { width: '50%', fontSize: 11 },
								label: 'Tool', 
								print: (v, props, obj) => (
									<a
										href={"/noscript/tools/" + obj.slug} 
										onClick={ e => {
											e.preventDefault();
											this.props.goTo({ 
												page: 'tool', 
												path: '/tools/' + obj.slug, 
												tools: { 
													tool: obj.slug 
												} 
											}); 
										}} 
									>
										{v}
									</a>
								)
							},
							{ label: 'Post', style: { width: '35%', fontSize: 11 }, field: 'post', print: (v, props, obj) => (<a href={v} onClick={e=>{e.preventDefault();goAwayLink(this.props, (<a href={v} target="_blank" >{v}</a>));}} target="_blank" children="External Post" />) },
							
						];
						console.log('RENDER TOOLS');
						let tools2 = sortBy(tile.tools, function(o) { return o.name; }); 
						let tools = tools2.length < 1 ? <span /> : card({ expanded: null, expands: null,  name: 'Tools', sub: tools2.length + ' Tools are matched with this How To.', tile: (<Table fields={toolfields} theme={this.props.theme} list={tools2} />) });
						console.log('RENDER HOWTOS');
						let howtos2 = sortBy(tile.howtos, function(o) { return o.title; }); 
						let howtos = howtos2.length < 1 ? <span /> : card({ expanded: null, expands: null,  name: 'How Tos', sub: howtos2.length + ' How Tos are matched with this Device.', tile: howtos2.map(d => (<div children={(<a
							href={"/noscript/howtos/" + d.slug} 
							onClick={ e => {
								e.preventDefault();
								
								this.props.goTo({ 
									page: 'how to', 
									path: '/howtos/' + d.slug, 
									searchTerms: { 
										howto: d.slug 
									} 
								}); 
							}} 
							children={d.title} 
						/>)} />) )});
						
						
						let cardmedia = <span />;
						let feature = tile.featured && tile.featured.secure_url ? tile.featured.secure_url : tile.imageLinks[1] ? tile.imageLinks[1] : false;
						if(feature) {
							cardmedia = (<CardMedia
								overlay={<CardTitle subtitle={<div dangerouslySetInnerHTML={{ __html: tile.blurb ? tile.blurb.html : ''}} />} />}
								mediaStyle={{ height: 400, width: '100%', background: 'url(' + feature + ')no-repeat', backgroundPosition: '0 -150 ', backgroundSize: 'cover' }}
								style={{ height: 400, width: '100%' }}
								overlayContentStyle={{ marginBottom: 20 }}
							/>);
						}
						
						let images = <span />;
						if(tile.images && tile.images.length > 0) {
							images = (<Card>
								<CardHeader
									title={<span>Photos - <a children={'fullscreen'} href='#' onClick={(e)=>{e.preventDefault();this._imageGallery.fullScreen()}} /></span>}
								/>
								<CardMedia	
									children={<div style={{ padding: '0 10' }}>
										<ImageGallery
											ref={i => this._imageGallery = i}
											items={tile.images}
											slideInterval={2000}
										/>
									</div>} 
								/>
								
							</Card>);
						}
						
						
						console.log('RENDER DESC');
						let desc = (<Card style={{ padding: 2, boxSizing: 'border-box' }} >
							<CardHeader
								title={<span><span style={{fontSize:11}}>{moment(tile.publishedDate).format('ll')}</span><br /> {tile.name}</span>}
								subtitle={keyspecs(this.props, tile, styles)}
							/>
							{cardmedia}
							<CardText >
								<div className="" style={{ width: '100%', margin: '10 auto 0' }}>
									{description}
									{stable}
									{card({ expanded: null, expands: null,  name: 'Specs', tile: (<div>{specMap(tile, k, styles)}</div>)})}									
									<div  className="clearfix" />
									{roms}
									{posts}
									<div className="clearfix" />
									{howtos}
									{tools}
									<div className="clearfix" />
									
									{tags}
									{images}
								</div>
								<div style={{ marginBottom: 5}} className="clearfix" />
							</CardText>
							
						</Card>);
						console.log('RENDER DEVICE FULL RETURN');
						return (
							<div 
								className={"col-xs-12 no-padding" } 
								style={{
									//height: 400, //this.props.desktop ? 400 : 200,
									//overflow: 'hidden',
									borderBottomWidth: 10,
									borderColor: this.props.theme.baseTheme.palette.accent1Color,
									borderStyle: 'solid',
									borderLeftWidth: 0,
									borderRightWidth: 0,
									borderTopWidth: 10,
								}}
							>
								{desc}
							</div>
						)
					})}
			</div>
		);
		
		if(this.props.list.length === 0) {
			return <div style={{marginTop:20, textAlign:'center'}} >No devices found</div>
		} else {
			console.log('RENDER DEVICE RUN MASP');
			return GridListExampleComplex();
		}
		
	}
}

Device.defaultProps = {
	asset: {},
	list: [],
	theme: {}, 
	style: {},
	
};
Device.childContextTypes = {
    muiTheme: React.PropTypes.object
};



/**
 * TILES
 * 
 * **/
export class Tiles extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Device Tiles';		
		
	}
	
	getChildContext() {
		return {
			muiTheme: this.props.theme
		};
	}
	
	render() {
		console.log('RENDER DEVICE TILES', this.props.assets);
		let styles = deep({
			specHead: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
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
			},
			minibox: {
				backgroundColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(25, this.props.theme.baseTheme.palette.canvasColor).color,
			}
		}, deep( { ...this.props.styles }, { ...defstyles }));	
			
		const GridListExampleComplex = () => (
			<div style={styles.root} className="" >
					{this.props.list.map((tile, k) => {	
						//console.log('RENDER DEVICE TILE MAP');
						let cardmedia = <span />;
						let feature = tile.featured && tile.featured.secure_url ? tile.featured.secure_url : tile.imageLinks[1] ? tile.imageLinks[1] : false;
						if(feature) {
							cardmedia = (<CardMedia
								overlay={<CardTitle subtitle={<div dangerouslySetInnerHTML={{ __html: tile.blurb ? tile.blurb.html : ''}} />} />}
								mediaStyle={{ height: 300, width: '100%', background: 'url(' + feature + ')no-repeat top left', backgroundSize: 'cover' }}
								style={{ height: 300, width: '100%' }}
								overlayContentStyle={{ marginBottom: 20 }}
							/>);
						}
						console.log('build Spec Table');
						let specfields = [
							{ style: { width: '40%', fontSize: 11 }, label: 'Type', field: 'type' },
							{ 
								field: 'spec',
								style: { width: '60%', fontSize: 11 },
								label: 'Spec',
							}
						];
						console.log('build Spec items tiles');
						let spectableitems = [
							{ type: 'Brand', spec: !isObject(tile.brand) ? '' : tile.brand.name },
							{ type: 'Model', spec: tile.model },
							{ type: 'CPU', spec: !isObject(tile.chip) ? '' : tile.chip.name },
							{ type: 'GPU', spec: tile.gpu },
							{ type: 'Ram', spec: tile.ram + ' ' + tile.ramType },
							{ type: 'Storage', spec: tile.storage + ' ' + tile.storageType },
							{ type: 'Case', spec: tile.case },
							{ type: 'Colors', spec: !Array.isArray(tile.colors) ? '' : tile.colors.join(', ').substr(-2) },
							{ type: 'Type', spec: isObject(tile.type) ? tile.type.name : '' },
							{ type: 'OS', spec: tile.os },
							{ type: 'Bluetooth', spec: tile.bluetooth },
							{ type: 'Camera', spec: tile.camera },
							{ type: 'Resolution', spec: tile.resolution },
							{ type: 'Mobile', spec: tile.mobile },
							
						]
						console.log('RENDER Spec Table'); 
						
						let desc = (<Card style={{ padding: 3, boxSizing: 'border-box' }} >
							<CardHeader
								title={<span><span style={{fontSize:11}}>{moment(tile.publishedDate).format('ll')}</span><br /> {tile.name.substr(0,50)}</span>}
								subtitle={keyspecs(this.props, tile, styles)}
								actAsExpander={true}
								showExpandableButton={true}
							/>
							<CardText expandable={true}>
								<div className="" style={{ width: '100%', margin: '-20 auto 0' }}>
									{numbers(tile, styles, this.props)}
									<div style={{ marginBottom: 5}} className="clearfix" />
									<div style={styles.specHead} >Specs</div>
									<div><Table fields={specfields} theme={this.props.theme} list={spectableitems} />{tile.specs.length === 0 ? '' : specMap(tile, k, styles)}</div>
									
								</div>
								<div style={{ marginBottom: 5}} className="clearfix" />
							</CardText>
							{cardmedia}
						</Card>);
						//console.log('RENDER DEVICE TILE RETURN');
						return (
							<div 
								key={'tile'+k}
								className={k === 0 || !this.props.desktop ? "col-xs-12 no-padding" : 'col-xs-6 no-padding'} 
								style={{
									//height: 400, //this.props.desktop ? 400 : 200,
									//overflow: 'hidden',
									borderBottomWidth: 10,
									borderColor: this.props.theme.baseTheme.palette.accent1Color,
									borderStyle: 'solid',
									borderLeftWidth: k === 0 || k%2 !== 0 ? 0 : 5,
									borderRightWidth: k === 0 || k%2 === 0 ? 0 : 5,
									borderTopWidth: k === 0 ? 10 : 0,
								}}
							>
								{desc}
							</div>
						)
					})}
			</div>
		);
		
		if(this.props.list.length === 0) {
			return <div  style={{marginTop:20, textAlign:'center'}} >No devices found</div>
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
		this.displayName = 'Device Compact';		
		debug('## RUN compact');
	}
	
	componentWillReceiveProps(props) {
		debug('### Compact got props ###');
	}
	
	render() {
		debug('## render compact');
		let styles = deep({
			specHead: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
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
			},
			minibox: {
				backgroundColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(25, this.props.theme.baseTheme.palette.canvasColor).color,
			}
		}, deep( { ...this.props.styles }, { ...defstyles }));	
		
		const CompactList = () => (
			<div style={styles.root} className="no-gutter" >
					{this.props.list.map((tile, k) => {
						let feature = tile.featured && tile.featured.secure_url ? tile.featured.secure_url : tile.imageLinks[0] ? tile.imageLinks[0] : false;
						
						console.log('build Spec Table');
						let specfields = [
							{ style: { width: '40%', fontSize: 11 }, label: 'Type', field: 'type' },
							{ 
								field: 'spec',
								style: { width: '60%', fontSize: 11 },
								label: 'Spec',
							}
						];
						console.log('build Spec items compact');
						let spectableitems = [
							{ type: 'Brand', spec: !isObject(tile.brand) ? '' : tile.brand.name },
							{ type: 'Model', spec: tile.model },
							{ type: 'CPU', spec: !isObject(tile.chip) ? '' : tile.chip.name },
							{ type: 'GPU', spec: tile.gpu },
							{ type: 'Ram', spec: tile.ram + ' ' + tile.ramType },
							{ type: 'Storage', spec: tile.storage + ' ' + tile.storageType },
							{ type: 'Case', spec: tile.case },
							{ type: 'Colors', spec: !Array.isArray(tile.colors) ? '' : tile.colors.join(', ').substr(-2) },
							{ type: 'Type', spec: isObject(tile.type) ? tile.type.name : '' },
							{ type: 'OS', spec: tile.os },
							{ type: 'Bluetooth', spec: tile.bluetooth },
							{ type: 'Camera', spec: tile.camera },
							{ type: 'Resolution', spec: tile.resolution },
							{ type: 'Mobile', spec: tile.mobile },
							
						]
						console.log('RENDER Spec Table'); 						
						let desc = (<Card>
							<CardHeader
								title={<span><span style={{fontSize:11}}>{moment(tile.publishedDate).format('ll')}</span><br /> {tile.name}</span>}
								subtitle={keyspecs(this.props, tile, styles)}
								avatar={feature}
								actAsExpander={true}
								showExpandableButton={true}
							/>
							<CardText expandable={true}>
								<div className="" style={{ width: '100%', margin: '-20 auto 0' }}>
									{numbers(tile, styles, this.props)}
									<div style={{ marginBottom: 5}} className="clearfix" />
									<div style={styles.specHead} >Specs</div>
									<div><Table fields={specfields} theme={this.props.theme} list={spectableitems} />{tile.specs.length === 0 ? '' : specMap(tile, k, styles)}</div>
								</div>
								<div style={{ marginBottom: 5}} className="clearfix" />
							</CardText>
							
						</Card>);
						return (
							<div
								
								style={{
									border: 'none',
									marginBottom: 10,
									width: '100%',
									
								}}
							>
								{desc}
							</div>
						);
					})}
			</div>
		);
		debug('## reder list');
		
		if(this.props.list.length === 0) {
			return <div  style={{marginTop:20, textAlign:'center'}} >No devices found</div>
		} else {
			return CompactList();
		}
		
	}
}

Compact.defaultProps = {
	asset: {},
	list: [],
	theme: {}, 
	style: {},
	
};

Compact.childContextTypes = {
    muiTheme: React.PropTypes.object
};


/**
 * list
 * 
 * **/
export class List extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Device List';		
		debug('## Device List');
	}
	
	componentWillReceiveProps(props) {
		debug('### List got props ###', props);
	}
	
	render() {
		debug('## render List', this.props);
		
		let styles = deep({
			specHead: {
				borderBottomColor: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
				color: colorMe(10, this.props.theme.baseTheme.palette.canvasColor).bgcolor, 
			},
			desc: {
				fontSize: 11, 
				overflow: 'hidden', 
				padding: '0 8px',
				color: colorMe(10, this.props.theme.baseTheme.palette.textColor).bgcolor,
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
				color: colorMe(80, this.props.theme.baseTheme.palette.canvasColor).color,
				fontColor: 11,
			},
			minibox: {
				color: colorMe(10, this.props.theme.baseTheme.palette.textColor).bgcolor,
			}
		}, deep( { ...this.props.styles }, { ...defstyles }));
		
		let final = this.props.list.map((rom) => {
			
			let desc = typeof rom.blurb == 'object' && rom.blurb.html != '' ? (<div  style={styles.desc}  dangerouslySetInnerHTML={{ __html: rom.blurb.html }} />) : <span />;
		
			return (<div id={rom.slug} style={{ margin: '0px 0 25px 0', padding: '5px 20px' }}  >
				<div style={{ fontSize: 12 }}>{moment(rom.publishedDate).format('LL')} </div>
				<div style={{ padding: '5px 0 0', background: 'transparent' }} >
					
					<a
						
						href={"/noscript/devices/" + rom.slug} 
						onClick={ e => {
							e.preventDefault();
							this.props.goTo({ 
								page: 'device', 
								path: '/devices/' + rom.slug, 
								searchTerms: { 
									device: rom.slug 
								} 
							}); 
						}} 
					>
						{rom.name}
					</a>
				</div>
				<div className="clearfix" />
				<div style={{ padding: '0 5px',  }} >
					{keyspecs(this.props, rom, styles)}
				</div>
				{desc}
			</div>);
		});
		
		if(this.props.list.length === 0 && this.props.noscript) {
			return <div />
		} else if(this.props.list.length === 0) {
			return <div style={{ marginTop: 0, marginBottom: 15,  textAlign:'left', padding: '5px 20px' }}  >No devices found</div>
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


/** helper functions **/

function findByProp(list, prop, value) {
		
	debug("FIND BY PROP", list, prop, value);
	
	if(!list) {
		return false;
	}

	var found = list.find(item => {
		if(!item) return false;
		if(item[prop] === value) {
			return true;
		}
		return false;
	});
	debug('##FOUND##', found);
	if(!found) found = {};
	return found;
}


function keyspecs(props, tile, styles) {
	return ([
		(<span style={styles.minibox} >{isObject(tile.chip) ? tile.chip.name : findByProp(props.assets.chips, '_id', tile.chip).name}</span>),
		(<span style={styles.minibox} >{tile.ram}  {tile.ramType}</span>),
		(<span style={styles.minibox} >{tile.storage} {tile.storageType}</span>),
	]);
}
function specMap(tile, k, styles) {
	return tile.specs.map((spec) => (
		<div key={spec.slug} style={{ padding: 3 }} className={k === 0  ? "col-xs-3 col-sm-2" : "col-xs-6 col-sm-4"}>
			<div style={styles.specbox}  children={spec.name}  />
		</div>
	));
}

export function Specs(specs, props) {
	return specs.map((spec) => {
		return (
			<div key={spec.slug} style={props.containerStyle} className={props.containerClass + "col-xs-4 col-sm-2 " }>
				<div style={props.indexed.indexOf(String(spec._id)) > -1 ? props.specIndexedStyle : props.specboxStyle} className={props.specClass || ''}  children={spec.name || spec.title} onClick={e => props.onClick(spec._id)}  />
			</div>
		);
	});
}

function numbers(tile, styles, props) {
	return (<div style={{ marginBottom: 0 }}>
		<div className="no-gutter">
			<div className="col-xs-12" style={{ fontWeight: 700, padding: 10, textAlign: 'left' }}>
				<a
					href={"/noscript/devices/" + tile.slug} 
					onClick={ e => {
						e.preventDefault();
						props.goTo({ 
							page: 'device', 
							path: '/devices/' + tile.slug, 
							searchTerms: { 
								device: tile.slug 
							} 
						}); 
					}} 
				>
					Full Device Information
				</a>
			</div>
			<div className="clearfix" />
			<div className="col-xs-3"  >
				<div style={styles.rowTop}>
					<a
						href={"/noscript/roms/by/device/" + tile.slug} 
						onClick={ e => {
							e.preventDefault();
							props.goTo({ 
								page: 'roms', 
								path: '/roms/by/device/' + tile.slug, 
								searchTerms: { 
									populate: 'romboxes'
								} 
							}); 
						}}
						 
					>ROMS</a>
				</div>
				<div style={styles.rowBottom} >
					{tile.roms.length}
				</div>
			</div>
			<div className="col-xs-3"  >
				<div style={styles.rowTop}>
					<a
						href={"/noscript/tools/by/device/" + tile.slug} 
						onClick={ e => {
							e.preventDefault();
							props.goTo({ 
								page: 'tools', 
								path: '/tools/by/device/' + tile.slug, 
								searchTerms: { 
									populate: 'romboxes'
								} 
							}); 
						}}
						 
					>Tools</a>
				</div>
				<div style={styles.rowBottom} >
					{tile.tools.length}
				</div>
			</div>
			<div className="col-xs-3"  >
				<div style={styles.rowTop}>
					<a
						href={"/noscript/howtos/by/device/" + tile.slug} 
						onClick={ e => {
							e.preventDefault();
							props.goTo({ 
								page: 'how tos', 
								path: '/howtos/by/device/' + tile.slug, 
								searchTerms: { 
									populate: 'romboxes'
								} 
							}); 
						}}
						 
					>How Tos</a>
				</div>
				<div style={styles.rowBottom} >
					{tile.howtos.length}
				</div>
			</div>
			<div className="col-xs-3 "  >
				<div style={styles.rowTopB}>
					<a
						href={"/noscript/pages/by/device/" + tile.slug} 
						onClick={ e => {
							e.preventDefault();
							props.goTo({ 
								page: 'pages', 
								path: '/pages/by/device/' + tile.slug, 
								searchTerms: { 
									populate: 'romboxes'
								} 
							}); 
						}}
						 
					>Pages</a>
				</div>
				<div style={styles.rowBottomB} >
					{tile.posts.length}
				</div>
			</div>
		</div>
	</div>);
}

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

