class NeuralNetwork {
    constructor(inputNodes, hiddenNodes, outputNodes) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;

        // Initialize weights with random values
        this.weights_ih = this.createMatrix(this.hiddenNodes, this.inputNodes);
        this.weights_ho = this.createMatrix(this.outputNodes, this.hiddenNodes);

        // Initialize biases
        this.bias_h = this.createMatrix(this.hiddenNodes, 1);
        this.bias_o = this.createMatrix(this.outputNodes, 1);

        this.randomizeWeights();
    }

    createMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = 0;
            }
        }
        return matrix;
    }

    randomizeWeights() {
        for (let i = 0; i < this.weights_ih.length; i++) {
            for (let j = 0; j < this.weights_ih[i].length; j++) {
                this.weights_ih[i][j] = Math.random() * 2 - 1; // Random between -1 and 1
            }
        }
        for (let i = 0; i < this.weights_ho.length; i++) {
            for (let j = 0; j < this.weights_ho[i].length; j++) {
                this.weights_ho[i][j] = Math.random() * 2 - 1;
            }
        }
        for (let i = 0; i < this.bias_h.length; i++) {
            this.bias_h[i][0] = Math.random() * 2 - 1;
        }
        for (let i = 0; i < this.bias_o.length; i++) {
            this.bias_o[i][0] = Math.random() * 2 - 1;
        }
    }

    // Simple matrix multiplication (A * B)
    multiply(a, b) {
        const result = this.createMatrix(a.length, b[0].length);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    // Add matrix (A + B)
    add(a, b) {
        const result = this.createMatrix(a.length, a[0].length);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[0].length; j++) {
                result[i][j] = a[i][j] + b[i][j];
            }
        }
        return result;
    }

    // Apply activation function (sigmoid)
    sigmoid(matrix) {
        const result = this.createMatrix(matrix.length, matrix[0].length);
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                result[i][j] = 1 / (1 + Math.exp(-matrix[i][j]));
            }
        }
        return result;
    }

    // Convert array to matrix
    arrayToMatrix(arr) {
        const matrix = this.createMatrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            matrix[i][0] = arr[i];
        }
        return matrix;
    }

    // Convert matrix to array
    matrixToArray(matrix) {
        const arr = [];
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                arr.push(matrix[i][j]);
            }
        }
        return arr;
    }

    feedForward(input_array) {
        // Input to Hidden
        let inputs = this.arrayToMatrix(input_array);
        let hidden = this.multiply(this.weights_ih, inputs);
        hidden = this.add(hidden, this.bias_h);
        hidden = this.sigmoid(hidden);

        // Hidden to Output
        let output = this.multiply(this.weights_ho, hidden);
        output = this.add(output, this.bias_o);
        output = this.sigmoid(output);

        return this.matrixToArray(output);
    }

    clone() {
        const clone = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);
        clone.weights_ih = JSON.parse(JSON.stringify(this.weights_ih));
        clone.weights_ho = JSON.parse(JSON.stringify(this.weights_ho));
        clone.bias_h = JSON.parse(JSON.stringify(this.bias_h));
        clone.bias_o = JSON.parse(JSON.stringify(this.bias_o));
        return clone;
    }

    mutate(mutationRate) {
        const mutateMatrix = (matrix) => {
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[i].length; j++) {
                    if (Math.random() < mutationRate) {
                        matrix[i][j] += (Math.random() * 2 - 1) * 0.1; // Small random change
                    }
                }
            }
        };

        mutateMatrix(this.weights_ih);
        mutateMatrix(this.weights_ho);
        mutateMatrix(this.bias_h);
        mutateMatrix(this.bias_o);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuralNetwork;
}