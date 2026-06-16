# Buddhist Philosophy Knowledge Base

A comprehensive Tipitaka Q&A system built with Node.js and Neo4j graph database.

## 📚 Project Structure

```
buddhist-philosophy-kb/
├── src/
│   ├── config/
│   │   └── database.js        ← Neo4j connection configuration
│   ├── routes/
│   │   ├── questions.js       ← Question API endpoints
│   │   └── answers.js         ← Answer API endpoints
│   └── app.js                 ← Main Express application
├── .env.example               ← Environment variables template
├── .gitignore                 ← Git ignore rules
├── package.json               ← Project dependencies
└── README.md                  ← This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 14.0.0
- Neo4j database instance
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/buddhist-kb/buddhist-philosophy-kb.git
   cd buddhist-philosophy-kb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Neo4j credentials
   ```

4. **Start the server**
   ```bash
   npm start
   # For development with auto-reload:
   npm run dev
   ```

The API will be running at `http://localhost:3000`

## 📖 API Endpoints

### Questions API
- `GET /api/questions` - Get all questions with optional search
- `GET /api/questions/:id` - Get a specific question with answers
- `POST /api/questions` - Create a new question

### Answers API
- `GET /api/answers/:questionId` - Get answers for a question
- `POST /api/answers` - Create a new answer
- `PUT /api/answers/:id` - Update an answer

## 🧪 Testing

```bash
npm test
```

## 🔍 Code Quality

```bash
npm run lint
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📧 Contact

For questions or suggestions, please contact the maintainers.
