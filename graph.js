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

// Ensure that we don't have overlapping ids
class Solver {
  constructor(result_node, context) {
    this.result_node = result_node;
    this.context = context;
    this.sortedNodes = this.sortNodes(this.result_node);
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
    console.log(this.graphToString());

    let last_value = null;
    for(let i = 0; i < this.sortedNodes.length; i++) {
      let node = this.sortedNodes[i];
      if((node instanceof Value) || (node instanceof Constant)) {
        if(!this.context.hasOwnProperty(node.id)) {
          throw new Error("'" + node.id + "' value not found in context");
        } else {

        }
      }
    }
  }

  graphToString() {
    let output = "";
    for(let i = 0; i < this.sortedNodes.length; i++) {
      let node = this.sortedNodes[i];
      let inputs = node.in_nodes.map((in_node) => in_node.toString()).join(", ");
      output += node.toString();
      if(inputs.length > 0) {
        output += " <- " + inputs;
      }
      output += "\n";
    }
    return output;
  }
}

let x = new Constant({id: "x"});
let y = new Variable({id: "y"});
let add = new Add(x, y);

let solver = new Solver(add, {"x": 1, "y": 2});
solver.solve();
