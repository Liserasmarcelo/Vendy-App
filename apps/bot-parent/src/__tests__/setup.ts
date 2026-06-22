import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('PARENT_BOT_TOKEN', '1234567890:***');
vi.stubEnv('ADMIN_TELEGRAM_IDS', '123456,789012');
vi.stubEnv('API_URL', 'http://localhost:3001');

// Mock fetch
global.fetch = vi.fn();

// Mock console
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
