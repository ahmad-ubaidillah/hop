#!/usr/bin/env bun
import * as p from '@clack/prompts';
import color from 'picocolors';
import { readdir, stat, readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { spawn } from 'child_process';
import { createProject } from './lib/create-project.js';

const HOP_VERSION = '1.0.0';
const HOP_LOGO = `
${color.cyan('██╗  ██╗ ██████╗')} ${color.magenta('██╗  ██╗███████╗██████╗ ')}
${color.cyan('██║  ██║██╔═══██╗')} ${color.magenta('██║ ██╔╝██╔════╝██╔══██╗')}
${color.cyan('███████║██║   ██║')} ${color.magenta('█████╔╝ █████╗  ██████╔╝')}
${color.cyan('██╔══██║██║   ██║')} ${color.magenta('██╔═██╗ ██╔══╝  ██╔══██╗')}
${color.cyan('██║  ██║╚██████╔╝')} ${color.magenta('██║  ██╗███████╗██║  ██║')}
${color.cyan('╚═╝  ╚═╝ ╚═════╝ ')} ${color.magenta('╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝')}
`;

interface FeatureFile {
  name: string;
  path: string;
  scenarios: number;
  lastModified: Date;
  tags: string[];
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // No command - show welcome
  if (!command) {
    console.log(HOP_LOGO);
    console.log(color.dim(`  High-Performance BDD Automation Testing Framework v${HOP_VERSION}`));
    console.log('');
    console.log(color.bold('  Commands:'));
    console.log('');
    console.log(color.cyan('  npx hop open') + color.dim('     Open Hop GUI'));
    console.log(color.cyan('  npx hop test') + color.dim('     Run tests'));
    console.log(color.cyan('  npx hop init') + color.dim('     Create new project'));
    console.log(color.cyan('  npx hop --help') + color.dim('  Show all commands'));
    console.log('');
    return;
  }

  // Handle commands
  switch (command) {
    case 'open':
      await openGUI();
      break;
    case 'init':
      let projectName = args[1];
      if (!projectName) {
        const name = await p.text({
          message: 'Project name:',
          placeholder: 'my-hop-tests',
        });
        if (p.isCancel(name)) {
          console.log(color.red('\n❌ Cancelled'));
          return;
        }
        projectName = name;
      }
      if (projectName) {
        await createProject(projectName);
      }
      break;
    default:
      // Forward to main CLI
      console.log('Unknown command. Use: npx hop open | npx hop test | npx hop init');
  }
}

async function openGUI() {
  console.clear();
  console.log(HOP_LOGO);
  console.log(color.dim(`  High-Performance BDD Automation Testing Framework v${HOP_VERSION}`));
  console.log('');

  // Check if hop directory exists
  const hopDir = join(process.cwd(), 'hop');
  if (!existsSync(hopDir)) {
    const shouldInit = await p.confirm({
      message: 'No hop directory found. Create a new project?',
      initialValue: true,
    });

    if (shouldInit) {
      const projectName = basename(process.cwd());
      await createProject(projectName);
      return;
    } else {
      console.log(color.red('\n❌ Please create a hop directory first.'));
      console.log(color.dim('   Run: npx hop init <project-name>'));
      return;
    }
  }

  // Scan for feature files
  const s = p.spinner();
  s.start('Scanning for feature files...');

  const features = await scanFeatures(join(hopDir, 'e2e'));

  s.stop(`Found ${features.length} feature file(s)`);

  if (features.length === 0) {
    console.log('');
    console.log(color.yellow('⚠️  No feature files found.'));
    console.log(color.dim('   Create your first test in hop/e2e/'));
    return;
  }

  // ========================================
  // MAIN GUI
  // ========================================
  console.log('');
  console.log(color.cyan('┌') + color.cyan('────────────────────────────────────────────────'));
  console.log(color.cyan('│') + color.bold('  🧪 Hop Test Runner'));
  console.log(color.cyan('└') + color.cyan('────────────────────────────────────────────────'));
  console.log('');

  // Show feature files
  const options = features.map(f => ({
    value: f.path,
    label: `${f.name} ${color.dim(`(${f.scenarios} scenarios)`)}`,
    hint: f.tags.length > 0 ? f.tags.map(t => `@${t}`).join(' ') : 'No tags',
  }));

  // Add "Run All" option
  options.unshift({
    value: '__ALL__',
    label: color.green('▶  Run All Tests'),
    hint: `${features.length} files`,
  });

  const selected = await p.select({
    message: 'Select tests to run',
    options,
  });

  if (p.isCancel(selected)) {
    console.log(color.red('\n❌ Cancelled'));
    return;
  }

  console.log('');
  console.log(color.cyan('┌') + color.cyan('────────────────────────────────────────────────'));
  console.log(color.cyan('│') + color.bold('  ⚙️ Test Configuration'));
  console.log(color.cyan('└') + color.cyan('────────────────────────────────────────────────'));
  console.log('');

  // Configuration options
  const config = await p.group({
    tags: () =>
      p.text({
        message: 'Filter by tags (comma-separated, empty for all):',
        placeholder: '@smoke,@api',
      }),
    parallel: () =>
      p.confirm({
        message: 'Run in parallel?',
        initialValue: false,
      }),
    format: () =>
        p.select({
          message: 'Report format:',
          options: [
            { value: 'console', label: 'Console', hint: 'Default output' },
            { value: 'html', label: 'HTML Report', hint: 'Premium glassmorphism UI' },
            { value: 'json', label: 'JSON', hint: 'For CI/CD' },
            { value: 'junit', label: 'JUnit XML', hint: 'For Jenkins' },
          ],
          initialValue: 'html',
        }),
    verbose: () =>
        p.confirm({
          message: 'Verbose output?',
          initialValue: false,
        }),
  });

  // Build command
  let testPath = selected === '__ALL__' ? './hop/e2e' : selected;
  let cmd = ['bun', 'run', join(process.cwd(), 'bin', 'cli.ts'), 'test', testPath];

  if (config.tags) {
    cmd.push('--tags', config.tags);
  }
  if (config.parallel) {
    cmd.push('--parallel');
  }
  if (config.format) {
    cmd.push('--format', config.format);
  }
  if (config.verbose) {
    cmd.push('--verbose');
  }

  console.log('');
  console.log(color.cyan('┌') + color.cyan('────────────────────────────────────────────────'));
  console.log(color.cyan('│') + color.bold('  🚀 Running Tests'));
  console.log(color.cyan('└') + color.cyan('────────────────────────────────────────────────'));
  console.log('');

  // Run tests
  const testProcess = spawn(cmd[0], cmd.slice(1), {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });

  testProcess.on('close', (code) => {
    console.log('');
    if (code === 0) {
      console.log(color.green('✅ Tests passed!'));
    } else {
      console.log(color.red('❌ Tests failed'));
    }
  });
}

async function scanFeatures(dir: string): Promise<FeatureFile[]> {
  const features: FeatureFile[] = [];

  if (!existsSync(dir)) {
    return features;
  }

  const files = await readdir(dir);
  
  for (const file of files) {
    if (file.endsWith('.feature')) {
      const filePath = join(dir, file);
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);

      // Count scenarios
      const scenarioMatches = content.match(/^\s*Scenario:/gm) || [];
      const scenarioOutlineMatches = content.match(/^\s*Scenario Outline:/gm) || [];
      const scenarioCount = scenarioMatches.length + scenarioOutlineMatches.length;

      // Extract tags
      const tagMatches = content.match(/@\w+/g) || [];
      const tags = [...new Set(tagMatches.map(t => t.substring(1)))];

      features.push({
        name: file.replace('.feature', ''),
        path: filePath,
        scenarios: scenarioCount,
        lastModified: stats.mtime,
        tags,
      });
    }
  }

  return features.sort((a, b) => a.name.localeCompare(b.name));
}

main().catch(console.error);
