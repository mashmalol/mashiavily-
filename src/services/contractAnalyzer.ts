import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { OBSERVER_SYSTEM_PROMPT, VulnerableContract } from '../config/observer-persona';
import { VULNERABLE_CONTRACTS } from '../examples';

/**
 * Core contract analysis service
 * Uses The Observer persona to analyze smart contracts for vulnerabilities,
 * centralization risks, and hidden power structures
 */

export interface AnalysisResult {
  scamProbability: number; // 0-100
  vulnerabilities: Vulnerability[];
  powerDynamics: PowerStructure;
  recommendation: string;
  observerInsight: string;
  knownVulnerableInteractions: VulnerableContractMatch[];
}

export interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location: string;
  implication: string; // The Observer's interpretation of why this exists
}

export interface PowerStructure {
  centralizationPoints: string[];
  privilegedActors: string[];
  exitMechanisms: string[];
  hiddenIncentives: string[];
}

export interface VulnerableContractMatch {
  address: string;
  chain: string;
  name: string;
  vulnerability: string;
  matchReason: string;
}

export class ContractAnalyzer {
  private model: ChatAnthropic;

  constructor(apiKey: string) {
    // Using Claude Sonnet for nuanced analysis
    // The Observer requires sophisticated reasoning about power dynamics
    this.model = new ChatAnthropic({
      modelName: 'claude-sonnet-4-20250514',
      anthropicApiKey: apiKey,
      temperature: 0.3, // Lower temperature for precise, consistent analysis
    });
  }

