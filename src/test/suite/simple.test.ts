import * as assert from 'assert';

suite('Simple Test Suite', () => {
  test('Should pass a simple test', () => {
    assert.strictEqual(1 + 1, 2);
  });

  test('Should handle basic assertions', () => {
    assert.ok(true);
    assert.notStrictEqual('hello', 'world');
  });
});
