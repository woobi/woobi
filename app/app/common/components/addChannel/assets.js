import React from 'react';
import Debug from 'debug'
import { Checkbox, FlatButton, FloatingActionButton, FontIcon, IconButton, IconMenu, MenuItem, RaisedButton, TextField } from 'material-ui';
import { Styles } from '../../styles';
import { ColorMe } from '../../utils';
import Gab from '../../gab';
import File from './assets/file';
import UDP from './assets/udp';
import { pullAt } from 'lodash';

let debug = Debug('lodge:app:common:components:addChannel:assets'); 
	
export default class addChannelAssets extends React.Component {
	constructor(props) {
		super(props)
		this.displayName = 'addChannelAssets Component';
		this.state = {
			current: {},
			add: false
		}
		
		this.setValue = this.setValue.bind(this);
		this.addSource = this.addSource.bind(this);
	}
	
	setValue(stateChange) {
		let current = { ...this.state.current, ...stateChange };
		this.setState({ current });
	}
	
	addSource() {
		if(this.state.current.type == 'file') {
			this.props.addFile(this.state.current, this.state.update);	
		} else {
			this.props.addSource(this.state.current, this.state.update);
		}
		this.setState({ current: {}, add: false, update: false });
	}
	
	render() {
		debug('## RENDER ## addChannelAssets',  this.state, this.props);
		let pages = this.props.assets.map((r, i) => {
				return (<div className="clearfix" style={{ background: ColorMe((i%2 === 0 ? 10: 20), this.props.theme.palette.canvasColor).bgcolor, color: ColorMe((i%2 === 0 ? 10: 20), this.props.theme.palette.canvasColor).color}}>
					<div style={{ float: 'left', width: 35, margin: 5, padding: 5, cursor: 'pointer'  }} children={<FontIcon className="material-icons" children="edit" />} onClick={() => {
						this.setState({ update: i, add: r.type, current: r });
					}}/>
					<div style={{ float: 'left', width: 35, margin: 5, padding: 5, cursor: 'pointer'  }} children=<FontIcon className="material-icons" children="delete_forever" /> onClick={() => {
						Gab.emit('confirm open', {
							html: 'Remove source ' + r.name + '?',
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									this.props.removeSource(i);
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Yes, REMOVE Source', 
						})
							
					}}/>
					<div style={{ textAlign: 'center', float: 'left', width: 50, margin: 5, padding: 5 }} children={i} />
					<div style={{ float: 'left', margin: 5, padding: 5  }} children={r.type} />
					<div style={{ float: 'left', margin: 5, padding: 5  }} children={r.name} />
				</div>);
		});
		let files = this.props.files.map((r, i) => {
				return (<div className="clearfix" style={{ background: ColorMe((i%2 === 0 ? 10: 20), this.props.theme.palette.canvasColor).bgcolor, color: ColorMe((i%2 === 0 ? 10: 20), this.props.theme.palette.canvasColor).color}}>
					<div style={{ float: 'left', width: 35, margin: 5, padding: 5, cursor: 'pointer'  }} children={<FontIcon className="material-icons" children="edit" />} onClick={() => {
						this.setState({ update: i, add: 'Input', current: { type: 'file', ...r } });
					}}/>
					<div style={{ float: 'left', width: 35, margin: 5, padding: 5, cursor: 'pointer'  }} children={<FontIcon className="material-icons" children="delete_forever" />} onClick={() => {
						Gab.emit('confirm open', {
							html: 'Remove file ' + r.name + '?',
							answer:(yesno) => { 
								Gab.emit('confirm open', { open: false });
								if(yesno) {
									this.props.removeFile(i);
								}
							},
							open: true,
							noText: 'Cancel',
							yesText: 'Yes, REMOVE File', 
						})
						
					}}/>
					<div style={{ textAlign: 'center', float: 'left', width: 50, margin: 5, padding: 5 }} children={i} />
					<div style={{ align: 'center', float: 'left',  margin: 5, padding: 5  }} children={r.name} />
					<div style={{ float: 'left', margin: 5, padding: 5  }} children={r.file} />
				</div>);
		});
		let page = (<div className="clearfix">
			<div style={{ height: 15 }} />
			<p>Sources will be setup in order</p>
			{pages}
			<div style={{ height: 15 }} />
			<p>Files will be played in order</p>
			{files}
			<div style={{ height: 15 }} />
			
		</div>);
		if (this.state.add === 'File' || this.state.add === 'Input' || this.state.add === 'URL') {
			page = <File { ...this.props } { ...this.state } setValue={this.setValue} assetsState={this.setState.bind(this)}  addSource={this.addSource} />;
		} else if (this.state.add === 'udpSink') {
			page = <UDP { ...this.props } { ...this.state } sink={true} assetsState={this.setState.bind(this)} setValue={this.setValue}  addSource={this.addSource} />;
		} else if (this.state.add === 'udpStream') {
			page = <UDP { ...this.props } { ...this.state } sink={false} assetsState={this.setState.bind(this)} setValue={this.setValue}  addSource={this.addSource} />;
		}
		return (<div>
			<h3> {this.props.name} </h3>
			<div>
				<IconMenu
					iconButtonElement={<div style={{ color: Styles.Colors.lightGreenA400, cursor: 'pointer' }}> Add New Source</div>}
					anchorOrigin={{horizontal: 'left', vertical: 'top'}}
					targetOrigin={{horizontal: 'left', vertical: 'top'}}
				>
					<MenuItem primaryText="File(s)" onClick={(e) => {
						e.preventDefault(); 
						this.setState({ update: false, add: 'File', current: { type: 'file', passthrough: true } });
					}} />					
					<MenuItem primaryText="Other FFmpeg input" onClick={(e) => {
						e.preventDefault(); 
						this.setState({ update: false, add: 'Input', current: { type: 'file' } });
					}} />
					<MenuItem primaryText="Program" onClick={(e) => {
						e.preventDefault(); 
						this.setState({ update: false, add: 'program', current: { type: 'program', } });
					}} />
					<MenuItem primaryText="UDP Sink" onClick={(e) => {
						e.preventDefault(); 
						this.setState({  update: false, add: 'udpSink', current: { type: 'udpSink',playSource: true} });
					}} />
					<MenuItem primaryText="UDP Stream" onClick={(e) => {
						e.preventDefault(); 
						this.setState({  update: false, add: 'udpStream', current: { type: 'udpStream', autoPlay: true } });
					}} />
					<MenuItem primaryText="URL" onClick={(e) => {
						e.preventDefault(); 
						this.setState({ update: false, add: 'URL', current: { type: 'file' } });
					}} />
					
				</IconMenu> 
				
			</div>
			<div style={{ height: 15 }} />
			<RaisedButton
				label="Back (Name)"
				primary={true}
				onTouchTap={() => (this.props.changeScreen(0))} 
				style={{float: 'left',  }}  
			/>
			<RaisedButton
				label="Next (HLS)"
				secondary={true}
				onTouchTap={() => (this.props.changeScreen(2))} 
				style={{float: 'left',  }} 
			/>
			<br />
			<br />
			
			<div style={{}}>
				{page}
			</div>
			
			
		</div>);
	}
}

addChannelAssets.defaultProps = {
	name: {},
}
