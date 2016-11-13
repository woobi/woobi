import React from 'react';

import debugging from 'debug';
let	debug = debugging('woobi:app:layout');

export default class Layout extends React.Component {
	constructor(props) {
		super(props);
		console.log(props);		
	}
	
	renderHead() {
		return (<head>
			<meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
			<title>The Lodge</title>
			<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />			
			<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" />
			<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
			<link rel="stylesheet" href="https://npmcdn.com/react-select/dist/react-select.css" />
			<link rel="stylesheet" type="text/css" href="/css/material-ui.css" />
			
		</head>);
	}
	
	renderBody() {
		return (<body class="dark-theme">
			<div id="body">
			  <div id="confirm-modal"></div>
			  <div id="react-hot-reload" dangerouslySetInnerHTML={{__html: this.props.component}} />
			</div>
			<div className="container">
			  <div id="footer"></div>
			</div>
			<script src="/js/bundles/material-ui.js" />
		</body>);
	}
	
	render() {
		
		return (<HTML>
			{this.renderHead()}
			{this.renderBody()}
		</HTML>);
	}
}
