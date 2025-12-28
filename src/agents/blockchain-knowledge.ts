import { ChatAnthropic } from '@langchain/anthropic';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Blockchain Knowledge Base Agent
 * Provides deep expertise on blockchain vulnerabilities, attack patterns,
 * and security analysis to guide The Observer's assessments
 */

export interface VulnerabilityPattern {
  name: string;
  category: string;
  description: string;
  indicators: string[];
  exploitMethod: string;
  realWorldExamples: string[];
  mitigation: string;
}

export interface AttackVector {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  codePatterns: string[];
  prerequisites: string[];
  impact: string;
}

export interface SecurityPrinciple {
  principle: string;
  explanation: string;
  violations: string[];
  examples: string[];
}

/**
 * Core blockchain security knowledge base
 */
export class BlockchainKnowledgeBase {
  private vulnerabilityPatterns: VulnerabilityPattern[];
  private attackVectors: AttackVector[];
  private securityPrinciples: SecurityPrinciple[];

  constructor() {
    this.vulnerabilityPatterns = this.initializeVulnerabilityPatterns();
    this.attackVectors = this.initializeAttackVectors();
    this.securityPrinciples = this.initializeSecurityPrinciples();
  }

  private initializeVulnerabilityPatterns(): VulnerabilityPattern[] {
    return [
      {
        name: 'Integer Arithmetic Rounding',
        category: 'Mathematical Vulnerabilities',
        description: 'Division operations that round down to zero, bypassing fee calculations or access controls',
        indicators: [
          'Division by large denominator (10000, 100000)',
          'Fee calculation using division',
          'No minimum threshold checks',
          'Unchecked arithmetic operations'
        ],
        exploitMethod: 'Send amounts smaller than the divisor to make fees round to zero',
        realWorldExamples: [
          'Fee-on-transfer tokens with exploitable rounding',
          'Reward distribution with dust amount manipulation'
        ],
        mitigation: 'Use minimum amount thresholds, checked math, or basis points with proper scaling'
      },
      {
        name: 'Reentrancy',
        category: 'Control Flow Vulnerabilities',
        description: 'External calls before state updates allow recursive calling to drain funds',
        indicators: [
          '.call{value:}() before state changes',
          'No nonReentrant modifier',
          'State updates after external calls',
          'withdrawal/transfer functions with external calls'
        ],
        exploitMethod: 'Fallback function calls back into contract before state is updated',
        realWorldExamples: [
          'The DAO hack (2016) - $60M stolen',
          'Lendf.Me (2020) - $25M stolen'
        ],
        mitigation: 'Checks-Effects-Interactions pattern, ReentrancyGuard, pull over push payments'
      },
      {
        name: 'Honeypot Transfer Restrictions',
        category: 'Economic Attack',
        description: 'Hidden logic prevents certain addresses from selling while allowing buying',
        indicators: [
          '_beforeTokenTransfer with conditional logic',
          'Whitelist/blacklist systems',
          'Different logic for buy vs sell',
          'Ownership-based transfer restrictions'
        ],
        exploitMethod: 'Users can buy but cannot sell - liquidity trap',
        realWorldExamples: [
          'Squid Game token (2021) - $3M rug pull',
          'Countless BSC honeypot tokens'
        ],
        mitigation: 'Audit _beforeTokenTransfer, verify transfers work bidirectionally, check token contract source'
      },
      {
        name: 'Centralized Minting/Burning',
        category: 'Access Control',
        description: 'Unlimited minting power concentrated in single address without timelock or governance',
        indicators: [
          'function mint() onlyOwner',
          'No max supply cap',
          'No timelock on mint',
          'Direct ownership control'
        ],
        exploitMethod: 'Owner mints unlimited supply and dumps, diluting all holders',
        realWorldExamples: [
          'Numerous DeFi rug pulls',
          'AnubisDAO (2021) - $60M exit scam'
        ],
        mitigation: 'Max supply caps, timelock contracts, multi-sig governance, immutable contracts'
      },
      {
        name: 'Oracle Manipulation',
        category: 'Price Feed Vulnerabilities',
        description: 'Reliance on single price source or manipulable DEX pairs',
        indicators: [
          'Single oracle source',
          'Uniswap/DEX spot price usage',
          'No TWAP (Time-Weighted Average Price)',
          'Low liquidity price feeds'
        ],
        exploitMethod: 'Flash loan to manipulate spot price, execute transaction, profit from manipulation',
        realWorldExamples: [
          'Mango Markets (2022) - $110M exploit',
          'Harvest Finance (2020) - $34M'
        ],
        mitigation: 'Multiple oracle sources, TWAP, Chainlink feeds, manipulation-resistant pricing'
      },
      {
        name: 'Unchecked External Calls',
        category: 'Error Handling',
        description: 'External calls without checking return values or using try/catch',
        indicators: [
          '.call() without checking return value',
          'No try/catch around external calls',
          'Assuming external calls succeed',
          'No fallback handling'
        ],
        exploitMethod: 'External call fails silently, contract continues with invalid state',
        realWorldExamples: [
          'King of the Ether bug',
          'Various token transfer failures'
        ],
        mitigation: 'Always check return values, use require() or try/catch, handle failures explicitly'
      },
      {
        name: 'Front-Running Vulnerability',
        category: 'MEV (Maximal Extractable Value)',
        description: 'Transactions visible in mempool allow bots to front-run profitable operations',
        indicators: [
          'Public slippage parameters',
          'No deadline parameter',
          'Predictable transaction ordering dependency',
          'AMM swap functions'
        ],
        exploitMethod: 'Monitor mempool, submit higher gas transaction to execute before target',
        realWorldExamples: [
          'Constant Ethereum MEV extraction',
          'Sandwich attacks on DEX trades'
        ],
        mitigation: 'Private transaction submission, commit-reveal schemes, FlashBots protection'
      },
      {
        name: 'Delegatecall to Untrusted Contract',
        category: 'Proxy Pattern Vulnerabilities',
        description: 'Using delegatecall with user-controlled addresses allows storage manipulation',
        indicators: [
          'delegatecall with user input',
          'No whitelist of allowed targets',
          'Proxy patterns without access control',
          'Library address not immutable'
        ],
        exploitMethod: 'Point delegatecall to malicious contract that overwrites storage slots',
        realWorldExamples: [
          'Parity Wallet hack (2017) - $150M frozen',
          'Various proxy contract exploits'
        ],
        mitigation: 'Whitelist delegate targets, use immutable library addresses, thorough proxy audits'
      }
    ];
  }

