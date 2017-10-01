import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon, IconButton, LinearProgress} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';
import { Table, Column, Cell } from 'fixed-data-table-2';
import moment from 'moment';
import Dimensions from 'react-dimensions';

let debug = Debug('woobi:app:pages:epg:home');

const DateCell = ({rowIndex, data, col, ...props}) => {
  return (<Cell {...props}>
    {data.getObjectAt(rowIndex)[col].toLocaleString()}
  </Cell>)
}

const ImageCell = ({rowIndex, data, col, ...props}) => {
	return <span />
}

const LinkCell = ({rowIndex, data, col, ...props}) => {
	return (<Cell {...props}>
		<a href="#">{}</a>
	</Cell>);
}

const ChannelCell = ({rowIndex, data, col, ...props}) => {
	return (<Cell {...props}>
		{Object.keys( data )[rowIndex]}
	</Cell>);
}

const TextCell = ({rowIndex, data, col, ...props}) => {
	return (<Cell {...props}>
		{col}
	</Cell>)
}

class EPG extends React.Component {
	constructor(props) {
		super(props)
		
		if(props.initialData) {
			debug('got props initialData');
			//shows = props.initialData.shows.tvshows || [];
			this._skipMount = true;
		}
		this.displayName = 'EPG';
		this.state = {};
		
		this.buttonStyle = { margin: '0 auto', width: false, height: false, padding: 0};
		
		this._update = true;
		
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  EPG HOME',  this.props, this.state);
		
		//this.props.Sockets.io.on('tvshows', this.gotShows);
	}
	
	componentWillUnmount ( ) {
		//this.props.Sockets.io.removeListener('tvshows', this.gotShows);
	}
	
	componentWillReceiveProps ( props ) {
		debug('## componentWillReceiveProps  ## EPG got props', props);		
	}	
	
	shouldComponentUpdate ( ) {
		if(this._update) {
			this._update = false;
			return true;
		}
		return true;
	}
	
	renderGuideRows ( ) {
		if(this.props.entries) {
			return Object.keys( this.props.entries ).map( ( keyName ) => {
				let a = this.props.entries[keyName];
				let rows = a.map( ( v ) => {
					return (<Cell minWidthPx={100}>{v.title}</Cell>);
				});
				return (<Row key={keyName}  material={true} >
					<Cell thead minWidthPx={100}  material={true} >{ keyName }</Cell>
					{rows}
				</Row>);
			});
		}
	}
	
	render ( ) { 
		debug('## render  ##  EPG Home render', this.props, this.state);
		let ret = <div style={{ padding: 50 }}><LinearProgress mode="indeterminate" /></div>;
		let dataList = this.props.entries || {};
		const {height, width, containerHeight, containerWidth, ...props} = this.props;
		let now = moment().startOf('hour').subtract(30, 'm');
		let times = [];
		for ( let i=0; i<47; i++ ) {
			times.push(
				<Column
					header={<Cell>{now.add( 30, 'm' ).format( "h:mm a")}</Cell>}
					cell={<TextCell data={dataList} col={now.unix()} />}
					fixed={false}
					width={100}
				/>
			);
		}
		return (
			<Table
				rowHeight={50}
				headerHeight={50}
				rowsCount={Object.keys(dataList).length}
				width={containerWidth}
				height={containerHeight}
				{...this.props}
			>
				<Column
					header={<Cell>logo</Cell>}
					cell={<ImageCell data={dataList} col="logo" />}
					fixed={true}
					width={50}
				/>
				<Column
					header={<Cell>Channel</Cell>}
					cell={<ChannelCell data={dataList} col="channel" />}
					fixed={true}
					width={100}
				/>
				{ times }
			</Table>
		);
		
	}
	
}

EPG.getInitialData = function ( params ) {
	
	let ret = {
		shows: {
			action: 'epg'
		}
	}
	console.log( '### RUN getInitialData EPG ###',  params );
	return ret
}

export let Sizing = Dimensions({
	getHeight: function ( element ) {
		return window.innerHeight - 65;
	},
	getWidth: function( element ) {
		var widthOffset = window.innerWidth < 680 ? 0 : 240;
		return window.innerWidth - 20;
	}
})(EPG);

export default Sizing;
