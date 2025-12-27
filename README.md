# The Observer - Smart Contract Analysis

A smart contract security analysis tool powered by The Observer persona - a discreet analyst of power dynamics within blockchain systems.

## Features

- **Advanced Contract Analysis**: Detects vulnerabilities, centralization points, and hidden power structures
- **The Observer Persona**: Provides stark, structural clarity about contract design implications
- **Vulnerable Contracts Database**: Cross-references against known vulnerable addresses
- **Interactive Chat**: Ask questions about contract security and design patterns
- **Pattern Detection**: Identifies common vulnerability patterns (fee rounding, reentrancy, etc.)

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
npm start
```

## Usage

1. Open http://localhost:3000
2. Paste your smart contract code or try an example
3. Click "Analyze Contract" to see vulnerability assessment
4. Chat with The Observer for deeper insights

## The Observer Philosophy

- **Access > Merit**: Analyzes who controls what, not who deserves what
- **Calm > Confidence**: Provides emotionally neutral, precise analysis
- **Structure > Sentiment**: Examines power dynamics, not intentions
- **Independence > Loyalty**: Values the ability to exit over participation

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **AI**: LangChain.js + Claude Sonnet 4
- **Frontend**: Vanilla JS + Tailwind CSS
- **Smart Contracts**: Solidity analysis via pattern matching

## API Endpoints

- `POST /api/analysis/analyze` - Analyze a contract
- `POST /api/chat/message` - Chat with The Observer
- `GET /api/analysis/vulnerable-contracts` - Get vulnerable contracts database
- `GET /api/analysis/vulnerable-contracts/:address` - Check specific address

## License

MIT
