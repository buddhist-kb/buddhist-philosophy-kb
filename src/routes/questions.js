// Questions API Routes
const express = require('express');
const router = express.Router();
const { driver } = require('../config/database');

/**
 * GET /api/questions
 * Retrieve all questions or search by keyword
 */
router.get('/', async (req, res) => {
  try {
    const { search, limit = 10, offset = 0 } = req.query;
    const session = driver.session();

    let query = 'MATCH (q:Question) ';
    const params = { limit: parseInt(limit), offset: parseInt(offset) };

    if (search) {
      query += 'WHERE q.title CONTAINS $search OR q.content CONTAINS $search ';
      params.search = search;
    }

    query += 'RETURN q ORDER BY q.createdAt DESC SKIP $offset LIMIT $limit';

    const result = await session.run(query, params);
    await session.close();

    const questions = result.records.map(record => record.get('q').properties);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/questions/:id
 * Retrieve a specific question with answers
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = driver.session();

    const query = `
      MATCH (q:Question {id: $id})
      OPTIONAL MATCH (q)-[:HAS_ANSWER]->(a:Answer)
      RETURN q, collect(a) as answers
    `;

    const result = await session.run(query, { id });
    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = result.records[0].get('q').properties;
    const answers = result.records[0].get('answers').map(a => a.properties);

    res.json({ question, answers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/questions
 * Create a new question
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, topic } = req.body;
    const session = driver.session();
    const id = Date.now().toString();

    const query = `
      CREATE (q:Question {
        id: $id,
        title: $title,
        content: $content,
        topic: $topic,
        createdAt: datetime()
      })
      RETURN q
    `;

    const result = await session.run(query, { id, title, content, topic });
    await session.close();

    const question = result.records[0].get('q').properties;
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;