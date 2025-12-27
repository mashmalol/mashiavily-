import { Router } from 'express';
import { ContractAnalyzer } from '../services/contractAnalyzer';

const router = Router();

// Lazy initialization of analyzer
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
 * POST /api/analysis/analyze
 * Analyzes a smart contract and returns vulnerability assessment
 */
router.post('/analyze', async (req, res) => {
  try {
    const { contractCode, contractAddress } = req.body;

    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required' });
    }

    const result = await getAnalyzer().analyzeContract(contractCode, contractAddress);
    
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/vulnerable-contracts
 * Returns the list of known vulnerable contracts
 */
router.get('/vulnerable-contracts', (req, res) => {
  try {
    const contracts = getAnalyzer().getVulnerableContracts();
    res.json({ contracts });
  } catch (error) {
    console.error('Error fetching vulnerable contracts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vulnerable contracts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/vulnerable-contracts/:address
 * Checks if a specific address is in the vulnerable contracts database
 */
router.get('/vulnerable-contracts/:address', (req, res) => {
  try {
    const { address } = req.params;
    const contract = getAnalyzer().findVulnerableContract(address);
    
    if (contract) {
      res.json({ found: true, contract });
    } else {
      res.json({ found: false });
    }
  } catch (error) {
    console.error('Error checking vulnerable contract:', error);
    res.status(500).json({ 
      error: 'Failed to check vulnerable contract',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
