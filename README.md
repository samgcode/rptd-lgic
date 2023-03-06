# rptd-lgic `v1.0.4`

rptd-lgic is an extension for [rptd-core](https://github.com/samgcode/rptd-lgic) that allows for reading logic gate systems from [digital logic sim](https://sebastian.itch.io/digital-logic-sim) and convert them into Ruptured logic gates

you can see he source code on github here: [rptd-lgic](https://github.com/samgcode/rptd-lgic)

## Installation

The only pre-requisite is that you have a version of [node.js](https://nodejs.org/en/) installed.

Then you can create a new project:
```bash
npm init
```
and install the package:
```bash
npm install rptd-core
npm install rptd-lgic
```

## Usage
```javascript
// import the components
const { jsonUtility, Level, Path } = require('rptd-core')
const { logicHelper } = require("rptd-lgic")
// create a new level
const level = new Level({ LevelName: 'Example Level' })
// add a new section
level.createSection({ LevelBounds:{ x:-100, y:100, z:-100, w:100 }})
```
Now in  [digital logic sim](https://sebastian.itch.io/digital-logic-sim)  you can create a project and create a chip that you want to import. The json is stored in AppData/LocalLow/SebastianLague

> NOTE: currently does not support sub chips, supported chips are and, or, not, xor

Then once you have a chip you can add it to the Ruptured level using:
```javascript
const channels = logicHelper.addGatesFromFile({ level, section: 0, filePath: '/path/to/chip.json'})
```

Finally you can write the level to a file which you can import into Ruptured:
```javascript
jsonUtility.writeLevelToFile(level, './example_level.json')
```
> Note: it is possible to write directly to a level in your Ruptured levels folder however this is not reccomended if you have the level editor open as it can cause the level loading to break untill you restart the game
