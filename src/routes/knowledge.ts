import { Router } from 'express';
import { BlockchainKnowledgeBase } from '../agents/blockchain-knowledge';

const router = Router();
const knowledgeBase = new BlockchainKnowledgeBase();

/**
 * GET /api/knowledge/patterns
 * Returns all vulnerability patterns
 */
router.get('/patterns', (req, res) => {
  try {
    const patterns = knowledgeBase.getAllPatterns();
    res.json({ patterns });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vulnerability patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/knowledge/vectors
 * Returns all attack vectors
 */
router.get('/vectors', (req, res) => {
  try {
    const vectors = knowledgeBase.getAllVectors();
    res.json({ vectors });
  } catch (error) {
    console.error('Error fetching vectors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attack vectors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/knowledge/principles
 * Returns all security principles
 */
router.get('/principles', (req, res) => {
  try {
    const principles = knowledgeBase.getAllPrinciples();
    res.json({ principles });
  } catch (error) {
    console.error('Error fetching principles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security principles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
