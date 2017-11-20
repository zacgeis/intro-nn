require "securerandom"

class Node
  attr_accessor :in_nodes, :out_nodes, :id

  def initialize(opts = {})
    @in_nodes = []
    @out_nodes = []
    @id = opts[:id] || "#{self.class.name}-#{SecureRandom.uuid[0..7]}"
  end

  def resolve(context)
    raise NotImplementedError
  end

  def backward(context)
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

  def resolve(context)
    product = @in_nodes[0].resolve(context) * @in_nodes[1].resolve(context)
    context[@id] = product
  end

  def backward(context)
    raise NotImplementedError
  end
end

class Add < Node
  def initialize(in1, in2, opts = {})
    super(opts)
    @in_nodes = [in1, in2]
    in1.out_nodes << self
    in2.out_nodes << self
  end

  def resolve(context)
    sum = @in_nodes[0].resolve(context) + @in_nodes[1].resolve(context)
    context[@id] = sum
  end

  def backward(context)
    raise NotImplementedError
  end
end

class Value < Node
  def initialize(opts = {})
    super(opts)
  end

  def resolve(context)
    context[@id]
  end

  def backward(context)
    raise NotImplementedError
  end
end


x = Value.new(id: "x", static: true)
m = Value.new(id: "m")
b = Value.new(id: "b")
graph = Add.new(Multiply.new(m, x), b)

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

context = {
  "x" => 2.0,
  "m" => 1.0,
  "b" => 1.0,
}

r = graph.resolve(context)
puts context
puts r
