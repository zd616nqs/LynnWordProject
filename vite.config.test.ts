// @vitest-environment node
import { describe, expect, it } from 'vitest';
import viteConfig from './vite.config';

describe('vite security config', () => {
  it('does not expose vendor secrets through client define values', () => {
    const configFactory = viteConfig as (env: { mode: string }) => { define?: Record<string, string> };
    const config = configFactory({ mode: 'test' });
    const defineKeys = Object.keys(config.define ?? {});

    expect(defineKeys.some(key => key.includes('GEMINI'))).toBe(false);
    expect(defineKeys.some(key => key.includes('SILICONFLOW'))).toBe(false);
    expect(defineKeys.some(key => key.includes('API_KEY'))).toBe(false);
  });
});

