const fs = require('fs')
const { AND, OR, NOT, XOR, INPUT, OUTPUT } = require('./logicGates')

function readFile(pathToFile) {
  let obj = fs.readFileSync(pathToFile, 'utf8', (err, data) => {
      if (err) throw err
      return JSON.parse(data)
    }
  );
  obj = JSON.parse(obj)

  return obj
}

function reduce(json) {
  const data = {
    inputs: [],
    gates: [],
    connections: [],
    outputs: []
  }

  json.InputPins.forEach(pin => {
    data.inputs.push({ name: pin.Name, id: pin.ID })
  })
  
  json.SubChips.forEach(gate => {
    data.gates.push({ name: gate.Name, id: gate.ID })
  })
  
  json.Connections.forEach(connection => {
    data.connections.push({ 
      from: (connection.Source.SubChipID != 0 ? connection.Source.SubChipID : connection.Source.PinID),
      to: (connection.Target.SubChipID != 0 ? connection.Target.SubChipID : connection.Target.PinID)
    })
  })
  
  json.OutputPins.forEach(pin => {
    data.outputs.push({ name: pin.Name, id: pin.ID })
  })

  return data
}

function parse(data) {
  const [input, and, or, not, xor, output] = [[],[],[],[],[],[]]
  data.inputs.forEach(i => {
    input.push(new INPUT(i.id))
  })

  data.gates.forEach(gate => {
    if(gate.name === "AND") and.push(new AND(gate.id, gate.name))
    if(gate.name === "OR") or.push(new OR(gate.id, gate.name))
    if(gate.name === "NOT") not.push(new NOT(gate.id, gate.name))
    if(gate.name === "XOR") xor.push(new XOR(gate.id, gate.name))
  })

  data.outputs.forEach(o => {
    output.push(new OUTPUT(o.id))
  })

  return { input, and, or, not, xor, output} 
}

function findGateWithId(gates, id) {
  let output
  function callback(gate) {
    if(gate.id === id) {
      output = gate
    }
  }
  
  gates.input.forEach(callback)
  gates.and.forEach(callback)
  gates.or.forEach(callback)
  gates.not.forEach(callback)
  gates.xor.forEach(callback)
  gates.output.forEach(callback)

  return output
}

function generateLogicTree(gates, connections) {
  tree = gates.output
  
  connections.forEach(connection => {
    source = findGateWithId(gates, connection.from)
    target = findGateWithId(gates, connection.to)
    
    if(target.input1 === null) {
      target.input1 = source
    } else {
      target.input2 = source
    }
  })
  
  return tree
}

function setChannels(level, gate) {
  if(!gate.isOutput) {
    if(gate.outputChannel === -1) {
      gate.outputChannel = level.nextFreeChannel
      level.channelsUsed[gate.outputChannel] = gate.outputChannel
    }
  }
  if(gate.input1 != null) {
    setChannels(level, gate.input1)
    gate.inputChannel1 = gate.input1.outputChannel
  } 
  if(gate.input2 != null)  {
    setChannels(level, gate.input2)
    gate.inputChannel2 = gate.input2.outputChannel
  }
}

function generateGates(level, sectionId, gate) {
  addGate(level, sectionId, gate)

  if(gate.input1 != null) generateGates(level, sectionId, gate.input1)
  if(gate.input2 != null) generateGates(level, sectionId, gate.input2)
}

function addGate(level, sectionId, gate) {
  if(gate.name === "AND" && !gate.added) {
    level.addAndGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    gate.added = true
  }
  if(gate.name === "OR" && !gate.added) {
    level.addOrGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    gate.added = true
  }
  if(gate.name === "NOT" && !gate.added) {
    level.addNotGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, OutChannel1: gate.outputChannel })
    gate.added = true
  }
  if(gate.name === "XOR" && !gate.added) {
    level.addXorGate({ sectionId, x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    gate.added = true
  }
}

function writeTreeToFile(tree, file) {
  let json = JSON.stringify(tree, null, 2)

  fs.writeFileSync(file, json, 'utf8', (err) => {
    if(err) throw err
  }); 
  console.log("file write successful")
}

function addGatesFromFile({ level, sectionId, filePath }) {
  const json = readFile(filePath)
  const data = reduce(json)
  const gates = parse(data)
  const tree = generateLogicTree(gates, data.connections)


  const outputChannels = []
  tree.forEach(output => {
    setChannels(level, output)
    generateGates(level, sectionId, output)
    outputChannels.push(output.inputChannel1)
  })

  const inputChannels = []
  gates.input.forEach(input => {
    inputChannels.push(input.outputChannel)
  })

  return {
    input: inputChannels,
    output: outputChannels
  }
}



module.exports = { addGatesFromFile }
