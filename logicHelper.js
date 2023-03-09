const fs = require('fs')
const { Chip, BaseChip } = require('./chips')

function readFile(pathToFile) {
  let obj = fs.readFileSync(pathToFile, 'utf8', (err, data) => {
      if (err) throw err
      return JSON.parse(data)
    }
  );
  obj = JSON.parse(obj)

  return obj
}

function isBaseGate(name) {
  return ['AND', 'OR', 'NOT', 'XOR'].includes(name)
}

function buildChipRegistry(chip, dependancies, id=0, registry={}, connections=[]) {
  const chipData = {}
  const chipRegistry = registry
  let connectionRegistry = connections
  chipData.name = chip.Name
  chipData.id = id
  chipData.inputPins = chip.InputPins.map(pin => {
    return `${chipData.id}-${pin.ID}`
  })
  chipData.outputPins = chip.OutputPins.map(pin => {
    return `${chipData.id}-${pin.ID}`
  })

  chip.Connections.forEach(connection => {
    let targetId
    let sourceId
    if(chipData.id != 0) {
      sourceId = `${chipData.id}:${connection.Source.SubChipID}-${connection.Source.PinID}`
      targetId = `${chipData.id}:${connection.Target.SubChipID}-${connection.Target.PinID}`
      if(connection.Source.SubChipID == '0') {
        sourceId = `${chipData.id}-${connection.Source.PinID}`
      }
      if(connection.Target.SubChipID == '0') {
        targetId = `${chipData.id}-${connection.Target.PinID}`
      }
    } else {
      sourceId = `${connection.Source.SubChipID}-${connection.Source.PinID}`
      targetId = `${connection.Target.SubChipID}-${connection.Target.PinID}`

    }
    connectionRegistry.push(`${sourceId} > ${targetId}`)
  })

  chipData.children = chip.SubChips.map(chip => {
    if(isBaseGate(chip.Name)) {
      const chipid = (chipData.id != 0) ? `${chipData.id}:${chip.ID}` : chip.ID
      const subChip = new BaseChip({ name: chip.Name, id: chipid, inputPins: [`${chipid}-0`, `${chipid}-1`], outputPins: [`${chipid}-2`] })
      chipRegistry[chipid] = subChip
      return subChip
    } else {
      const chipid = (chipData.id != 0) ? `${chipData.id}:${chip.ID}` : chip.ID
      const subChip = buildChipRegistry(dependancies[chip.Name], dependancies, chipid, chipRegistry)
      chipRegistry[chipid] = subChip.template
      connectionRegistry = [...connectionRegistry, ...subChip.connectionRegistry]
      return subChip
    }
  })
  const template = new Chip(chipData)
  return { template, chipRegistry, connectionRegistry }
}

function buildChannelRegistry(level, connectionRegistry) {
  const channelRegistry = {}
  const updatedConnections = [...connectionRegistry]

  function updateChannelsForConnection(connection, channel) {
    const pins = connection.split(" > ")
    const source = pins[0]
    const target = pins[1]

    const index = updatedConnections.indexOf(connection)

    if(!channelRegistry[source]) {
      channelRegistry[source] = channel
      updatedConnections[index] = 'channeled'
      getAllConnectionsWith(updatedConnections, source).forEach((connection) => { updateChannelsForConnection(connection, channel)})
    } 
    if(!channelRegistry[target]) {
      channelRegistry[target] = channel
      updatedConnections[index] = 'channeled'
      getAllConnectionsWith(updatedConnections, target).forEach((connection) => { updateChannelsForConnection(connection, channel)})
    }
  }

  updatedConnections.forEach((connection, index) => {
    if(connection != 'channeled') {
      const pins = connection.split(" > ")
      const source = pins[0]
      const target = pins[1]
      let channel
  
      if(channelRegistry[source]) {
        channel = channelRegistry[source]
        channelRegistry[target] = channelRegistry[source]
      } else if(channelRegistry[target]) {
        channel = channelRegistry[target]
        channelRegistry[source] = channelRegistry[target]
      } else {
        channel = level.nextFreeChannel
        level.useChannel(channel)
        channelRegistry[source] = channel
        channelRegistry[target] = channel
      }
  
      updatedConnections[index] = 'channeled'
      getAllConnectionsWith(updatedConnections, source).forEach((connection) => { updateChannelsForConnection(connection, channel)})
      getAllConnectionsWith(updatedConnections, target).forEach((connection) => { updateChannelsForConnection(connection, channel)})
    }
  })
  
  return channelRegistry
}

function getAllConnectionsWith(connectionRegistry, pin) {
  const output = []
  connectionRegistry.forEach(connection => {
    const pins = connection.split(" > ")
    if(pins[0] == pin || pins[1] == pin) {
      output.push(connection)
    }
  })

  return output
}

function addGates(level, sectionId, chipRegistry, channelRegistry) {
  Object.values(chipRegistry).forEach(chip => {
    if(isBaseGate(chip.name) && !chip.added) {
      chip.inputChannel1 = channelRegistry[chip.inputPins[0]]
      chip.inputChannel2 = channelRegistry[chip.inputPins[1]]
      chip.outputChannel = channelRegistry[chip.outputPins[0]]
      addGate(level, sectionId, chip)
    }
  })
}

function addGate(level, sectionId, gate) {
  if(gate.name === "AND") {
    level.addAndGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    gate.added = true
  }
  if(gate.name === "OR") {
    level.addOrGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    gate.added = true
  }
  if(gate.name === "NOT") {
    level.addNotGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, OutChannel1: gate.outputChannel })
    gate.added = true
  }
  if(gate.name === "XOR") {
    level.addXorGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    gate.added = true
  }
}

function getIOChannels(connectionRegistry, channelRegistry) {
  const input = []
  const output = []
  connectionRegistry.forEach(connection => {
    const pins = connection.split(" > ")
    const source = pins[0]
    const target = pins[1]

    if(source.split('-')[0] === '0') {
      input.push(channelRegistry[source])
    }
    
    if(target.split('-')[0] === '0') {
      output.push(channelRegistry[target])
    }
  })
  return { input, output }
}

function addGatesFromFile({ level, sectionId, filePath, dependancies }) {
  const json = readFile(filePath)
  const dependancyJson = {}
  Object.entries(dependancies).forEach(dependancy => {
    dependancyJson[dependancy[0]] = readFile(dependancy[1])
  })
  
  let { chipRegistry, connectionRegistry }  = buildChipRegistry(json, dependancyJson)

  const channelRegistry = buildChannelRegistry(level, connectionRegistry)

  addGates(level, sectionId, chipRegistry, channelRegistry)

  const { input, output } = getIOChannels(connectionRegistry, channelRegistry)

  return { input, output }
}

module.exports = { addGatesFromFile }
