#!/usr/bin/env node

const { run } = require('./runTest.js');

// Run the tests
run().then(() => {
  console.log('All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('Tests failed:', error.message);
  process.exit(1);
});
