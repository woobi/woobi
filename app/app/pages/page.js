import React from 'react';
import Debug from 'debug';
import Gab from '../common/gab';
import { Card, CardActions, CardHeader, CardMedia, CardText, CardTitle, Divider, FlatButton, FontIcon, IconButton, List, ListItem, Styles } from 'material-ui';

let debug = Debug('lodge:app:pages:page');
		
export default class Page extends React.Component {
	constructor(props) {
		super(props);
		this.displayName = 'Page Component';	
		this.state = {
			ready: true,
			//page: props.page,
		};
		
		debug('page start props', props);
		this._update = false;
		this._updating = true;
	}
	
	componentWillReceiveProps(props) {
		
		if(props.page !== this.state.page ) {
			debug('page got page', props, this.state.page, this._updating)
			if(!snowUI.usesockets) {
				Gab.request(props.slug);
			} else {
				props.sockets.json(props.slug);
			}
			this._updating = true;
			snowUI.slug = props.slug;
			this.setState({
				slug: props.slug,
				page: props.page,
				contents: false
			});
			
			return true;
		}
		if(props.contents && this._updating) {
			debug('page got contents', props)
			this.setState({
				contents: props.contents
			}, function() {
				
			});
			this._update = true;
			this._updating = false;
			return true;
		}
		if(props.forceUpdate) {
			this._update = true;
		}
	}
	
	shouldComponentUpdate() {
		debug('should update? ', this._update);
		var ret = this._update ? this._update : this._update; // !this.props.allinone;
		return true;//ret;
	}
	
	componentDidUpdate() {
		debug('didUpdate', this._update);
		if(this._update) {
			var simple = document.getElementById("react-hot-reload");
			simple.scrollTop = 0;
			this._update = false;
			snowUI.fadeIn();
		}
	}
	
	componentDidMount() {
		debug('did mount');
		if( !snowUI.usesockets) {
			Gab.request(this.props.slug);
		} else if(this.props.slug) {
			this.props.sockets.json(this.props.slug);
		}
	}
	
	componentWillUnmount() {
		snowUI.code.__unmountUI();
	}
	
	render() {
		debug('home render', this.state, this.props);
		let content = this.state.contents;
		return (<div className="col-xs-12" >
			<Card style={{minHeight: snowUI.contentHeight}} >
				<CardText style={{paddingRight:0, paddingLeft:0}} >
					<div dangerouslySetInnerHTML={{ __html: content }} />					
				</CardText>
			</Card>
		</div>);
	}
}
