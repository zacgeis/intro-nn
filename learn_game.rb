require_relative "utils"
require_relative "neural"

def encode_player(player)
  if player == "X"
    [1, 0]
  elsif player == "O"
    [0, 1]
  else
    [0, 0]
  end
end

def encode_line(line)
  encoded_input = []
  encoded_target = []

  encoded_board = []
  is_first_move = true
  (0...9).each do |i|
    c = line[i]
    is_first_move = false if c != "_"
    encoded_board += encode_player(c)
  end

  next_move_row = line[9].to_i
  next_move_col = line[10].to_i
  encoded_next_move = [0] * 9
  encoded_next_move[(next_move_row * 3) + next_move_col] = 1
  encoded_next_move += encode_player(line[11])

  game_result = line[12]
  if is_first_move
    game_result = ""
  end
  encoded_result = encode_player(game_result)

  encoded_input += encoded_board
  encoded_target += encoded_result

  [encoded_input, encoded_target]
end

inputs = []
targets = []
count = 0
File.open("data/random_play.txt", "r").each do |line|
  # if count > 100
  #   break
  # end
  encoded_input, encoded_target = encode_line(line)
  inputs << encoded_input
  targets << encoded_target
  count += 1
end

network = Neural::Network.new(Neural::Cost::MeanSquaredError)

network.add_layer(Utils::Matrix.rands(18, 12), Neural::Activations::Sigmoid)
network.add_layer(Utils::Matrix.rands(12, 9), Neural::Activations::Sigmoid)
network.add_layer(Utils::Matrix.rands(9, 2), Neural::Activations::Sigmoid)

network.train(inputs, targets, epochs: 20, batch_size: 50, learning_rate: 0.1, debug: false, validate: false)

puts "\n\n"
test_input, test_target = encode_line("XXOOX____21XX")
test_input = [test_input]
test_target = [test_target]
puts "Input"
Utils::Matrix.display(test_input)
puts "Target"
Utils::Matrix.display(test_target)
puts "Output"
Utils::Matrix.display(network.forward(test_input))
