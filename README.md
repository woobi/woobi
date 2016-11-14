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
[Configuration](#configuration)  
[Woobi UI](#woobi-ui)  
[Woobi.Sources](#woobisources)
  - [.File](#fileoptions-callback)  
  - [.Fluent](#fluentoptions-callback)  
  - [.Program](#programoptions-callback)  
  - [.UDP](#udpoptions-callback)  

[Woobi.Streams](#woobistreams)  
  - [.bridge](#bridge)
  - [.HLS](#hls)
  - [.MpegTS](#mpegts)
  - [.throttle](#throttle)
  - [.transform](#transform)
  - [.UDP](#udp-1)

[Woobi.Channel](#woobichannel)
  - [Options](#options)
  - [Adding Assets](#adding-assets)
  - [Properties](#properties)  
  - [API Routes](#api-routes)
  - [Watch / Listen](#watch--listen)


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
import Woobi from 'woobi';
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
		{
			name: 'mysql',
			adapter: 'mysql',
			config: {
				user: 'MYSQLUSER',
				pass: 'MYSQLPASS',
				host: 'MYSQLHOST',
				database: 'MYSQLDB'
			},
		}
	]
});
```  
Woobi UI -  http://localhost:7001

## Configuration 
#### Woobi.init(options, callback)  
> @param - **options** - Object  
> @param - **callback** - Function  
> return **Promise**

| option | type | info |
| :--------------- | :------------ | :------------------ |
| **host** | _String_ | Host to use to access Woobi UI and api routes.  |
| **proxy** | _false\|Object_ | Optional server for api routes and Woobi UI. |
| **adapters** | _Object\|Array_ | Adapters for local media.  |
| **loadSaved** | _Boolean_ | Load saved channels on boot that are set to autostart.  |
| **channelPort** | _Number_ | If a port is not supplied the port will be pulled starting at this number.  | 
| **mediaPath** | _String_ | Full path to store saved HLS files.  Defaults to **/_module_path_/media**  |
| **media passthrough route** | _String_ | Api route to direct access media.  |
| **media passthrough path** | _String_ | Replace the path above with the actual server path.  |
| **video passthrough route** | _String_ | Api route to direct access videos.  |
| **video passthrough path** | _String_ | Replace the path above with the actual server path.  |

##### proxy object  
leave out or set to false to ignore  

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
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **name** | _String_ | Unique name for the adapter.  Can be accessed at `Woobi.libs[name]`  |
| **adapter** | _Object_ | Port for api routes and Woobi UI access. |
| **config** | _Object_ | |
| **config.user** | _String_ | username  |
| **config.pass** | _String_ | password |
| **config.host** | _String_ | host |
| **config.database** | _String_ | database |

> **note** - The default adapter name should be mysql.

## Woobi UI

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
    file: '/home/woobi/Pitures/woobi.mp3'
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
#### .bridge   
#### .HLS    
#### .MpegTS  
#### .throttle  
#### .transform  
#### .UDP

## Woobi.Channel
### Options
### Adding Assets
### Properties
### API Routes
### Watch / Listen

## Screen Shots

## Contributing

## License

