require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyConnection } = require('./config/database');
const questionsRouter = require('./routes/questions');
const answersRouter = require('./routes/answers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.json({
        message: '🙏 Buddhist Philosophy Knowledge Base API',
        version: '1.0.0',
        status: 'running'
    });
});

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);

// Start server
const start = async () => {
    await verifyConnection();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

start();
