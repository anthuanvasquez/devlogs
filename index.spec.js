import { jest } from '@jest/globals';

// Define mocks before importing the module under test
jest.unstable_mockModule('child_process', () => ({
  execSync: jest.fn().mockReturnValue('feat: test commit\nfix: bug fix'),
}));

jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('- feat: test commit\n- fix: bug fix'),
        },
      }),
    }),
  })),
}));

// Mock console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

// Import the module under test AFTER mocking
const { main } = await import('./index.js');

describe('dev-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = 'test-chat-id';
  });

  it('should run main function without error', async () => {
    await expect(main()).resolves.not.toThrow();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Buscando commits'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Generando reporte'));
  });

  it('should handle no commits gracefully', async () => {
    // Override the mock for this specific test
    const { execSync } = await import('child_process');
    execSync.mockReturnValueOnce(''); // Return empty commits

    await expect(main()).resolves.not.toThrow();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No hay commits'));
  });
});
