const express = require('express');
const router = express.Router();
const { driver } = require('../config/database');
const { verifyGoogleToken } = require('../middleware/auth');

// Apply auth to all admin routes
router.use(verifyGoogleToken);

// ── Get dashboard stats ──
router.get('/stats', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (q:Question) WITH count(q) AS questions
            MATCH (a:Answer) WITH questions, count(a) AS answers
            MATCH (s:Sutta) WITH questions, answers, count(s) AS suttas
            MATCH (t:Topic) WITH questions, answers, suttas, count(t) AS topics
            RETURN questions, answers, suttas, topics
        `);

        const record = result.records[0];
        res.json({
            success: true,
            data: {
                questions: record.get('questions').toNumber(),
                answers: record.get('answers').toNumber(),
                suttas: record.get('suttas').toNumber(),
                topics: record.get('topics').toNumber()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// ── Get all suttas (for dropdown) ──
router.get('/suttas', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (s:Sutta)
            RETURN s.id AS id,
                   s.name_english AS name_english,
                   s.name_sinhala AS name_sinhala,
                   s.reference AS reference
            ORDER BY s.reference ASC
        `);

        const suttas = result.records.map(r => ({
            id: r.get('id'),
            name_english: r.get('name_english'),
            name_sinhala: r.get('name_sinhala'),
            reference: r.get('reference')
        }));

        res.json({ success: true, data: suttas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// ── Get all topics (for dropdown) ──
router.get('/topics', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (t:Topic)
            RETURN t.id AS id,
                   t.name_english AS name_english,
                   t.name_sinhala AS name_sinhala
            ORDER BY t.name_english ASC
        `);

        const topics = result.records.map(r => ({
            id: r.get('id'),
            name_english: r.get('name_english'),
            name_sinhala: r.get('name_sinhala')
        }));

        res.json({ success: true, data: topics });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// ── Add new question with answer ──
router.post('/qa', async (req, res) => {
    const {
        question_sinhala, question_english, question_pali,
        answer_sinhala, answer_english, answer_pali,
        source_reference, sutta_id, topic_id,
        confidence = 0.9
    } = req.body;

    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (s:Sutta {id: $sutta_id})
            MATCH (t:Topic {id: $topic_id})
            CREATE (q:Question {
                id: randomUUID(),
                text_sinhala: $question_sinhala,
                text_english: $question_english,
                text_pali: $question_pali,
                createdAt: datetime(),
                updatedAt: datetime(),
                askedCount: 0,
                status: "active"
            })
            CREATE (a:Answer {
                id: randomUUID(),
                text_sinhala: $answer_sinhala,
                text_english: $answer_english,
                text_pali: $answer_pali,
                source_reference: $source_reference,
                confidence: $confidence,
                createdAt: datetime(),
                updatedAt: datetime(),
                status: "verified"
            })
            CREATE (q)-[:RELATES_TO_SUTTA]->(s)
            CREATE (q)-[:RELATES_TO_TOPIC]->(t)
            CREATE (q)-[:HAS_ANSWER {relevance: $confidence, order: 1}]->(a)
            CREATE (a)-[:SOURCED_FROM]->(s)
            RETURN q.id AS questionId, a.id AS answerId
        `, {
            question_sinhala, question_english, question_pali,
            answer_sinhala, answer_english, answer_pali,
            source_reference, sutta_id, topic_id, confidence
        });

        res.json({
            success: true,
            message: 'Q&A added successfully',
            questionId: result.records[0].get('questionId'),
            answerId: result.records[0].get('answerId')
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// ── Update question ──
router.put('/question/:id', async (req, res) => {
    const { id } = req.params;
    const { text_sinhala, text_english, text_pali } = req.body;
    const session = driver.session();
    try {
        await session.run(`
            MATCH (q:Question {id: $id})
            SET q.text_sinhala = $text_sinhala,
                q.text_english = $text_english,
                q.text_pali = $text_pali,
                q.updatedAt = datetime()
        `, { id, text_sinhala, text_english, text_pali });

        res.json({ success: true, message: 'Question updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// ── Update answer ──
router.put('/answer/:id', async (req, res) => {
    const { id } = req.params;
    const {
        text_sinhala, text_english, text_pali,
        source_reference, confidence, status
    } = req.body;
    const session = driver.session();
    try {
        await session.run(`
            MATCH (a:Answer {id: $id})
            SET a.text_sinhala = $text_sinhala,
                a.text_english = $text_english,
                a.text_pali = $text_pali,
                a.source_reference = $source_reference,
                a.confidence = $confidence,
                a.status = $status,
                a.updatedAt = datetime()
        `, { id, text_sinhala, text_english, text_pali,
             source_reference, confidence, status });

        res.json({ success: true, message: 'Answer updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// ── Delete question and its answers ──
router.delete('/question/:id', async (req, res) => {
    const { id } = req.params;
    const session = driver.session();
    try {
        await session.run(`
            MATCH (q:Question {id: $id})
            OPTIONAL MATCH (q)-[:HAS_ANSWER]->(a:Answer)
            DETACH DELETE q, a
        `, { id });

        res.json({ success: true, message: 'Question and answers deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
