const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Variable to store the top score of the day
let topScoreOfTheDay = 0;

// Endpoint to get the top score of the day
app.get('/api/getTopScore', (req, res) => {
    res.json({ topScore: topScoreOfTheDay });
});

// Endpoint to set the top score of the day
app.post('/api/setTopScore', (req, res) => {
    const { score } = req.body;

    // Update top score if new score is higher
    if (score > topScoreOfTheDay) {
        topScoreOfTheDay = score;
    }

    res.json({ topScore: topScoreOfTheDay });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
