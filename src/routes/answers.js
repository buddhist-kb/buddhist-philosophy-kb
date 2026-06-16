// Answers API Routes
const express = require('express');
const router = express.Router();
const { driver } = require('../config/database');

/**
 * GET /api/answers/:questionId
 * Retrieve all answers for a specific question
 */
router.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const session = driver.session();

    const query = `
      MATCH (q:Question {id: $questionId})
      OPTIONAL MATCH (q)-[:HAS_ANSWER]->(a:Answer)
      RETURN collect(a) as answers
    `;

    const result = await session.run(query, { questionId });
    await session.close();

    const answers = result.records[0].get('answers').map(a => a.properties);
    res.json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/answers
 * Create a new answer for a question
 */
router.post('/', async (req, res) => {
  try {
    const { questionId, content, source, author } = req.body;
    const session = driver.session();
    const id = Date.now().toString();

    const query = `
      MATCH (q:Question {id: $questionId})
      CREATE (a:Answer {
        id: $id,
        content: $content,
        source: $source,
        author: $author,
        createdAt: datetime()
      })
      CREATE (q)-[:HAS_ANSWER]->(a)
      RETURN a
    `;

    const result = await session.run(query, { 
      questionId, 
      id, 
      content, 
      source, 
      author 
    });
    await session.close();

    const answer = result.records[0].get('a').properties;
    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/answers/:id
 * Update an existing answer
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, source, author } = req.body;
    const session = driver.session();

    const query = `
      MATCH (a:Answer {id: $id})
      SET a.content = $content,
          a.source = $source,
          a.author = $author,
          a.updatedAt = datetime()
      RETURN a
    `;

    const result = await session.run(query, { id, content, source, author });
    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const answer = result.records[0].get('a').properties;
    res.json(answer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
