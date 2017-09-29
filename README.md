Woobi Media Streams
==================
LAN media server, IPTV broadcaster, and media converter.  
- Stream the same media to multiple locations at once using multicast or unicast/http.
- Stream your desktop to gaming/live servers.
- Use a tv tuner to stream OTA tv to all connected devices.  


## Contents
[Pre-Requisites](#pre-requisites)  
[Installation](#installation)   
[Usage](#usage)  
[Woobi UI](#woobi-ui)  
[Configuration](#configuration)   

[Woobi.Channel](#woobichannel)
  - [Options](#options)
  - [Adding Assets](#adding-assets)
  - [Properties](#properties)  
  - [API Routes](#api-routes)
  - [Watch / Listen](#watch--listen)

[Woobi.Sources](#woobisources)
  - [.File](#fileoptions-callback)  
  - [.Fluent](#fluentoptions-callback)  
  - [.Program](#programoptions-callback)  
  - [.UDP](#udpoptions-callback)  

[Woobi.Streams](#woobistreams)  
  - [.bridge](#bridge)
  - [.HLS](#hlsoptions-callback)
  - [.MpegTS](#mpegtsoptions-callback)
  - [.throttle](#throttlesource-rate-onend)
  - [.transform](#transform)
  - [.UDP](#udpoptions-callback-1)


[Screen Shots](#screen-shots)  
[Contributing](#contributing)  
[License](#license)  


## Pre-Requisites
You need ffmpeg and node >= v4.

## Installation  
```bash
yarn install woobi
``` 


## Usage  
```javascript
var Woobi = require('woobi');
Woobi.init({
	channelPort: 13000,
	host: 'studio',
	loadSaved: true,
	proxy: {
		port: 7001,
		nodeadmin: false,
		host: '0.0.0.0',
		keystone: true, // required to save channel configs
		auth: false, // set to true once you create a new user @ /keystone
	},
	adapters:  [
		/* the included media adapter is for a mysql database setup */
		{
			name: 'media',
			adapter: 'media',
			config: {
				user: 'MYSQLUSER',
				pass: 'MYSQLPASS',
				host: 'MYSQLHOST',
				database: 'MYSQLDB'
			},
		},
		/* custom adapters can be added. use the included adapters as a template */
		{
			name: 'livetv',
			adapter: function ( Woobi ) {
			
				var MyAdapter = function ( opts, callback ) {
		
					if ( !( this instanceof MyAdapter ) ) return new MyAdapter( opts, callback );
					
				}
				
				/* Add any function available in /lib/core/apapters.js */
				MyAdapter.prototype.getGuideData = function ( config, callback ) {
				
				}
				return MyAdapter;
			
			},
			config: {
				
			}
		},
		/* The included live tv adapter uses a mix of mysql databases and direct tcp connections */
		{
			name: 'livetv',
			adapter: 'livetv',
			config: {
				epg: {
					user: 'MYSQLUSER',
					pass: 'MYSQLPASS',
					host: 'MYSQLHOST',
					database: 'MYSQLDB'
				},
				tv: {
					user: 'MYSQLUSER',
					pass: 'MYSQLPASS',
					host: 'MYSQLHOST',
					database: 'MYSQLDB'
				},
				socket: {
					host: 'anna',
					port: '9080',
					hostname: 'studio',
					agent: 'Woobi'
				},
			}
		},
	]
});
```  

## Woobi UI
http://localhost:7001  
If you set the `proxy` option you can use the Woobi UI.
- Live Tv EPG and DVR Manager (ui only)  
- Create Channels  
- View Channels  
- Save / Manage Channels  
- View local library  


## Configuration 
#### Woobi.init(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
> return **Promise**  
>  
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **host** | _String_ | Host to use to access Woobi UI and api routes.  |
| **proxy** | _false\|Object_ | Optional server for api routes and Woobi UI. |
| **adapters** | _Object\|Array_ | Adapters can convert your info to the correct format.  |
| **loadSaved** | _Boolean_ | Load saved channels on boot that are set to autostart.  |
| **channelPort** | _Number_ | If a port is not supplied the port will be pulled starting at this number.  | 
| **mediaPath** | _String_ | Full path to store saved HLS files.  Defaults to **/_module_path_/media**  |
| **media passthrough route** | _String_ | Api route to direct access media.  |
| **media passthrough path** | _String_ | Replace the path above with the actual server path.  |
| **video passthrough route** | _String_ | Api route to direct access videos.  |
| **video passthrough path** | _String_ | Replace the path above with the actual server path.  |
>  
##### proxy object  
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **host** | _String_ | Host to start on. default 0.0.0.0  |
| **port** | _Object_ | Port for api routes and Woobi UI access. |
| **keystone** | _Boolean_ | Use keystone if you want to save channel configs from the UI.  |
| **nodeadmin** | _Boolean_ | Load the nodeadmin app.  |
| **auth** | _Boolean_ | Used with keystone. Set to false at first to create a new user @ http://localhost/keystone  |
> You can add any keystone option to the proxy configuration.   
> If you want to use channel saving and do not want to use keystone, then attach a mongoose model to `Woobi.libs._mongo.ChannelConfig.model`
##### adapters Array of Objects  
> Adapters are used to convert your information into the required format for the UI.  
> You can also uses adapters for non-ui use cases.   
> For local media a `media` adapter is needed.  An example using mysql databases is included.  
> For live tv a `livetv` adapter is needed. An example using a mix of mysql databses and tcp connections is supplied.  

| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for the adapter.  Can be accessed at `Woobi.libs[name]`  |
| **adapter** | _String\|Function_ | String for included adapter or a function to provide your own. |
| **config** | _Object_ | |
| **config.user** | _String_ | username  |
| **config.pass** | _String_ | password |
| **config.host** | _String_ | host |
| **config.database** | _String_ | database |
> **note** - A `media` and `livetv` adapters are used by the UI if supplied.  
> **note** - config will be passed to custom adapters and can include additional key/value pairs

>  The media adapter needs the following functions  
>  `tvShow` `tvShows` `tvShowByName` `tvShowByIMDB` `tvShowEpisodes` `recentEpisodes`   
>  `movie` `movies` `movieByName` `movieByIMDB` `recentMovies` `grabMedia`  

>  The livetv adapter needs the following functions  
>  `connect` `getGuideData` `getSeriesTimers` `getTimers` `getTVChannels` `getChannelGroups` 

## Woobi.Channel  
Use `Woobi.addChannel(name, opts).then()` to add channels instead of directly with `new Woobi.Channel(name, opts, callback)`.  This gives a directory of channels for iptv.  

```javascript 
/**
 * grabbing a tv tuner card
 **/
Woobi.addChannel('TV', {
	loop: true,
	assets: [
		{
			type: 'program',
			name: 'Air',
			arg: 'gnutv -channels /home/woobi/dvb/channels.conf -out udp 10.10.10.82 13333 WAGA5',
			redo: 'gnutv -channels /home/woobi/dvb/channels.conf -out udp 10.10.10.82 13333 ##CMD##',
		},
		{
			type: 'udpSink',
			port: 13333,
			host: '10.10.10.82',
			name: 'AirTV',
		},
		{
			type: 'udpStream',
			port: 13333,
			host: '10.10.10.87',
			name: 'streamAir'
		},
		
	],
}, (err) => {
	if(err) console.log('##ERROR##',err);
});

/**
 * using the library adapter
 **/
Woobi.libs.mysql.movies()
.then((movies) => {
    movies = movies.map(r => {
		return { name: r.name, file: r.file, progress: true, metadata: r, encode: false }
    });
    return Woobi.addChannel('recentMovies', {
		files: movies,
		loop: true,
		noTransition: true,
		hls: {
			type: 'hls',
			name: 'movieChannel',
			passthrough: true, // uses the stream as is / no transcoding
		}
    });
})
.catch((err) => {
    if(err) debug('##ERROR##',err);
});

// channel is now available at Woobi.channels['movieChannel']
```
### Options
### Adding Assets
### Properties
### API Routes
### Watch / Listen  

## Woobi.Sources
#### .File(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let file = new Woobi.Sources.File({
    name: 'Test',
    file: '/home/woobi/Pitures/woobi.mp3'
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **file** | _Object_ | Full path to file. |

#### .Fluent(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let fluent = new Woobi.Sources.Fluent({
    name: 'Test',
    file: '/home/woobi/Videos/woobi.mp4',
    streamable: true
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **file** | _Object_ | *optional* Full path to file. |
| **stream** | _Object_ | *optional* Source stream. |
| **progress** | _Boolean_ | Emit progress info.  |
| **metadata** | _Object_ | Object of information about file. Should be flat with exception of the `art` key(an Array).  | 
| **seek** | _Number_ |  |
| **inputFormat** | _String_ |  |
| **inputOptions** |  _Array\|String_ |  |
| **outputOptions** |  _Array\|String_ |  |
| **videoFilters** | _Object_ |  |
| **onlyOptions** | _Array\|String_ |  |
| **encode** | _Boolean_ |  |
| **streamable** | _Boolean_ |  |
| **format** | _String_ |  |

#### .Program(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let program = new Woobi.Sources.Program({
    name: 'TV',
    program: 'gnutv',
    arg: '-channels /home/woobi/dvb/channels.conf -out udp 10.10.10.82 13333 WAGA5',
    redo: '-channels /home/woobi/dvb/channels.conf -out udp 10.10.10.82 13333 ##CMD##',
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **program** | _String_ | Program name. |
| **args** | _String_ | Argument String. |
| **redo** | _String_ | String used to restart program. |

#### .UDP(options, callback)   
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let updSource = new Woobi.Sources.UDP({
    name: 'UDPSource',
    host: '10.10.10.10',
    port: 7005
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **host** | _String_ |  |
| **port** | _Number_ |  |

## Woobi.Streams
#### .bridge() 
>   
```javascript
let bridge = new Woobi.Streams.bridge();
```
> normal passthrough stream

#### .HLS(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let hls = new Woobi.Streams.HLS({
    name: 'Test',
    file: '/home/woobi/Videos/woobi.mp4',
    streamable: true
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **file** | _Object_ | *optional* Full path to file. |
| **stream** | _Object_ | *optional* Source stream. |
| **progress** | _Boolean_ | Emit progress info.  |
| **metadata** | _Object_ | Object of information about file. Should be flat with exception of the `art` key(an Array).  | 
| **seek** | _Number_ |  |
| **inputFormat** | _String_ |  |
| **inputOptions** |  _Array\|String_ |  |
| **outputOptions** |  _Array\|String_ |  |
| **onlyOptions** | _Array\|String_ |  |
| **hlsOptions** | _Array\|String_ |  |
| **passthrough** | _Boolean_ |  |
| **streamable** | _Boolean_ |  |
| **format** | _String_ |  |

#### .MpegTS(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let mpegts = new Woobi.Streams.MpegTS({
    name: 'Test',
    file: '/home/woobi/Videos/woobi.mp4',
    streamable: true
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **program** | _String_ |  |
| **path** | _String_ |  |
| **urlPath** | _String_ |  |
| **source** | _Object_ | input source. |
| **video** | _String_ |  |
| **audio** | _String_ |  |
| **other** | _String_ |  |
| **segment** | _String_ |  |

#### .throttle(source, rate, onEnd)
> @param - **source** - Stream  
> @param - **rate** - Number
> @param - **onEnd** - Function
```javascript
let throttle = new Woobi.Streams.throttle(stream, 1000);
// throttle.stream.pipe(somewhere)
```
> 

#### .transform()
>   
```javascript
let transformer = new Woobi.Streams.transform();
```
> transform stream

#### .UDP(options, callback)   
> @param - **options** - Object  
> @param - **callback** - Function  
```javascript
let updStream = new Woobi.Streams.UDP({
    name: 'UDPStream',
    host: '10.10.10.11',
    port: 7006
});
```
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for asset  |
| **host** | _String_ |  |
| **port** | _Number_ |  |


## Screen Shots

## Contributing

## License

