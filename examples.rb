require_relative "utils"
require_relative "neural"

def xor_one_layer_using_network
  inputs = [
    [0,0,1],
    [0,1,1],
    [1,0,1],
    [1,1,1],
  ]

  # todo update all target to targets
  targets = [
    [0],
    [0],
    [1],
    [1],
  ]

  weights = Utils::Matrix.rands(3, 1)
  network = Neural::Network.new
  network.add_layer(weights, Utils::Activations::Sigmoid)
  network.train(inputs, targets, epochs: 10_000, batch_size: 4, learning_rate: 0.1)
  puts "test"
  network.forward(inputs)
end

# TODO start presentation with what we are going to cover
# TODO: add a double layer network as an example
# Update terminology to use
# TODO: add note that ideally the batch would be the entire training set, but for computation reasons that usually doesn't work

def xor_two_layers_using_network
  inputs = [
    [0,0],
    [0,1],
    [1,0],
    [1,1],
  ]

  # todo update all target to targets
  # update to use or (highlight this)
  targets = [
    [0],
    [1],
    [1],
    [0],
  ]

  network = Neural::Network.new(Neural::Cost::MeanSquaredError)

  # won't work
  # network.add_layer(Utils::Matrix.rands(3, 1), Utils::Activations::Sigmoid)

  network.add_layer(Utils::Matrix.rands(3, 4), Neural::Activations::Sigmoid)
  network.add_layer(Utils::Matrix.rands(4, 1), Neural::Activations::Sigmoid)

  network.train(inputs, targets, epochs: 20_000, batch_size: 4, learning_rate: 0.2, debug: false, validate: false)
  puts "\n\n"
  puts "Input"
  Utils::Matrix.display(inputs)
  puts "Output"
  Utils::Matrix.display(network.forward(inputs))
end

xor_two_layers_using_network

def xor_single_without_network
  # If this is all zeros, it will cause the network not to learn.
  # Needs at least a one to let the back prop take into account the gradient
  inputs = [
    [0,0,1],
    [0,1,1],
    [1,0,1],
    [1,1,1],
  ]

  target = [
    [0],
    [0],
    [1],
    [1],
  ]

  learning_rate = 0.1
  weights = Utils::Matrix.rands(3, 1)

  2000.times.each do |iter|
    hidden_sum = Utils::Matrix.multiply(inputs, weights)
    hidden_result = Utils::Matrix.map_one(hidden_sum) do |val|
      Neural::Activations::Sigmoid.apply(val)
    end

    error_gradient = Utils::Matrix.element_sub(target, hidden_result)

    gradients = Utils::Matrix.map_one(hidden_sum) do |val|
      Neural::Activations::Sigmoid.deriv(val)
    end

    delta = Utils::Matrix.scalar(learning_rate, Utils::Matrix.element_mul(gradients, error_gradient))
    weight_updates = Utils::Matrix.multiply(Utils::Matrix.transpose(inputs), delta)

    weights = Utils::Matrix.element_add(weight_updates, weights)
  end

  hidden_sum = Utils::Matrix.multiply(inputs, weights)
  hidden_result = Utils::Matrix.map_one(hidden_sum) do |val|
    Neural::Activations::Sigmoid.apply(val)
  end
  puts "Targets"
  Utils::Matrix.display(target)
  puts "Output"
  Utils::Matrix.display(hidden_result)
end

# xor_single_without_network
