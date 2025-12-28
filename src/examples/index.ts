import { readFileSync } from 'fs';
import { join } from 'path';
import { VulnerableContract } from '../config/observer-persona';

/**
 * Loads example contract source code
 */
export function loadExampleContract(filename: string): string {
  const filePath = join(__dirname, filename);
  return readFileSync(filePath, 'utf-8');
}

/**
 * Example vulnerable contracts for demonstration
 * These correspond to real contract patterns found in the wild
 */
export const EXAMPLE_CONTRACTS = {
  'tala-exploiter': loadExampleContract('tala-exploiter.sol')
};

/**
 * Database of known vulnerable contract addresses
 * Cross-referenced during analysis to identify similar patterns
 */
export const VULNERABLE_CONTRACTS: VulnerableContract[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    chain: 'ethereum',
    name: 'TALA Token',
    vulnerability: 'Fee calculation rounding to zero on small transfers; fee recipient bricking vulnerability',
    severity: 'critical',
    exploitable: true,
    notes: 'Integer division allows fee bypass. Fee recipient can brick all transfers if set to reverting contract.',
    dateIdentified: '2024-01-15'
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    chain: 'ethereum', 
    name: 'FlawedDAO',
    vulnerability: 'Reentrancy in withdrawal function; no access control on critical functions',
    severity: 'critical',
    exploitable: true,
    notes: 'Classic DAO-style reentrancy. Admin functions callable by anyone.',
    dateIdentified: '2024-02-20'
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    chain: 'bsc',
    name: 'HoneyPot Token',
    vulnerability: 'Hidden transfer restrictions; only specific addresses can sell',
    severity: 'high',
    exploitable: false,
    notes: 'Buy is open, sell is restricted. Designed to trap liquidity.',
    dateIdentified: '2024-03-10'
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    chain: 'ethereum',
    name: 'RugPull NFT',
    vulnerability: 'Centralized mint function with no cap; owner can drain treasury',
    severity: 'high',
    exploitable: true,
    notes: 'Owner can mint unlimited NFTs and drain all ETH from contract.',
    dateIdentified: '2024-04-05'
  }
];
