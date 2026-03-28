#!/usr/bin/env node
// npx create-hop wrapper
// This file is called when user runs: npx create-hop or npm create hop
// It works by delegating to main module

const { createProject } = require('./lib/create-project.js');

createProject(projectName);
