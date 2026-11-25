import { describe, expect, it } from 'vitest';

import { greet } from './greet.ts';

describe(greet, () => {
  it('greets the name', () => {
    expect(greet('world')).toBe('Hello, world!');
  });
});
