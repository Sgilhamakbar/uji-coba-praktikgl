// File: src/state/CircuitStore.js

const CircuitStore = {
  components: [],
  connections: [],
  connectionStart: null,
  componentIdCounter: 0,
  isSimulationActive: false,
  currentEditingComponent: null,
  
  // History untuk Undo/Redo
  undoStack: [],
  redoStack: [],
  maxUndo: 100,
  isUndoRedoOp: false,

  // Multi-select state
  selectedComponents: [],
  isMarqueeSelecting: false,
  marqueeStart: { x: 0, y: 0 },


  // --- Metode Manipulasi Data ---

  addComponent(compData) {
    this.components.push(compData);
  },

  removeComponent(id) {
    this.components = this.components.filter(c => c.id !== id);
    // Hapus koneksi yang terkait dengan komponen ini
    this.connections = this.connections.filter(c => 
      c.source.compId !== id && c.target.compId !== id
    );
  },

  addConnection(connData) {
    this.connections.push(connData);
  },

  removeConnection(srcId, srcPin, tgtId, tgtPin) {
    this.connections = this.connections.filter(c => 
      !(c.source.compId === srcId && c.source.pinIndex === srcPin && 
        c.target.compId === tgtId && c.target.pinIndex === tgtPin)
    );
  },

  clearSelection() {
    this.selectedComponents = [];
  },

  setSelection(idArray) {
    this.selectedComponents = idArray;
  },

  generateId() {
    this.componentIdCounter++;
    return this.componentIdCounter;
  }
};