function generateId(len) {
  let numbers = "0123456789";
  let lowercase = "abcdefghijklmnopqrstuvwxyz";
  let uppercase = lowercase.toUpperCase();

  let items = numbers + lowercase + uppercase;
  let result = "";
  for(let i = 0; i < len; i++) {
    result += items[Math.floor(Math.random() * items.length)];
  }
  return result;
}

function shuffleIndexes(len) {
  let result = [];
  for(let i = 0; i < len; i++) {
    result.push(i);
  }
  for(let i = len - 1; i >= 0; i--) {
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

class Solver {
  constructor(resultNodes, initialValues) {
    let sorted = [];
    let visited = {};
    for(let i = 0; i < resultNodes.length; i++) {
      let node = resultNodes[i];
      this.sortNodes(node, sorted, visited);
    }
    this.sortedNodes = sorted;

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

  sortNodes(node, sorted, visited) {
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

  let solver = new Solver([add], {
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

function xorExample() {
  let i1 = new Constant({id: "i1"});
  let i2 = new Constant({id: "i2"});

  let i1h1 = new Variable({id: "i1->h1"});
  let i2h1 = new Variable({id: "i2->h1"});
  let i1h2 = new Variable({id: "i1->h2"});
  let i2h2 = new Variable({id: "i2->h2"});
  let h2o1 = new Variable({id: "h2->o1"});
  let h1o1 = new Variable({id: "h1->o1"});

  let h1i = new Add([new Multiply([i1, i1h1]), new Multiply([i2, i2h1])]);
  let h1o = new Sigmoid([h1i]);

  let h2i = new Add([new Multiply([i1, i1h2]), new Multiply([i2, i2h2])]);
  let h2o = new Sigmoid([h2i]);

  let o1i = new Add([new Multiply([h1o, h1o1]), new Multiply([h2o, h2o1])]);
  let o1o = new Sigmoid([o1i]);

  let randomInit = () => { return Math.random() - 0.5 };

  let solver = new Solver([o1o], {
    "i1->h1": randomInit(),
    "i2->h1": randomInit(),
    "i1->h2": randomInit(),
    "i2->h2": randomInit(),
    "h2->o1": randomInit(),
    "h1->o1": randomInit(),
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
    let indexes = shuffleIndexes(data.length);
    for(let j = 0; j < data.length; j++) {
      let randomIndex = indexes[j];
      solver.solve({"i1": data[randomIndex][0], "i2": data[randomIndex][1]});
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

let numberData = (function() {
  let zeroIn = [
    1, 1, 1,
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
    1, 1, 1,
  ];
  let zeroOut = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ];

  let oneIn = [
    0, 1, 0,
    1, 1, 0,
    0, 1, 0,
    0, 1, 0,
    1, 1, 1,
  ];
  let oneOut = [
    0, 1, 0, 0, 0, 0, 0, 0, 0, 0
  ];

  let twoIn = [
    1, 1, 1,
    0, 0, 1,
    1, 1, 1,
    1, 0, 0,
    1, 1, 1,
  ];
  let twoOut = [
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0
  ];

  let threeIn = [
    1, 1, 1,
    0, 0, 1,
    1, 1, 1,
    0, 0, 1,
    1, 1, 1,
  ];
  let threeOut = [
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0
  ];

  let fourIn = [
    1, 0, 1,
    1, 0, 1,
    1, 1, 1,
    0, 0, 1,
    0, 0, 1,
  ];
  let fourOut = [
    0, 0, 0, 0, 1, 0, 0, 0, 0, 0
  ];

  let fiveIn = [
    1, 1, 1,
    1, 0, 0,
    1, 1, 1,
    0, 0, 1,
    1, 1, 1,
  ];
  let fiveOut = [
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0
  ];

  let sixIn = [
    1, 0, 0,
    1, 0, 0,
    1, 1, 1,
    1, 0, 1,
    1, 1, 1,
  ];
  let sixOut = [
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0
  ];

  let sevenIn = [
    1, 1, 1,
    0, 0, 1,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  ];
  let sevenOut = [
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0
  ];

  let eightIn = [
    1, 1, 1,
    1, 0, 1,
    1, 1, 1,
    1, 0, 1,
    1, 1, 1,
  ];
  let eightOut = [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0
  ];

  let nineIn = [
    1, 1, 1,
    1, 0, 1,
    1, 1, 1,
    0, 0, 1,
    0, 0, 1,
  ];
  let nineOut = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1
  ];

  return [
    [oneIn, oneOut],
    [twoIn, twoOut],
    [threeIn, threeOut],
    [fourIn, fourOut],
    [fiveIn, fiveOut],
    [sixIn, sixOut],
    [sevenIn, sevenOut],
    [eightIn, eightOut],
    [nineIn, nineOut],
  ];
}());

function numberExample() {
  let inputNodeCount = 15;
  let hiddenNodeCount = 12;
  let outputNodeCount = 10;

  let inputNodes = [];
  for(let i = 0; i < inputNodeCount; i++) {
    inputNodes.push(new Constant({id: "i" + i}));
  }

  let allWeights = [];

  let hiddenOutputs = [];
  for(let i = 0; i < hiddenNodeCount; i++) {
    let hiddenInputs = [];
    for(let j = 0; j < inputNodeCount; j++) {
      let hiddenWeight = new Variable({id: "i" + j + "->h" + i});
      allWeights.push(hiddenWeight);
      hiddenInputs.push(new Multiply([inputNodes[j], hiddenWeight]));
    }
    hiddenOutputs.push(new Sigmoid([new Add(hiddenInputs)]));
  }

  let outputOutputs = [];
  for(let i = 0; i < outputNodeCount; i++) {
    let outputInputs = [];
    for(let j = 0; j < hiddenNodeCount; j++) {
      let hiddenWeight = new Variable({id: "h" + j + "->o" + i});
      allWeights.push(hiddenWeight);
      outputInputs.push(new Multiply([hiddenOutputs[j], hiddenWeight]));
    }
    outputOutputs.push(new Sigmoid([new Add(outputInputs)]));
  }

  let randomInit = () => { return Math.random() - 0.5 };

  let initialValues = {};
  for(let i = 0; i < allWeights.length; i++) {
    initialValues[allWeights[i].id] = randomInit();
  }

  let solver = new Solver(outputOutputs, initialValues);

  let learningRate = 0.01;
  let iterations = 1000 * 1000;
  for(let i = 0; i < iterations; i++) {
    let indexes = shuffleIndexes(numberData.length);
    for(let j = 0; j < numberData.length; j++) {
      let randomIndex = indexes[j];

      let inputs = numberData[randomIndex][0];
      let constantValues = {};
      for(let k = 0; k < inputNodes.length; k++) {
        let inputNode = inputNodes[k];
        constantValues[inputNode.id] = inputs[k];
      }

      solver.solve(constantValues);

      let outputValues = [];
      let errorRate = 0;
      let targets = numberData[randomIndex][1];
      let errors = {};
      for(let k = 0; k < outputOutputs.length; k++) {
        let outputNode = outputOutputs[k];
        let result = solver.idToState[outputNode.id].value;
        errorRate += result;
        outputValues.push(result);
        errors[outputNode.id] = targets[k] - result;
      }
      errorRate = errorRate / outputValues.length;
      console.log(i, errorRate);
      solver.fit(errors, learningRate);
    }
  }
  console.log(solver.graphToString());
}
