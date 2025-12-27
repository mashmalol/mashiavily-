import { Router } from 'express';
import { ContractAnalyzer } from '../services/contractAnalyzer';

const router = Router();

let analyzer: ContractAnalyzer | null = null;

function getAnalyzer(): ContractAnalyzer {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  }
  if (!analyzer) {
    analyzer = new ContractAnalyzer(process.env.ANTHROPIC_API_KEY);
  }
  return analyzer;
}

/**
 * POST /api/chat/message
 * Sends a message to The Observer and receives a response
 */
router.post('/message', async (req, res) => {
  try {
    const { message, contractContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await getAnalyzer().chat(message, contractContext);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Chat failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
