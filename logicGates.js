class INPUT {
  constructor(id) {
    this.id = id
    this.outputChannel = -1
  }
}

class AND {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.input1 = null
    this.input2 = null
    this.inputChannel1 = -1
    this.inputChannel2 = -1
    this.outputChannel = -1
  }
}

class OR {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.input1 = null
    this.input2 = null
    this.inputChannel1 = -1
    this.inputChannel2 = -1
    this.outputChannel = -1
  }
}

class NOT {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.input1 = null
    this.inputChannel1 = -1
    this.outputChannel = -1
  }
}

class XOR {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.input1 = null
    this.input2 = null
    this.inputChannel1 = -1
    this.inputChannel2 = -1
    this.outputChannel = -1
  }
}

class OUTPUT {
  constructor(id) {
    this.id = id
    this.isOutput = true
    this.input1 = null
    this.inputChannel1 = -1
  }
}


module.exports = { INPUT, AND, OR, NOT, XOR, OUTPUT }
