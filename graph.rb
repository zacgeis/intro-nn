require "securerandom"

class Node
  attr_accessor :in_nodes, :out_nodes, :id

  def initialize(opts = {})
    @in_nodes = []
    @out_nodes = []
    @id = opts[:id] || "#{self.class.name}-#{SecureRandom.uuid[0..7]}"
  end

  def resolve(*args)
    raise NotImplementedError
  end

  def backward(*args)
    raise NotImplementedError
  end
end

class Multiply < Node
  def initialize(in1, in2, opts = {})
    super(opts)
    @in_nodes = [in1, in2]
    in1.out_nodes << self
    in2.out_nodes << self
  end

  def resolve(x, y)
    return x * y
  end

  def backward(x, y)
    return [y, x]
  end
end

class Add < Node
  def initialize(in1, in2, opts = {})
    super(opts)
    @in_nodes = [in1, in2]
    in1.out_nodes << self
    in2.out_nodes << self
  end

  def resolve(x, y)
    return x + y
  end

  def backward(x, y)
    return [1, 1]
  end
end

class Value < Node
  def initialize(opts = {})
    super(opts)
  end

  def resolve
    raise NotImplementedError
  end

  def backward
    raise NotImplementedError
  end
end

class Solver
  attr_accessor :sorted_nodes

  def initialize(result_node, initial_context)
    @result_node = result_node
    @context = {}.merge(initial_context)
    @sort_visited = {}
    @sorted_nodes = []
    sort_nodes(@result_node)
  end

  def sort_nodes(node)
    if @sort_visited[node.id] == 1
      raise "equation graph is not a dag"
    end
    if @sort_visited[node.id] == 2
      return
    end
    @sort_visited[node.id] = 1
    node.in_nodes.each do |child_node|
      sort_nodes(child_node)
    end
    @sort_visited[node.id] = 2
    @sorted_nodes.push(node)
  end

  def resolve
    last_value = nil
    @sorted_nodes.each do |node|
      if node.is_a?(Value)
        # Wrap in result
        raise "'#{node.id}' value not found" if @context[node.id].nil?
      else
        inputs = node.in_nodes.map { |in_node| @context[in_node.id] }
        result = node.resolve(*inputs)
        @context[node.id] = result
      end
      last_value = @context[node.id]
    end
    last_value
  end
end

# Default deriv to 0
class Result
  attr_accessor :value, :derivative
end

x = Value.new(id: "x", static: true)
m = Value.new(id: "m")
b = Value.new(id: "b")
graph = Add.new(Multiply.new(m, x), b)

context = {
  "x" => 2.0,
  "m" => 1.0,
  "b" => 1.0,
}

solver = Solver.new(graph, context)
puts solver.sorted_nodes
puts solver.resolve

# TODO:
# Keep all of the state in context and don't let it bleed to the actual network
# Move everything to use two dimensional matricies
# Possibly change out id for id
# maybe introduce solver or graph executer
# topological sort (might not work with RNN nodes that interconnect
# You could probably add IF nodes to this and basically make it a language.
# With better context scoping
# raise exception if they can't be found in the context
# Do we need to be careful about going over nodes twice
# Make it flexible enough to handle both single values and matrix values.
# Value nodes should know how to update themselves possibly?
# Try to keep the state managed as much as possible with clear boundaries between resolsibilties
# https://en.wikipedia.org/wiki/Differential_of_a_function#Differentials_in_several_variables
# We do plus in backprop instead of multiplication to account for total derivatives and not just partials. (nodes that have multiple outputs)
# http://karpathy.github.io/neuralnets/
# https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/
# https://www.wolframalpha.com/input/?i=derive+xy
# https://www.wolframalpha.com/input/?i=derive+(axyz)(bxyz)
# https://en.wikipedia.org/wiki/Backpropagation
# All just a differentialable graph
# learning as an optimization problem.
# Move this all into crystal
# Have the deriv chain start with 1.0. tugging on the network with 1.0
# Move all of these notes to the doc.

# MNIST dataset
# Neural network as machine emulator with attached memory to read from
# Neural networks can model any logic gates.
# neural networks work much better on natural data that don't have percise answers as requirements
# Rnns are turning complete
# https://stats.stackexchange.com/questions/245737/mathematical-justification-for-using-recurrent-neural-networks-over-feed-forward
# use more relu activations
# http://yann.lecun.com/exdb/mnist/
# plot tanh(x + y + z)
# graph tanh(x+y) with various weights to get an idea of how it changes.
# game of life should learn to generalize around neighbor weights and not need to see every example
# programming by example
# have a ui for giving examples on the rules of the game of life.
# configure an entire set of rules and have the network learn.
# have a list of different examples and allow modifying them.
# add note to learn game of life from the neural network
# https://www.wolframalpha.com/input/?i=derive+(axy)(bxy)

# r = graph.resolve(context)
# puts context
# puts r
