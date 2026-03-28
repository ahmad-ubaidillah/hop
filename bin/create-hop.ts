#!/usr/bin/env node
// create-hop - Entry point for npx create-hop
// This file is called when user runs: npx create-hop or npm create hop

import { createProject } from './lib/create-project.js';

const projectName = process.argv[2];

if (!projectName) {
  console.log('');
  console.log('Usage: npx create-hop <project-name>');
  console.log('');
  console.log('Examples:');
  console.log('  npx create-hop my-api-tests');
  console.log('  npx create-hop e2e-tests');
  console.log('');
  process.exit(1);
}

createProject(projectName);