  /**
   * Checks if contract code interacts with known vulnerable contracts
   * Returns matches found in the vulnerable contract database
   */
  private checkVulnerableInteractions(contractCode: string): VulnerableContractMatch[] {
    const matches: VulnerableContractMatch[] = [];
    
    // Extract addresses from contract code (simplified regex)
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const foundAddresses = contractCode.match(addressPattern) || [];
    
    // Check against vulnerable contracts database
    for (const address of foundAddresses) {
      const vulnerable = VULNERABLE_CONTRACTS.find(
        v => v.address.toLowerCase() === address.toLowerCase()
      );
      
      if (vulnerable) {
        matches.push({
          address: vulnerable.address,
          chain: vulnerable.chain,
          name: vulnerable.name,
          vulnerability: vulnerable.vulnerability,
          matchReason: 'Direct address reference found in contract code'
        });
      }
    }
    
    // Pattern matching for similar vulnerabilities
    const patterns = this.detectVulnerabilityPatterns(contractCode);
    for (const pattern of patterns) {
      const similarVulnerable = VULNERABLE_CONTRACTS.find(
        v => v.vulnerability.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (similarVulnerable && !matches.find(m => m.address === similarVulnerable.address)) {
        matches.push({
          address: similarVulnerable.address,
          chain: similarVulnerable.chain,
          name: similarVulnerable.name,
          vulnerability: similarVulnerable.vulnerability,
          matchReason: `Similar vulnerability pattern detected: ${pattern}`
        });
      }
    }
    
    return matches;
  }

  /**
   * Detects vulnerability patterns in contract code
   */
  private detectVulnerabilityPatterns(contractCode: string): string[] {
    const patterns: string[] = [];
    
    // Fee calculation vulnerabilities
    if (contractCode.includes('/ 100000') || contractCode.includes('/ FEE_DENOMINATOR')) {
      patterns.push('fee rounding vulnerability');
    }
    
    // Reentrancy patterns
    if (contractCode.match(/call\{value:/i) && !contractCode.includes('nonReentrant')) {
      patterns.push('reentrancy');
    }
    
    // Hidden transfer restrictions
    if (contractCode.includes('_beforeTokenTransfer') || contractCode.includes('_canTransfer')) {
      patterns.push('hidden transfer restrictions');
    }
    
    // Centralized mint
    if (contractCode.includes('function mint') && contractCode.includes('onlyOwner')) {
      patterns.push('centralized mint');
    }
    
    // Unchecked external calls
    if (contractCode.match(/\.call\(/i) && !contractCode.includes('require') && !contractCode.includes('if')) {
      patterns.push('unchecked external call');
    }
    
    return patterns;
  }

  /**
   * Formats vulnerable contract database for inclusion in analysis prompt
   */
  private formatVulnerableContractsContext(): string {
    return `
**Known Vulnerable Contracts Database:**
${VULNERABLE_CONTRACTS.map(v => `
- ${v.address} (${v.chain}) - ${v.name}
  Vulnerability: ${v.vulnerability}
  Severity: ${v.severity}
  Exploitable: ${v.exploitable ? 'YES' : 'NO'}
  Notes: ${v.notes}
`).join('\n')}

Cross-reference any addresses found in the analyzed contract against this database.
Identify similar vulnerability patterns even if addresses don't match exactly.
`;
  }

  /**
   * Analyzes a smart contract through The Observer's lens
   * Returns both technical vulnerabilities and structural power analysis
   */
  async analyzeContract(contractCode: string, contractAddress?: string): Promise<AnalysisResult> {
    // Check for interactions with known vulnerable contracts
    const knownVulnerableInteractions = this.checkVulnerableInteractions(contractCode);
    
    const analysisPrompt = `Analyze this smart contract. Provide:

1. Technical vulnerabilities (reentrancy, access control, arithmetic issues)
2. Centralization points (admin keys, upgrade mechanisms, pause functions)
3. Economic incentives (who profits, who bears risk)
4. Exit mechanisms (can users leave, what's the cost)
5. Scam probability assessment (0-100)
6. Cross-reference against the vulnerable contracts database below

${this.formatVulnerableContractsContext()}

${contractAddress ? `Contract Address: ${contractAddress}\n` : ''}

Contract code:
\`\`\`solidity
${contractCode}
\`\`\`

${knownVulnerableInteractions.length > 0 ? `
**ALERT: This contract references known vulnerable addresses:**
${knownVulnerableInteractions.map(m => `- ${m.address}: ${m.matchReason}`).join('\n')}
` : ''}

Format your response as JSON with this structure:
{
  "scamProbability": number,
  "vulnerabilities": [{"severity": string, "category": string, "description": string, "location": string, "implication": string}],
  "powerDynamics": {
    "centralizationPoints": [string],
    "privilegedActors": [string],
    "exitMechanisms": [string],
    "hiddenIncentives": [string]
  },
  "recommendation": string,
  "observerInsight": string
}

In your observerInsight, comment on any matches with the vulnerable contracts database.`;

    const messages = [
      new SystemMessage(OBSERVER_SYSTEM_PROMPT),
      new HumanMessage(analysisPrompt),
    ];

    const response = await this.model.invoke(messages);
    
    // Parse the response - The Observer provides structured analysis
    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse analysis result');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Add known vulnerable interactions to result
    return {
      ...result,
      knownVulnerableInteractions
    };
  }

  /**
   * Provides conversational analysis
   * User can ask questions, The Observer responds with structural clarity
   */
  async chat(userMessage: string, contractContext?: string): Promise<string> {
    const vulnerableDbContext = this.formatVulnerableContractsContext();
    
    const contextualPrompt = contractContext
      ? `${vulnerableDbContext}\n\nContext - analyzing contract:\n\`\`\`solidity\n${contractContext}\n\`\`\`\n\nUser question: ${userMessage}`
      : `${vulnerableDbContext}\n\nUser question: ${userMessage}`;

    const messages = [
      new SystemMessage(OBSERVER_SYSTEM_PROMPT),
      new HumanMessage(contextualPrompt),
    ];

    const response = await this.model.invoke(messages);
    return response.content as string;
  }

  /**
   * Gets the list of all known vulnerable contracts
   */
  getVulnerableContracts(): VulnerableContract[] {
    return VULNERABLE_CONTRACTS;
  }

  /**
   * Searches for a specific vulnerable contract by address
   */
  findVulnerableContract(address: string): VulnerableContract | undefined {
    return VULNERABLE_CONTRACTS.find(
      v => v.address.toLowerCase() === address.toLowerCase()
    );
  }
}
