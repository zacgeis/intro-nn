let numbers = "0123456789";
let lowercase = "abcdefghijklmnopqrstuvwxyz";
let uppercase = lowercase.toUpperCase();

function generateId(len) {
  let items = numbers + lowercase + uppercase;
  let result = "";
  for(let i = 0; i < len; i++) {
    result += items[Math.floor(Math.random() * items.length)];
  }
  return result;
}

class Node {
  constructor(opts) {
    this.in_nodes = [];
    this.out_nodes = [];
    this.id = opts.id || generateId(8);
    this.dispaly = "NODE";
  }

  forward() {
    throw new Error("forward is not implemented");
  }

  backward() {
    throw new Error("backward is not implemented");
  }

  toString() {
    return this.type + "[" + this.id + "]";
  }
}

class Add extends Node {
  constructor(in1, in2, opts = {}) {
    super(opts);
    this.type = "ADD";
    this.in_nodes = [in1, in2];
    in1.out_nodes.push(this);
    in2.out_nodes.push(this);
  }

  forward(x, y) {
    return x + y;
  }

  backward(x, y) {
    return [1, 1];
  }
}

class Multiply extends Node {
  constructor(in1, in2, opts = {}) {
    super(opts);
    this.type = "MUL";
    this.in_nodes = [in1, in2];
    in1.out_nodes.push(this);
    in2.out_nodes.push(this);
  }

  forward(x, y) {
    return x * y;
  }

  backward(x, y) {
    return [y, x];
  }
}

class Constant extends Node {
  constructor(opt = {}) {
    super(opt);
    this.type = "CONST";
  }
}

class Variable extends Node {
  constructor(opt = {}) {
    super(opt);
    this.type = "VAR";
  }
}

class State {
  constructor(value = 0.0, deriv = 0.0) {
    this.value = value;
    this.deriv = deriv;
  }
}

// Ensure that we don't have overlapping ids
class Solver {
  constructor(resultNode, initialValues) {
    this.resultNode = resultNode;
    this.sortedNodes = this.sortNodes(this.resultNode);
    this.idToState = this.buildState(this.sortedNodes, initialValues);
  }

  buildState(nodes, initialValues) {
    let stateMap = {};
    for(let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      stateMap[node.id] = new State(initialValues[node.id] || 0.0);
    }
    return stateMap;
  }

  sortNodes(node, sorted = [], visited = {}) {
    if(visited[node.id] === 1) {
      throw new Error("equation graph is not a dag");
    }
    if(visited[node.id] === 2) {
      return;
    }
    visited[node.id] = 1;
    for(let i = 0; i < node.in_nodes.length; i++) {
      let childNode = node.in_nodes[i];
      this.sortNodes(childNode, sorted, visited);
    }
    visited[node.id] = 2;
    sorted.push(node);
    return sorted;
  }

  solve() {
    let sortedNodes = this.sortedNodes;
    let idToState = this.idToState;

    for(let i = 0; i < sortedNodes.length; i++) {
      let node = sortedNodes[i];
      if((node instanceof Variable) || (node instanceof Constant)) {
        if(!idToState.hasOwnProperty(node.id)) {
          throw new Error("'" + node.id + "' value not found in idToState");
        }
      } else {
        let inputs = node.in_nodes.map((in_node) => idToState[in_node.id].value);
        let result = node.forward.apply(node, inputs);
        idToState[node.id].value = result;
      }
      idToState[node.id].deriv = 0.0;
    }

    return idToState;
  }

  fit(idToError, learningRate) {
    let sortedNodes = this.sortedNodes;
    let idToState = this.idToState;

    for(let id in idToError) {
      idToState[id].deriv = idToError[id];
    }

    for(let i = sortedNodes.length - 1; i >= 0; i--) {
      let node = sortedNodes[i];
      if((node instanceof Variable) || (node instanceof Constant)) {
        continue;
      }
      let inputs = node.in_nodes.map((in_node) => idToState[in_node.id].value);
      let derivs = node.backward.apply(node, inputs);
      for(let j = 0; j < node.in_nodes.length; j++) {
        let in_node = node.in_nodes[j];
        let deriv = derivs[j];
        idToState[in_node.id].deriv += idToState[node.id].deriv * deriv;
      }
    }

    for(let i = 0; i < sortedNodes.length; i++) {
      let node = sortedNodes[i];
      if(node instanceof Variable) {
        let state = idToState[node.id];
        state.value += state.deriv * learningRate;
      }
    }

    return idToState;
  }

  graphToString() {
    let sortedNodes = this.sortedNodes;
    let idToState = this.idToState;
    let output = "";
    for(let i = 0; i < sortedNodes.length; i++) {
      let node = sortedNodes[i];
      let inputs = node.in_nodes.map((in_node) => in_node.toString()).join(", ");
      output += node.toString();
      if(inputs.length > 0) {
        output += " <- " + inputs;
      }
      if(idToState !== null) {
        let state = idToState[node.id];
        output += " (value: " + state.value + ", deriv: " + state.deriv + ")";
      }
      output += "\n";
    }
    return output;
  }
}

function linearExample() {
  let x = new Constant({id: "x"});
  let m = new Variable({id: "m"});
  let b = new Variable({id: "b"});
  let mul = new Multiply(m, x);
  let add = new Add(mul, b);

  let solver = new Solver(add, {
    "m": 2.0,
    "b": 3.0,
    "x": 4.0,
  });
  let target = 5;

  for(let i = 0; i < 15; i++) {
    solver.solve();
    let result = solver.idToState[add.id].value;
    console.log(result);
    let errors = {};
    errors[add.id] = target - result;
    solver.fit(errors, 0.01);
    console.log(solver.graphToString());
  }
}

linearExample();

// Add notes about online vs batch. SGD, mini batch, and full batch.
