module Utils
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

  module Matrix
    def self.zeros(rows, cols)
      rows.times.map do |row|
        [0] * cols
      end
    end

    def self.rands(rows, cols)
      mat = zeros(rows, cols)
      rows.times.each do |row|
        cols.times.each do |col|
          mat[row][col] = rand() * 2 - 1
        end
      end
      mat
    end

    def self.multiply(mat1, mat2)
      mat1rows, mat1cols = dimensions(mat1)
      mat2rows, mat2cols = dimensions(mat2)
      result = zeros(mat1rows, mat2cols)
      mat1rows.times.each do |mat1row|
        mat2cols.times.each do |mat2col|
          sum = 0
          mat1cols.times.each do |mat1col|
            sum += mat1[mat1row][mat1col] * mat2[mat1col][mat2col]
          end
          result[mat1row][mat2col] = sum
        end
      end
      result
    end

    def self.transpose(mat)
      rows, cols = dimensions(mat)
      result = zeros(cols, rows)
      rows.times.each do |row|
        cols.times.each do |col|
          result[col][row] = mat[row][col]
        end
      end
      result
    end

    def self.element_add(mat1, mat2)
      map_two(mat1, mat2) do |val1, val2|
        val1 + val2
      end
    end

    def self.element_sub(mat1, mat2)
      map_two(mat1, mat2) do |val1, val2|
        val1 - val2
      end
    end

    def self.element_mul(mat1, mat2)
      map_two(mat1, mat2) do |val1, val2|
        val1 * val2
      end
    end

    def self.scalar(s, mat)
      map_one(mat) do |val|
        val * s
      end
    end

    def self.map_one(mat)
      rows, cols = dimensions(mat)
      result = zeros(rows, cols)
      rows.times.each do |row|
        cols.times.each do |col|
          result[row][col] = yield(mat[row][col])
        end
      end
      result
    end

    def self.map_two(mat1, mat2)
      rows, cols = dimensions(mat1)
      result = zeros(rows, cols)
      rows.times.each do |row|
        cols.times.each do |col|
          result[row][col] = yield(mat1[row][col], mat2[row][col])
        end
      end
      result
    end

    def self.dimensions(mat)
      [mat.length, mat[0].length]
    end
  end
end
