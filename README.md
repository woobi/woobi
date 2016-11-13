Woobi Media Streams
==================

  - [Installation](#installation)
  - [Screen Shots](#screen-shots)
  - [Usage](#usage)
  - [Configuration](#configuration)
    - [Options](#options)
    - [Servers](#servers)
      - [Simple](#simple-servers)
      - [Keystone](#keystone-servers)
      - [Existing](#existing-servers)
    - [Sources](#sources)
      - [File](#file-sources)
      - [Other](#other-sources)
      - [Program](#program-sources)
      - [UDP](#udp-sources)
    - [Streams](#streams)
      - [HLS](#file-streams)
      - [UDP](#other-streams)
      - [HTTP](#program-streams)
    - [Channels](#channels)
      - [Options](#options-channels)
      - [Adding Assets](#adding-assets-channels)
      - [Watch / Listen](#watch-listen-channels)
  - [More Screen Shots](#more-screen-shots)
  - [Contributing](#contributing)
  - [License](#license)


## Installation  
<kbd>yarn install woobi</kbd>  

## Screen Shots  


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
		keystone: true,
		logger: 'dev',
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

## Configuration  

### Options  

### Servers  

#### Simple  

#### Keystone  

####  Existing
