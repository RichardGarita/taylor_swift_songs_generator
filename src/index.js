const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

let model;

async function loadModel() {
    try {
        model = await tf.loadLayersModel('file://./models/taylor_swift_js/model.json');
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading the model:', error);
        throw new Error('Failed to load the model');
    }
};

async function generateText(model, start_string, t) {
    // Evaluation step (generating text using the learned model)

    // Number of characters to generate
    const num_generate = 300;

    const choruses = fs.readFileSync('./resources/choruses.txt', 'utf-8').split('');
    const charSet = new Set(choruses);
    // Ordenar los caracteres alfabéticamente
    const vocab = Array.from(charSet).sort();
    const char2idx = {};
    vocab.forEach((char, idx) => {
        char2idx[char] = idx;
    });

    const idx2char = vocab;

    // Converting our start string to numbers (vectorizing)
    var input_eval = start_string.split('').map(char => char2idx[char]);
    var input_eval = tf.expandDims(input_eval, 0);

    // Empty string to store our results
    var text_generated = [];

    // Low temperature results in more predictable text.
    // Higher temperature results in more surprising text.
    // Experiment to find the best setting.
    var temperature = t;

    // Here batch size == 1
    model.resetStates();
    for (var i = 0; i < num_generate; i++) {
        var predictions = model.predict(input_eval);

        // remove the batch dimension
        var predictions = tf.squeeze(predictions, 0);

        // using a categorical distribution to predict the character returned by the model
        const scaledPredictions = tf.div(predictions, tf.scalar(temperature));
        const sampledClass = tf.multinomial(scaledPredictions, 1).arraySync()[0];
        const predicted_id = sampledClass[0];

        // Pass the predicted character as the next input to the model
        // along with the previous hidden state
        input_eval = tf.expandDims([predicted_id], 0);

        text_generated.push(idx2char[predicted_id]);
    }
    return start_string + text_generated.join('');
}

app.post('/taylor_swift', async (req, res) => {
    if (!model) {
        return res.status(500).send('Model not loaded yet');
    }

    try {
        const {start_string, temperature} = req.body;
        if (typeof start_string !== 'string' || typeof temperature !== 'number') {
            return res.status(400).send('Invalid request format');
        }
        const prediction = await generateText(model, start_string, temperature);

        res.json({
            prediction
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).send('Prediction error');
    }
});

// Disconnect handler
process.on('SIGINT', () => {
    console.log('Server shutting down');
    process.exit();
});

// Load the model when the server starts running
loadModel();

// Turn on the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
