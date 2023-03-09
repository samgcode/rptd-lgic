class Chip {
  constructor(chipData) {
    this.name = chipData.name
    this.id = chipData.id
    this.inputPins = chipData.inputPins
    this.outputPins = chipData.outputPins
    this.children = chipData.children
    this.added = false
  }
}

class BaseChip {
  constructor(chipData) {
    this.name = chipData.name
    this.id = chipData.id
    this.inputPins = chipData.inputPins
    this.outputPins = chipData.outputPins
    this.inputChannels = []
    this.outputChannels = []
    this.added = false
  }
}


module.exports = { Chip, BaseChip }
