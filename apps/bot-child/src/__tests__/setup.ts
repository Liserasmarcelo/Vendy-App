import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('BOT_TOKEN', '1234567890:TEST_TOKEN_1234567890ABCDEF');
vi.stubEnv('SHOP_ID', '1');
vi.stubEnv('SHOP_NAME', 'Test Shop');
vi.stubEnv('SHOP_CURRENCY', 'USD');
vi.stubEnv('API_URL', 'http://localhost:3001');

// Mock fetch
global.fetch = vi.fn();

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
