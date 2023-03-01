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
  if(!this.isOutput) {
    gate.outputChannel = level.nextFreeChannel
    level.channelsUsed[gate.outputChannel] = gate.outputChannel
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

function generateGates(level, gate) {
    if(gate.name === "AND") level.addAndGate({ x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    if(gate.name === "OR") level.addOrGate({ x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })
    if(gate.name === "NOT") level.addNotGate({ x:0, y: 0, InChannel1: gate.inputChannel1, OutChannel1: gate.outputChannel })
    if(gate.name === "XOR") level.addXorGate({ x:0, y: 0, InChannel1: gate.inputChannel1, InChannel2: gate.inputChannel2, OutChannel1: gate.outputChannel })

  if(gate.input1 != null) generateGates(level, gate.input1)
  if(gate.input2 != null) generateGates(level, gate.input2)
}

function addGatesFromFile(level, pathToFile) {
  const json = readFile(pathToFile)
  const data = reduce(json)
  const gates = parse(data)
  const tree = generateLogicTree(gates, data.connections)

  const outputChannels = []
  tree.forEach(head => {
    setChannels(level, head)
    generateGates(level, head)
    outputChannels.push(head.inputChannel1)
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
