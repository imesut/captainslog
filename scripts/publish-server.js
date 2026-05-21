#!/usr/bin/env node
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());


//dev: 'Start TinaCMS + Hugo preview',
const scripts = {
  metadata: 'Prepare review metadata',
  images: 'Fetch cover images',
  build: 'Build site with Hugo, images, and PDF',
  publish: 'Build and deploy to Netlify',
  random: 'Get a random episode',
};

app.get('/scripts', (req, res) => {
  res.json(scripts);
});

// Serve client JS from the static folder
app.use('/js', express.static(path.join(__dirname, '..', 'static', 'js')));
// Serve simple UI page
app.get('/publish', (req, res) => {
  res.sendFile(path.join(__dirname, 'publish-ui.html'));
});
app.get('/', (req, res) => res.redirect('/publish'));

// SSE endpoint to stream script output
app.get('/run', (req, res) => {
  const name = req.query.script;
  if (!name || !scripts[name]) {
    res.status(400).json({ error: 'script not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // spawn npm run <name>
  const proc = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', name], {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    shell: false,
  });

  const send = (type, data) => {
    res.write(`event: ${type}\n`);
    // escape newlines
    res.write(`data: ${data.replace(/\n/g, '\\n')}\n\n`);
  };

  proc.stdout.on('data', (chunk) => {
    send('stdout', chunk.toString());
  });
  proc.stderr.on('data', (chunk) => {
    send('stderr', chunk.toString());
  });
  proc.on('close', (code) => {
    send('exit', String(code));
    res.write('event: done\n');
    res.write('data: true\n\n');
    res.end();
  });

  // If client disconnects, kill the process
  req.on('close', () => {
    try { proc.kill(); } catch (e) {}
  });
});

const port = process.env.PUBLISH_SERVER_PORT || 5555;
app.listen(port, () => {
  console.log(`publish-server listening on http://localhost:${port}`);
});
