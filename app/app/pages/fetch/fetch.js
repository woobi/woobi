import React from 'react'
import strip from 'striptags'
import markdown from 'marked'
import fetchPolyfill from 'fetch'
import Debug from 'debug'
import Gab from '../../common/gab'
import fof from '../404';

let debug = Debug('lodge:app:pages:fetch:fetch');

/**
 * This is our fetch component
 * If you send a Component then the data will be added to 
 * 	Componenet props.response and rendered
 * 
 * if Component is false then a div will be rendered
 * 
 * You can also use pages/generic for a plain component to render your page into
 * */

export default (page, Component, dataType, options) => {
	if(!options) options = {}
	
	if(!options.mode) {
		options.mode = 'cors'
	}
	class Page extends React.Component {
		constructor(props){
			super(props)
			this.displayName = 'Page Template'
			this.state = {}
		}
		componentDidMount() {
			if(typeof window.fetch == 'undefined' ) {
				// polyfill fetch
				window.fetch = fetchPolyfill
			}
			fetch(page, { mode: options.mode })
				.then(r => {
					//debug('fetch got result', r);
					let dType = (Array.isArray(dataType)) ? dataType[0] : dataType 
					switch(dType) {
						case 'json':
						case 'jsonp':
							return r.json();
							break;
						case 'blob':
							return r.blob();
							break;
						case 'arrayBuffer':
							return r.arrayBuffer();
							break;
						case 'formData':
							return r.formData();
							break;
						case 'html':
							return r.html();
							break;
						case 'body':
						default:
							return r.text();
					}					
				})
				.then(data => {
					//debug('fetch got data', data);
					let ret = this.transform(data, dataType)
					this.setState({
						response: ret
					});
					
					if('function' === typeof options.onUpdate) {
						options.onUpdate()
					}
					return;
				}.bind(this))
			.catch(e => {
				console.error('error fetching', e)
				
				let resp = fof;
				this.setState({
					response: resp,
					errorMessage: e.message
				});
				
			})
		}
		transform(data, dataType) {
			if(!dataType) {
				return data;
			} else if(Array.isArray(dataType)) {
				for( let t of dataType) {
					data = run(t, data)
				}
				return data
			} else {
				return run(dataType, data)
			}
			function run(type, data) {
				switch(type) {
					case 'body':
						return /<body.*?>([\s\S]*)<\/body>/.exec(data)[1]
						break
					case 'clean':
						return strip(data) // second argument is allowed tags as string or array 
						break
					case 'code':
						let preed
						try {
							preed = JSON.stringify(data, null, 4);
						} catch(e) {
							preed = e
						}
						return ("<pre>" + preed + "</pre>") 
						break
					case 'markdown':
						return markdown(data)
						break
					case 'noscript':
						let regx = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
						while (regx.test(data)) {
							data = data.replace(regx, "");
						}
						return data
						break
					case 'wikiindexpage':
						let wikiregx = /\[\[(.*?]*)\]\]/
						let link
						let uri = (options.markdownBasePath || '/markdown') + '/'
						while (wikiregx.test(data)) {
							let match = data.match(wikiregx);
							if(match) {
								// we may have a title and link or just a title
								let matches = match[1].split('|')
								if(matches.length === 1) {
									// conver the title into a link
									link = matches[0].split(" ").join("-");
									link = '<a href="' + uri + link + '" >' + matches[0] + '</a>'
								} else {
									link = '<a href="' + uri + matches[1] + '" >' + matches[0] + '</a>'
								}
								data = data.replace(wikiregx, link);
							}
						}
						data = data.replace('ol', 'ol class="fancy-list"')
						return data
						break
					default:
						return data
				}	
			}
		}
		componentDidUpate() {
			// run prism
			debug('options', options, typeof options.onUpdate)
			if('function' === typeof options.onUpdate) {
				options.onUpdate()
			}
		}
		render() {
			debug('render fetched page', this.state);
			if(this.state.response) {
				let sendBack = Component ? <Component {...this.props} {...this.state} /> : <div dangerouslySetInnerHTML={{ __html: this.state.response }} />
				return  sendBack
			} else {
				return <span />
			}
			
		}
	}

	Page.propTypes = {};

	return Page
}

