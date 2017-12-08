(function() {
  let inputCells = document.getElementById("input").getElementsByTagName("td");
  let outputCells = document.getElementById("output").getElementsByTagName("tr")[1].getElementsByTagName("td");
  let testInput = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let testOutput = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  function convertToColor(i) {
    let black = 255 - Math.ceil(i * 255);
    return 'rgb(' + black + ',' + black + ',' + black + ')';
  }
  function setCells(cells, data) {
    for(let i = 0; i < data.length; i++) {
      let color = convertToColor(data[i]);
      cells[i].style.backgroundColor = color;
    }
  }
  setCells(inputCells, testInput);
  setCells(outputCells, testOutput);

  let inputNodeCount = 15;
  let hiddenNodeCount = 12;
  let outputNodeCount = 10;
  let inputNodes = [];
  for(let i = 0; i < inputNodeCount; i++) {
    inputNodes.push(new Constant({id: "i" + i}));
  }
  let allWeights = [];
  let hiddenOutputs = [];
  for(let i = 0; i < hiddenNodeCount; i++) {
    let hiddenInputs = [];
    for(let j = 0; j < inputNodeCount; j++) {
      let hiddenWeight = new Variable({id: "i" + j + "->h" + i});
      allWeights.push(hiddenWeight);
      hiddenInputs.push(new Multiply([inputNodes[j], hiddenWeight]));
    }
    hiddenOutputs.push(new Sigmoid([new Add(hiddenInputs)]));
  }
  let outputOutputs = [];
  for(let i = 0; i < outputNodeCount; i++) {
    let outputInputs = [];
    for(let j = 0; j < hiddenNodeCount; j++) {
      let hiddenWeight = new Variable({id: "h" + j + "->o" + i});
      allWeights.push(hiddenWeight);
      outputInputs.push(new Multiply([hiddenOutputs[j], hiddenWeight]));
    }
    outputOutputs.push(new Sigmoid([new Add(outputInputs)]));
  }
  let randomInit = () => { return Math.random() - 0.5 };
  let initialValues = {};
  for(let i = 0; i < allWeights.length; i++) {
    initialValues[allWeights[i].id] = randomInit();
  }
  let solver = new Solver(outputOutputs, initialValues);

  function train(inputData, iterations, updateWeights) {
    let learningRate = 0.01;
    for(let i = 0; i < iterations; i++) {
      let indexes = shuffleIndexes(inputData.length);
      for(let j = 0; j < inputData.length; j++) {
        let randomIndex = indexes[j];

        let inputs = inputData[randomIndex][0];
        let constantValues = {};
        for(let k = 0; k < inputNodes.length; k++) {
          let inputNode = inputNodes[k];
          constantValues[inputNode.id] = inputs[k];
        }

        testInput = inputs;
        setCells(inputCells, testInput);

        solver.solve(constantValues);

        let targets = inputData[randomIndex][1];
        let errors = {};
        let errorRate = 0;
        let outputValues = [];
        for(let k = 0; k < outputOutputs.length; k++) {
          let outputNode = outputOutputs[k];
          let result = solver.idToState[outputNode.id].value;
          errorRate += result;
          outputValues.push(result);
          errors[outputNode.id] = targets[k] - result;
        }

        testOutput = outputValues;
        setCells(outputCells, testOutput);

        if(updateWeights) {
          errorRate = errorRate / outputValues.length;
          document.getElementById("errorRate").innerText = errorRate;
          solver.fit(errors, learningRate);
        }
      }
    }
  }

  document.getElementById("train1K").addEventListener("click", function(e) {
    train(numberData, 1000, true);
  });
  document.getElementById("train10K").addEventListener("click", function(e) {
    train(numberData, 10000, true);
  });
  document.getElementById("train100K").addEventListener("click", function(e) {
    train(numberData, 100000, true);
  });

  document.getElementById("input").addEventListener("click", function(e) {
    for(let i = 0; i < inputCells.length; i++) {
      if(inputCells[i] === e.target) {
        if(testInput[i] === 1) {
          testInput[i] = 0;
        } else {
          testInput[i] = 1;
        }
        train([[testInput, 0]], 1, false);
      }
    }
  });
}());