  private initializeAttackVectors(): AttackVector[] {
    return [
      {
        name: 'Flash Loan Attack',
        severity: 'critical',
        description: 'Borrow massive amounts without collateral to manipulate markets in single transaction',
        codePatterns: [
          'Price oracle manipulation',
          'Insufficient liquidity checks',
          'Spot price dependencies',
          'No transaction size limits'
        ],
        prerequisites: [
          'Flash loan provider (Aave, dYdX)',
          'Price manipulation opportunity',
          'Atomic transaction execution'
        ],
        impact: 'Can drain entire protocol value through price manipulation or arbitrage'
      },
      {
        name: 'Sandwich Attack',
        severity: 'high',
        description: 'Front-run and back-run target transaction to extract value from slippage',
        codePatterns: [
          'AMM swaps without private submission',
          'Large slippage tolerance',
          'No deadline parameters'
        ],
        prerequisites: [
          'Mempool visibility',
          'MEV bot infrastructure',
          'Gas price manipulation ability'
        ],
        impact: 'Extracts value from every large trade, tax on DeFi usage'
      },
      {
        name: 'Governance Attack',
        severity: 'critical',
        description: 'Accumulate voting power through flash loans or manipulation to pass malicious proposals',
        codePatterns: [
          'Snapshot voting without delegation limits',
          'No timelock on proposals',
          'Flash loan compatible governance tokens',
          'Low quorum requirements'
        ],
        prerequisites: [
          'Governance token availability',
          'Low voter participation',
          'Instant voting power activation'
        ],
        impact: 'Complete protocol takeover, treasury drain, malicious upgrade deployment'
      },
      {
        name: 'Access Control Bypass',
        severity: 'critical',
        description: 'Circumvent admin checks through initialization vulnerabilities or logic errors',
        codePatterns: [
          'Uninitialized proxy contracts',
          'Missing onlyOwner modifiers',
          'tx.origin instead of msg.sender',
          'Constructor vs initialize confusion'
        ],
        prerequisites: [
          'Uninitialized implementation contract',
          'Weak access control logic',
          'Proxy pattern vulnerabilities'
        ],
        impact: 'Complete contract control, unlimited minting, fund extraction'
      }
    ];
  }

