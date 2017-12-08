class Player
  attr_accessor :sym

  def initialize(sym)
    @sym = sym
  end

  def play(board)
    raise NotImplementedError
  end

  def name
    raise NotImplementedError
  end
end

class RandomPlayer < Player
  name = 'test'

  def play(board)
    moves = Game.valid_moves(board, sym)
    moves[rand(moves.length)]
  end

  def name
    "random"
  end
end

module Game
  def self.empty_board
    [
      ["_", "_", "_"],
      ["_", "_", "_"],
      ["_", "_", "_"],
    ]
  end

  def self.check_for_win(board)
    return true if check_columns(board)
    return true if check_diagnols(board) # check spelling
    return true if check_rows(board)
    false
  end

  def self.check_columns(board)
    (0..2).each do |col|
      col_vals = (0..2).map do |row|
        board[row][col]
      end
      return true if check_arr(col_vals)
    end
    false
  end

  def self.check_diagnols(board)
    dia1 = (0..2).map do |pos|
      board[pos][pos]
    end
    dia2 = (0..2).map do |pos|
      board[2 - pos][pos]
    end
    return true if check_arr(dia1)
    return true if check_arr(dia2)
    false
  end

  def self.check_rows(board)
    (0..2).each do |row|
      row_vals = (0..2).map do |col|
        board[row][col]
      end
      return true if check_arr(row_vals)
    end
    false
  end

  def self.check_arr(arr)
    arr_uniq = arr.uniq
    if arr_uniq.length == 1 && arr_uniq[0] != "_"
      return true
    end
  end

  def self.apply_move(board, move)
    if board[move[0]][move[1]] == "_"
      board[move[0]][move[1]] = move[2]
    else
      raise "invalid move"
    end
  end

  def self.valid_moves(board, player)
    moves = []
    (0..2).each do |row|
      (0..2).each do |col|
        if board[row][col] == "_"
          moves << [row, col, player]
        end
      end
    end
    moves
  end

  def self.draw_board(board)
    puts "-" * 5
    (0..2).each do |row|
      puts board[row].join(" ")
    end
  end

  def self.serialize_board_and_move(board, move)
    board[0] + board[1] + board[2] + move
  end

  def self.play_random(player_x, player_o)
    states = []
    game_board = empty_board

    player = player_x
    if rand(2) == 1
      player = player_o
    end

    result = nil
    loop do
      moves = valid_moves(game_board, player)
      if moves.length == 0
        result = "D"
        break
      end
      move = player.play(game_board)
      states << game_board.flatten + move
      apply_move(game_board, move)
      if check_for_win(game_board)
        result = player.sym
        break
      end
      if player.sym == player_x.sym
        player = player_o
      else
        player = player_x
      end
    end
    states.map do |state|
      state + [result]
    end
  end

  def self.generate_data(filename, count, player_x, player_o)
    tally = {
      "X" => 0.0,
      "O" => 0.0,
      "D" => 0.0,
    }
    File.open(filename, "w") do |file|
      count.times.each do |i|
        states = play_random(player_x, player_o)
        tally[states.first.last] += 1
        states.each do |state|
          file.write(state.join(""))
          file.write("\n")
        end
      end
    end
    puts "#{count} games played."
    puts "X (#{player_x.name}) Won #{tally["X"]} (#{(tally["X"] / count) * 100}%)"
    puts "O (#{player_o.name}) Won #{tally["O"]} (#{(tally["O"] / count) * 100}%)"
    puts "Draws #{tally["D"]} (#{(tally["D"] / count) * 100}%)"
    puts "games saved to #{filename}."
  end
end

if __FILE__ == $0
  player_x = RandomPlayer.new("X")
  player_o = RandomPlayer.new("O")
  Game.generate_data(ARGV[0], 100_000, player_x, player_o)
end

# have it learn the rules just by looking at games played. don"t give it any idea of valid rules. it will know whos turn it is.
# not human like thinking. it's able to play 100K games in under a second and learn from them. it can't take an example or two and simluate it interanlly.
# differentiable graph
# neural networks build an internal representation
# show matrix and graph image together for why dot producrts are important
# computational graph modeling

# TODO: look at paper sheet in yellow notepad
# Try three tictactoe networks one with board evaluation, one with a network to pick which spot, one that encodes the rules and winning or losing
# Text generation using multiple characters inputed and the output character shifted
