#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));


async function getMultiLineInput(promptMessage) {
  console.log(promptMessage);
  let result = [];
  while (true) {
    const line = await askQuestion('');
    if (line.trim() === 'END') break;
    result.push(line);
  }
  return result.join('\n');
}

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
}

function parseToMarkdownTable(rawText, delimiter = ',') {
  const lines = rawText.trim().split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return '';

  if (lines[0].includes('\t')) delimiter = '\t';

  const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
  const headers = rows[0];
  const body = rows.slice(1);

  const colWidths = headers.map((h, i) => {
    const maxBody = body.reduce((max, r) => Math.max(max, (r[i] || '').length), 0);
    return Math.max(h.length, maxBody, 3);
  });

  const formatRow = (row) => 
    '| ' + row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ') + ' |';

  const headerLine = formatRow(headers);
  const delimiterLine = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  const bodyLines = body.map(formatRow).join('\n');

  return `${headerLine}\n${delimiterLine}\n${bodyLines}`;
}

async function handleGitPush(filename) {
  const isGitRepo = runCommand('git rev-parse --is-inside-work-tree');
  if (!isGitRepo) {
    console.log('\x1b[33m%s\x1b[0m', '⚠ Not inside a Git repository. Skipping Git actions.');
    return;
  }

  const gitAnswer = await askQuestion('\nDo you want to commit & push this file to Git? (y/N): ');
  if (gitAnswer.trim().toLowerCase() !== 'y') {
    console.log('Skipped Git commit.');
    return;
  }

  const defaultMsg = `docs: update ${filename} via md-craft`;
  const commitMsg = (await askQuestion(`Commit message (default: "${defaultMsg}"): `)) || defaultMsg;

  console.log('\x1b[36m%s\x1b[0m', '\nRunning Git commands...');

  runCommand(`git add "${filename}"`);
  console.log(`✔ Staged ${filename}`);

  const commitOutput = runCommand(`git commit -m "${commitMsg}"`);
  if (commitOutput) {
    console.log('✔ Committed changes.');
  } else {
    console.log('ℹ No changes to commit.');
  }

  const currentBranch = runCommand('git branch --show-current') || 'main';
  console.log(`Pushing to remote branch "${currentBranch}"...`);
  
  const pushResult = runCommand(`git push origin ${currentBranch}`);
  if (pushResult !== null) {
    console.log('\x1b[32m%s\x1b[0m', `✔ Successfully pushed to origin/${currentBranch}!`);
  } else {
    console.log('\x1b[31m%s\x1b[0m', '✖ Push failed. Check your Git remote permissions or network connection.');
  }
}

async function runCLI() {
  console.log('\x1b[36m%s\x1b[0m', '=== Markdown Document & Note Craft CLI ===\n');

  const title = await askQuestion('Document Title: ');
  const description = await askQuestion('Short Description/Overview: ');

  let content = `# ${title}\n\n> ${description}\n\n---\n\n`;

  let adding = true;
  while (adding) {
    console.log('\nSelect section type to add:');
    console.log('1. Heading & Multi-line Text / Paragraphs');
    console.log('2. Table (Paste CSV/TSV text)');
    console.log('3. Callout Box (Note / Warning / Tip)');
    console.log('4. Code Block');
    console.log('5. Finish and Save File');

    const choice = await askQuestion('\nChoice (1-5): ');

    switch (choice.trim()) {
      case '1': {
        const hText = await askQuestion('Heading Text: ');
        const bodyText = await getMultiLineInput('\nEnter text/paragraphs (type "END" on a new line when done):');
        content += `## ${hText}\n\n${bodyText}\n\n`;
        break;
      }
      case '2': {
        const rawData = await getMultiLineInput('\nEnter raw table data (type "END" on a new line when done):');
        const tableMd = parseToMarkdownTable(rawData);
        content += `### Data Summary\n\n${tableMd}\n\n`;
        break;
      }
      case '3': {
        const type = await askQuestion('Callout Type (NOTE/TIP/WARNING/IMPORTANT): ');
        const noteText = await askQuestion('Note Text: ');
        content += `> [!${type.toUpperCase() || 'NOTE'}]\n> ${noteText}\n\n`;
        break;
      }
      case '4': {
        const lang = await askQuestion('Language (js, python, bash, etc.): ');
        const code = await getMultiLineInput('\nEnter code (type "END" on a new line when done):');
        content += `\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
        break;
      }
      case '5':
        adding = false;
        break;
      default:
        console.log('Invalid choice.');
    }
  }

  const filename = (await askQuestion('Export filename (default: README.md): ')) || 'README.md';
  fs.writeFileSync(filename, content.trim() + '\n');
  console.log('\x1b[32m%s\x1b[0m', `\n✔ Successfully generated ${filename}!`);

  await handleGitPush(filename);

  rl.close();
}

if (!process.stdin.isTTY) {
  let stdinData = '';
  process.stdin.on('data', chunk => stdinData += chunk);
  process.stdin.on('end', () => {
    console.log(parseToMarkdownTable(stdinData));
    process.exit(0);
  });
} else {
  runCLI();
}
