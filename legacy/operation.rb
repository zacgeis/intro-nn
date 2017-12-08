class Operation
  def apply(x)
    raise NotImplementedError
  end

  def deriv(x)
    raise NotImplementedError
  end
end

class Input < Operation
  def initialize(x)
  end
end

class Square < Operation
  def initialize(input_operation)
    @input_operation = input_operation
  end

  def eval
    @value = @input_operation.value ** 2
    @deriv = 2 * @input_operation.value
  end
end

operation = Square.new(Square.new(Input.new(2)))
