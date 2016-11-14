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
  [Woobi UI](#woobiui)  
  [Woobi.Sources](#woobi.sources)  
  - [.File](#file)  
  - [.Fluent](#fluent)  
  - [.Program](#program)  
  - [.UDP](#udp)  


  [Woobi.Streams](#woobi.streams)  
  - [.bridge](#bridge)
  - [.HLS](#hls)
  - [.MpegTS](#mpegts)
  - [.throttle](#throttle)
  - [.transform](#transform)
  - [.UDP](#udp2)


  [Woobi.Channel](#channel)
  - [Options](#options-channels)
  - [Adding Assets](#adding-assets)
  - [Properties](#properties)  
  - [API Routes](#api-routes)
  - [Watch / Listen](#watch-listen)


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

##### proxy configuration  
| option | type | info |
| :--------------- | :------------ | :------------------ |
| **host** | _String_ | Host to start on. default 0.0.0.0  |
| **port** | _Object_ | Port for api routes and Woobi UI access. |
| **keystone** | _Boolean_ | Use keystone if you want to save channel configs from the UI.  |
| **nodeadmin** | _Boolean_ | Load the nodeadmin app.  |
| **auth** | _Boolean_ | Used with keystone. Set to false at first to create a new user @ http://localhost/keystone  |

> You can add any keystone option to the proxy configuration.   
> If you want to use channel saving and do not want to use keystone, then attach a mongoose model to `Woobi.libs._mongo.ChannelConfig.model`

##### adapters configuration  
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

## Woobi.Streams

## Woobi.Channel

## Screen Shots

## Contibuting

## License  

