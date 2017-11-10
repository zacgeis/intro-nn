# TODO include 3d graph and explain gradient with two dimensions and what the deriv is intutively
# TODO add validations around dimensions

require_relative "utils"

module Neural
  module Activations
    class Base
      def self.apply(x)
        raise NotImplementedError
      end

      def self.deriv(x)
        raise NotImplementedError
      end
    end

    class Sigmoid < Base
      def self.apply(x)
        1 / (1 + Math.exp(-x))
      end

      def self.deriv(x)
        apply(x) * (1 - apply(x))
      end
    end

    class Relu < Base
      def self.apply(x)
        if x > 0
          x
        else
          0
        end
      end

      def self.deriv(x)
        if x > 0
          1
        else
          0
        end
      end
    end
  end

  module Cost
    class Base
      def self.cost(target, actual)
        raise NotImplementedError
      end

      def self.gradient(target, actual)
        raise NotImplementedError
      end
    end

    class MeanSquaredError
      def self.cost(target, actual)
        mat = Utils::Matrix.element_sub(target, actual)
        mat = Utils::Matrix.element_mul(mat, mat)
        Utils::Matrix.sum(mat) * 0.5
      end

      def self.gradient(target, actual)
        Utils::Matrix.element_sub(target, actual)
      end
    end
  end

  class Layer
    attr_accessor :weights, :activation, :index
    def initialize(index, weights, activation)
      @index = index
      @weights = weights
      @activation = activation
    end
  end

  class Network
    def initialize(cost_function)
      @cost_function = cost_function
      @index_count = 0
      @layers = []
    end

    def add_layer(weights, activation)
      @layers << Layer.new(@index_count, weights, activation)
      @index_count += 1
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
      debug = opts[:debug] || false
      validate = opts[:validate] || false

      # check that targets and inputs are the same size
      # todo, write a multi layer as a basic example too

      start_time = Time.now
      epochs.times.each do |epoch|
        batches = inputs.length.times.to_a.shuffle
        cost = nil
        loop do
          batch = batches.pop(batch_size)
          break if batch.empty?
          input_batch = batch.map { |i| inputs[i] }
          target_batch = batch.map { |i| targets[i] }

          if debug
            puts "Input:"
            Utils::Matrix.display(input_batch)
            puts "Target:"
            Utils::Matrix.display(target_batch)
            puts "--Forward--"
          end

          hidden_sums = []
          hidden_results = []
          @layers.each do |layer|
            hidden_sums << Utils::Matrix.multiply(hidden_results.last || input_batch, layer.weights)
            hidden_results << Utils::Matrix.map_one(hidden_sums.last) do |val|
              layer.activation.apply(val)
            end
            if debug
              puts "(Layer #{layer.index}) Sums:"
              Utils::Matrix.display(hidden_sums.last)
              puts "(Layer #{layer.index}) Results:"
              Utils::Matrix.display(hidden_results.last)
            end
          end

          if debug
            puts "--Backwards--"
          end

          cost = @cost_function.cost(target_batch, hidden_results.last)
          puts "Epoch: #{epoch}, Cost: #{cost}"

          next if validate

          error_gradient = @cost_function.gradient(target_batch, hidden_results.pop)

          weight_updates = []
          @layers.reverse.each do |layer|
            if debug
              puts "(Layer #{layer.index}) Error Gradient:"
              Utils::Matrix.display(error_gradient)
            end
            layer_gradient = Utils::Matrix.map_one(hidden_sums.pop) do |val|
              layer.activation.deriv(val)
            end
            if debug
              puts "(Layer #{layer.index}) Layer Gradient:"
              Utils::Matrix.display(layer_gradient)
            end
            delta = Utils::Matrix.element_mul(layer_gradient, error_gradient)
            delta = Utils::Matrix.scalar(learning_rate, delta)
            if debug
              puts "(Layer #{layer.index}) Delta:"
              Utils::Matrix.display(delta)
            end
            weight_updates << Utils::Matrix.multiply(Utils::Matrix.transpose(hidden_results.pop || input_batch), delta)
            if debug
              puts "(Layer #{layer.index}) Weight Update:"
              Utils::Matrix.display(weight_updates.last)
            end
            error_gradient = Utils::Matrix.multiply(delta, Utils::Matrix.transpose(layer.weights))
          end

          # TODO focus on having a neural network explain why it did something

          @layers.each do |layer|
            weight_update = weight_updates.pop
            layer.weights = Utils::Matrix.element_add(weight_update, layer.weights)
            if debug
              puts "(Layer #{layer.index}) Weights"
              Utils::Matrix.display(layer.weights)
            end
          end

          if debug
            puts "\n\n"
          end
        end
      end
      puts "Training finished in #{Time.now - start_time}s"
    end
  end
end
