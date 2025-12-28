import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import analysisRouter from './routes/analysis';
import chatRouter from './routes/chat';
import examplesRouter from './routes/examples';
import knowledgeRouter from './routes/knowledge';
import exploitsRouter, { loadExploitsFromFiles } from './routes/exploits';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/analysis', analysisRouter);
app.use('/api/chat', chatRouter);
app.use('/api/examples', examplesRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/exploits', exploitsRouter);

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize and start server
async function startServer() {
  // Load exploits from file system
  await loadExploitsFromFiles();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Blockchain Knowledge Base initialized');
    console.log('The Observer is ready to analyze contracts');
  });
}

startServer();