  private initializeSecurityPrinciples(): SecurityPrinciple[] {
    return [
      {
        principle: 'Checks-Effects-Interactions',
        explanation: 'Always perform checks first, update state second, interact with external contracts last',
        violations: [
          'External calls before state updates',
          'Reentrancy vulnerabilities',
          'State inconsistency windows'
        ],
        examples: [
          'The DAO hack violated this - called external before updating balances',
          'Modern OpenZeppelin contracts follow this pattern'
        ]
      },
      {
        principle: 'Principle of Least Privilege',
        explanation: 'Grant minimum necessary permissions, use time-locks and multi-sig for critical operations',
        violations: [
          'Single owner with unlimited power',
          'No timelock on critical functions',
          'Missing role-based access control'
        ],
        examples: [
          'Good: Compound uses timelock for all governance changes',
          'Bad: Most rug pulls have single owner mint functions'
        ]
      },
      {
        principle: 'Decentralization of Trust',
        explanation: 'Never rely on single point of failure - distribute trust across multiple parties or mechanisms',
        violations: [
          'Single oracle price feed',
          'Centralized upgrade keys',
          'Owner-controlled pause functions'
        ],
        examples: [
          'Chainlink uses multiple oracle nodes',
          'Uniswap V3 is immutable - no admin keys'
        ]
      },
      {
        principle: 'Fail Securely',
        explanation: 'When errors occur, fail to safe state - never assume external calls succeed',
        violations: [
          'Unchecked external call returns',
          'No fallback error handling',
          'Optimistic state assumptions'
        ],
        examples: [
          'OpenZeppelin SafeERC20 checks all transfer returns',
          'Circuit breakers pause on unexpected conditions'
        ]
      }
    ];
  }

  /**
   * Analyzes code for vulnerability patterns
   */
  analyzePatterns(contractCode: string): VulnerabilityPattern[] {
    const detected: VulnerabilityPattern[] = [];

    for (const pattern of this.vulnerabilityPatterns) {
      const indicators = pattern.indicators.filter(indicator => {
        const normalizedIndicator = indicator.toLowerCase();
        const normalizedCode = contractCode.toLowerCase();
        return normalizedCode.includes(normalizedIndicator);
      });

      if (indicators.length > 0) {
        detected.push(pattern);
      }
    }

    return detected;
  }

  /**
   * Identifies applicable attack vectors
   */
  identifyAttackVectors(contractCode: string): AttackVector[] {
    const applicable: AttackVector[] = [];

    for (const vector of this.attackVectors) {
      const matches = vector.codePatterns.filter(pattern => 
        contractCode.toLowerCase().includes(pattern.toLowerCase())
      );

      if (matches.length > 0) {
        applicable.push(vector);
      }
    }

    return applicable;
  }

  /**
   * Checks for security principle violations
   */
  checkPrinciples(contractCode: string): SecurityPrinciple[] {
    const violated: SecurityPrinciple[] = [];

    for (const principle of this.securityPrinciples) {
      const violations = principle.violations.filter(violation =>
        contractCode.toLowerCase().includes(violation.toLowerCase())
      );

      if (violations.length > 0) {
        violated.push(principle);
      }
    }

    return violated;
  }

  /**
   * Generates comprehensive knowledge base context for The Observer
   */
  generateAnalysisContext(contractCode: string): string {
    const patterns = this.analyzePatterns(contractCode);
    const vectors = this.identifyAttackVectors(contractCode);
    const principles = this.checkPrinciples(contractCode);

    return `
## Blockchain Security Knowledge Base Context

### Detected Vulnerability Patterns (${patterns.length}):
${patterns.map(p => `
**${p.name}** (${p.category})
- Description: ${p.description}
- Exploit Method: ${p.exploitMethod}
- Real-World Examples: ${p.realWorldExamples.join(', ')}
- Mitigation: ${p.mitigation}
`).join('\n')}

### Applicable Attack Vectors (${vectors.length}):
${vectors.map(v => `
**${v.name}** [${v.severity.toUpperCase()}]
- ${v.description}
- Prerequisites: ${v.prerequisites.join(', ')}
- Impact: ${v.impact}
`).join('\n')}

### Security Principle Violations (${principles.length}):
${principles.map(p => `
**${p.principle}**
- ${p.explanation}
- Examples: ${p.examples.join(' | ')}
`).join('\n')}

This knowledge should inform your analysis with The Observer's perspective on power dynamics and structural vulnerabilities.
`;
  }

  /**
   * Get all vulnerability patterns
   */
  getAllPatterns(): VulnerabilityPattern[] {
    return this.vulnerabilityPatterns;
  }

  /**
   * Get all attack vectors
   */
  getAllVectors(): AttackVector[] {
    return this.attackVectors;
  }

  /**
   * Get all security principles
   */
  getAllPrinciples(): SecurityPrinciple[] {
    return this.securityPrinciples;
  }
}
