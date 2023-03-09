// import libraries
const { jsonUtility, Level,  } = require('rptd-core')
const { logicHelper } = require("rptd-lgic")

//create a new level
const level = new Level({LevelName: "logic testing"})
level.createSection({LevelBounds:{x:-1000, y:1000, z:-1000, w:1000}})

// parse logic and add gates into ruptured
const channels = logicHelper.addGatesFromFile({ 
  level, sectionId: 0,
  filePath: './6-AND.json', // parent logic sim
  // file paths to dependancies and sub dependancies all go in this list, 
  // the name (not file name path) must be same as the name of the sub chip in logic sim
  dependancies: { '3-AND': './3-AND.json' } 
})


for(i = -5; i < 10; i++) {
  level.addTile({ ID: 12, x:i, y:-3 })
}


channels.input.forEach((ch, index) => {
  level.addCrate({ x: -2 + index*2, y: 1 })
  level.addButton({ x:-2 + index*2, y:-2, Channel: ch })
})

channels.output.forEach((ch, index) => {
  level.addToggleWall({ x:-2+index*2, y:3, Channel:ch })
})

console.log(channels)

jsonUtility.writeLevelToFile(level, './output.json')
