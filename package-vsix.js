const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if vsce is installed
try {
  execSync('vsce --version', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing vsce...');
  execSync('npm install -g @vscode/vsce', { stdio: 'inherit' });
}

// Compile TypeScript
console.log('Compiling TypeScript...');
execSync('pnpm run compile', { stdio: 'inherit' });

// Package VSIX
console.log('Packaging VSIX...');
execSync('vsce package', { stdio: 'inherit' });

console.log('VSIX package created successfully!'); 