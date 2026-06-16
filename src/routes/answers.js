const express = require('express');
const router = express.Router();
const { driver } = require('../config/database');

// Get all answers for a question
router.get('/:questionId', async (req, res) => {
    const { questionId } = req.params;
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (q:Question {id: $questionId})-[r:HAS_ANSWER]->(a:Answer)
            OPTIONAL MATCH (a)-[:SOURCED_FROM]->(s:Sutta)
            RETURN a.id AS id,
                   a.text_english AS text_english,
                   a.text_sinhala AS text_sinhala,
                   a.text_pali AS text_pali,
                   a.source_reference AS source_reference,
                   a.confidence AS confidence,
                   a.status AS status,
                   r.relevance AS relevance,
                   r.order AS order,
                   s.name_english AS sutta_name
            ORDER BY r.order ASC
        `, { questionId });

        const answers = result.records.map(record => ({
            id: record.get('id'),
            text: {
                english: record.get('text_english'),
                sinhala: record.get('text_sinhala'),
                pali: record.get('text_pali')
            },
            source_reference: record.get('source_reference'),
            confidence: record.get('confidence'),
            status: record.get('status'),
            relevance: record.get('relevance'),
            sutta_name: record.get('sutta_name')
        }));

        res.json({ success: true, data: answers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// Add new answer to a question
router.post('/', async (req, res) => {
    const {
        question_id,
        text_english,
        text_sinhala,
        text_pali,
        source_reference,
        sutta_id,
        confidence = 0.8,
        relevance = 0.8
    } = req.body;

    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (q:Question {id: $question_id})
            MATCH (s:Sutta {id: $sutta_id})
            CREATE (a:Answer {
                id: randomUUID(),
                text_english: $text_english,
                text_sinhala: $text_sinhala,
                text_pali: $text_pali,
                source_reference: $source_reference,
                confidence: $confidence,
                createdAt: datetime(),
                updatedAt: datetime(),
                status: "draft"
            })
            CREATE (q)-[:HAS_ANSWER {
                relevance: $relevance,
                order: 1
            }]->(a)
            CREATE (a)-[:SOURCED_FROM]->(s)
            RETURN a.id AS id
        `, {
            question_id,
            text_english,
            text_sinhala,
            text_pali,
            source_reference,
            sutta_id,
            confidence,
            relevance
        });

        res.json({
            success: true,
            message: 'Answer created successfully',
            id: result.records[0].get('id')
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// Update answer status (draft -> verified)
router.put('/:answerId/status', async (req, res) => {
    const { answerId } = req.params;
    const { status } = req.body;
    const session = driver.session();

    try {
        await session.run(`
            MATCH (a:Answer {id: $answerId})
            SET a.status = $status,
                a.updatedAt = datetime()
        `, { answerId, status });

        res.json({
            success: true,
            message: `Answer status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router;
