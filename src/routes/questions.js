const express = require('express');
const router = express.Router();
const { driver } = require('../config/database');

// Search questions by text
router.get('/search', async (req, res) => {
    const { text, lang = 'english' } = req.query;
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (q:Question)-[:HAS_ANSWER]->(a:Answer)
            WHERE toLower(q.text_${lang}) CONTAINS toLower($text)
            RETURN q.id AS questionId,
                   q.text_english AS questionEn,
                   q.text_sinhala AS questionSi,
                   q.text_pali AS questionPali,
                   q.askedCount AS askedCount,
                   collect({
                       id: a.id,
                       text_english: a.text_english,
                       text_sinhala: a.text_sinhala,
                       text_pali: a.text_pali,
                       source: a.source_reference,
                       confidence: a.confidence
                   }) AS answers
            ORDER BY askedCount DESC
            LIMIT 10
        `, { text });

        const questions = result.records.map(record => ({
            id: record.get('questionId'),
            text: {
                english: record.get('questionEn'),
                sinhala: record.get('questionSi'),
                pali: record.get('questionPali')
            },
            answers: record.get('answers')
        }));

        res.json({ success: true, data: questions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});
// Get all questions
router.get('/', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (q:Question)
            OPTIONAL MATCH (q)-[:RELATES_TO_TOPIC]->(t:Topic)
            RETURN q.id AS id,
                   q.text_english AS text_english,
                   q.text_sinhala AS text_sinhala,
                   q.text_pali AS text_pali,
                   q.status AS status,
                   t.name_english AS topic
            ORDER BY q.createdAt DESC
        `);

        const questions = result.records.map(record => ({
            id: record.get('id'),
            text: {
                english: record.get('text_english'),
                sinhala: record.get('text_sinhala'),
                pali: record.get('text_pali')
            },
            status: record.get('status'),
            topic: record.get('topic')
        }));

        res.json({ success: true, data: questions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// Add new question
router.post('/', async (req, res) => {
    const {
        text_english, text_sinhala, text_pali,
        topic_id, sutta_id
    } = req.body;

    const session = driver.session();
    try {
        const result = await session.run(`
            CREATE (q:Question {
                id: randomUUID(),
                text_english: $text_english,
                text_sinhala: $text_sinhala,
                text_pali: $text_pali,
                createdAt: datetime(),
                updatedAt: datetime(),
                askedCount: 0,
                status: "active"
            })
            WITH q
            MATCH (t:Topic {id: $topic_id})
            CREATE (q)-[:RELATES_TO_TOPIC]->(t)
            WITH q
            MATCH (s:Sutta {id: $sutta_id})
            CREATE (q)-[:RELATES_TO_SUTTA]->(s)
            RETURN q.id AS id
        `, { text_english, text_sinhala, text_pali, topic_id, sutta_id });

        res.json({
            success: true,
            message: 'Question created successfully',
            id: result.records[0].get('id')
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
