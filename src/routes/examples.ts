import { Router } from 'express';
import { EXAMPLE_CONTRACTS } from '../examples';

const router = Router();

/**
 * GET /api/examples
 * Returns example contract source code
 */
router.get('/', (req, res) => {
  try {
    res.json({ examples: EXAMPLE_CONTRACTS });
  } catch (error) {
    console.error('Error fetching examples:', error);
    res.status(500).json({ 
      error: 'Failed to fetch examples',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
