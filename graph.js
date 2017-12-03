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

function randomIndexes(len) {
  let result = [];
  for(let i = 0; i < len; i++) {
    result.push(i);
  }
  for(let i = len - 1; i <= 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let t = result[i];
    result[i] = result[j];
    result[j] = t;
  }
  return result;
}

class Node {
  constructor(ins, opts) {
    this.in_nodes = ins;
    this.out_nodes = [];
    this.id = opts.id || generateId(8);
    this.dispaly = "NODE";
    for(let i = 0; i < ins.length; i++) {
      ins[i].out_nodes.push(this);
    }
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
  constructor(ins, opts = {}) {
    super(ins, opts);
    this.type = "ADD";
  }

  forward(vals) {
    // x + y
    let result = 0.0;
    for(let i = 0; i < vals.length; i++) {
      result += vals[i];
    }
    return result;
  }

  backward(vals) {
    // [x, y] -> [1, 1]
    let result = [];
    for(let i = 0; i < vals.length; i++) {
      result.push(1);
    }
    return result;
  }
}

class Multiply extends Node {
  constructor(ins, opts = {}) {
    super(ins, opts);
    this.type = "MUL";
  }

  forward(vals) {
    // x * y
    let result = 1.0;
    for(let i = 0; i < vals.length; i++) {
      result *= vals[i];
    }
    return result;
  }

  backward(vals) {
    // [x, y] -> [y, x]
    let result = [];
    let carry = 1.0;
    for(let i = 0; i < vals.length; i++) {
      result.push(carry);
      carry *= vals[i];
    }
    carry = 1.0;
    for(let i = vals.length - 1; i >= 0; i--) {
      result[i] *= carry;
      carry *= vals[i];
    }
    return result;
  }
}

class Sigmoid extends Node {
  constructor(ins, opts = {}) {
    super(ins, opts);
    this.type = "SIG";
  }

  forward(vals) {
    let x = vals[0];
    return 1 / (1 + Math.exp(-x));
  }

  backward(vals) {
    let x = vals[0];
    return [Math.exp(x) / Math.pow(1 + Math.exp(x), 2)]
  }
}

class Constant extends Node {
  constructor(opt = {}) {
    super([], opt);
    this.type = "CONST";
  }
}

class Variable extends Node {
  constructor(opt = {}) {
    super([], opt);
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

  solve(constants = {}) {
    let sortedNodes = this.sortedNodes;
    let idToState = this.idToState;

    for(let id in constants) {
      idToState[id].value = constants[id];
    }

    for(let i = 0; i < sortedNodes.length; i++) {
      let node = sortedNodes[i];
      if((node instanceof Variable) || (node instanceof Constant)) {
        if(!idToState.hasOwnProperty(node.id)) {
          throw new Error("'" + node.id + "' value not found in idToState");
        }
      } else {
        let inputs = node.in_nodes.map((in_node) => idToState[in_node.id].value);
        let result = node.forward(inputs);
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
      let derivs = node.backward(inputs);
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
  let mul = new Multiply([m, x]);
  let add = new Add([mul, b]);

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
    //console.log(solver.graphToString());
  }
}

function xorExample() {
  let a = new Constant({id: "a"});
  let b = new Constant({id: "b"});

  let aw1 = new Variable({id: "aw1"});
  let bw1 = new Variable({id: "bw1"});
  let aw2 = new Variable({id: "aw2"});
  let bw2 = new Variable({id: "bw2"});
  let o1 = new Variable({id: "o1"});
  let o2 = new Variable({id: "o2"});

  let h1i = new Add([new Multiply([a, aw1]), new Multiply([b, bw1])]);
  let h1o = new Sigmoid([h1i]);

  let h2i = new Add([new Multiply([b, bw2]), new Multiply([a, aw2])]);
  let h2o = new Sigmoid([h2i]);

  let o1i = new Add([new Multiply([h1o, o1]), new Multiply([h2o, o2])]);
  let o1o = new Sigmoid([o1i]);

  let randomInit = () => { return Math.random() - 0.5 };

  // update solver to take multiple root nodes.
  let solver = new Solver(o1o, {
    "aw1": randomInit(),
    "aw2": randomInit(),
    "bw1": randomInit(),
    "bw2": randomInit(),
    "o1": randomInit(),
    "o2": randomInit(),
  });

  let data = [
    [0, 0, 0],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 0],
  ];

  let learningRate = 0.01;
  let iterations = 1000 * 1000;
  for(let i = 0; i < iterations; i++) {
    let indexes = randomIndexes(data.length);
    for(let j = 0; j < data.length; j++) {
      let randomIndex = indexes[j];
      solver.solve({"a": data[randomIndex][0], "b": data[randomIndex][1]});
      let target = data[randomIndex][2];
      let result = solver.idToState[o1o.id].value;
      console.log(data[randomIndex][0] + " ^ " + data[randomIndex][1] + " = " + result);
      let errors = {};
      errors[o1o.id] = target - result;
      solver.fit(errors, learningRate);
    }
  }
  console.log(solver.graphToString());
}

//linearExample();
xorExample();

// Add notes about online vs batch. SGD, mini batch, and full batch.
