# TODO include 3d graph and explain gradient with two dimensions and what the deriv is intutively
# TODO add validations around dimensions

require_relative "utils"

module Neural
  class Layer
    attr_accessor :weights, :activation
    def initialize(weights, activation)
      @weights = weights
      @activation = activation
    end
  end

  class Network
    def initialize
      @layers = []
    end

    def add_layer(weights, activation)
      @layers << Layer.new(weights, activation)
    end

    def forward(input)
      hidden_input = input
      hidden_result = nil
      @layers.each do |layer|
        hidden_sum = Utils::Matrix.multiply(hidden_input, layer.weights)
        hidden_result = Utils::Matrix.map_one(hidden_sum) do |val|
          layer.activation.apply(val)
        end
        hidden_input = hidden_result
      end
      hidden_result
    end

    def train(inputs, targets, opts)
      learning_rate = opts[:learning_rate] || 0.1
      batch_size = opts[:batch_size] || 100
      epochs = opts[:epochs] || 1

      # check that targets and inputs are the same size
      # todo, write a multi layer as a basic example too

      epochs.times.each do |epoch|
        batches = inputs.length.times.to_a.shuffle
        loop do
          batch = batches.pop(batch_size)
          break if batch.empty?
          input_batch = batch.map { |i| inputs[i] }
          target_batch = batch.map { |i| targets[i] }

          hidden_sums = []
          hidden_results = []
          @layers.each do |layer|
            hidden_sums << Utils::Matrix.multiply(hidden_results.last || input_batch, layer.weights)
            hidden_results << Utils::Matrix.map_one(hidden_sums.last) do |val|
              layer.activation.apply(val)
            end
          end

          error = Utils::Matrix.element_sub(target_batch, hidden_results.pop)

          weight_updates = []
          @layers.reverse.each do |layer|
            gradients = Utils::Matrix.map_one(hidden_sums.pop) do |val|
              layer.activation.deriv(val)
            end
            delta = Utils::Matrix.element_mul(gradients, error)
            delta = Utils::Matrix.scalar(learning_rate, delta)
            weight_updates << Utils::Matrix.multiply(Utils::Matrix.transpose(hidden_results.pop || input_batch), delta)
            error = Utils::Matrix.multiply(delta, Utils::Matrix.transpose(layer.weights))
          end

          @layers.reverse.each do |layer|
            weight_update = weight_updates.pop
            layer.weights = Utils::Matrix.element_add(weight_update, layer.weights)
          end
        end
      end
    end
  end

  def self.sample
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
    network = Network.new
    network.add_layer(weights, Utils::Activations::Sigmoid)
    network.train(inputs, targets, epochs: 10_000, batch_size: 4, learning_rate: 0.1)
    puts "test"
    network.forward(inputs)
  end
  # TODO start presentation with what we are going to cover

  def self.basic
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
        Utils::Activations::Sigmoid.apply(val)
      end

			error = Utils::Matrix.element_sub(target, hidden_result)
      puts error

			gradients = Utils::Matrix.map_one(hidden_sum) do |val|
        Utils::Activations::Sigmoid.deriv(val)
      end

			delta = Utils::Matrix.scalar(learning_rate, Utils::Matrix.element_mul(gradients, error))
			weight_updates = Utils::Matrix.multiply(Utils::Matrix.transpose(inputs), delta)

			weights = Utils::Matrix.element_add(weight_updates, weights)
    end
  end
end

puts Neural.sample
