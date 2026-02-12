import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue('feat: test commit\nfix: bug fix'),
}));

vi.mock('@google/generative-ai', () => {
  const GoogleGenerativeAI = vi.fn();
  GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: vi.fn().mockReturnValue('- feat: test commit\n- fix: bug fix'),
      },
    }),
  });
  return { GoogleGenerativeAI };
});

vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn().mockReturnValue({
      question: vi.fn((query, cb) => cb('discord')), // Default answer
      close: vi.fn(),
    }),
  },
}));

global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
};

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

describe('devlogs Application', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = 'test-chat-id';
  });

  describe('Unit Tests', () => {
    describe('sendToDiscord', () => {
      it('should send message to discord webhook', async () => {
        const { sendToDiscord } = await import('./index.js');
        await sendToDiscord('Test message');
        expect(global.fetch).toHaveBeenCalledWith(
          'https://discord.com/api/webhooks/test',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'Test message' }),
          })
        );
      });

      it('should not send if webhook url is missing', async () => {
        delete process.env.DISCORD_WEBHOOK_URL;
        const { sendToDiscord } = await import('./index.js');
        await sendToDiscord('Test message');
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    describe('sendToTelegram', () => {
      it('should send message to telegram bot', async () => {
        const { sendToTelegram } = await import('./index.js');
        await sendToTelegram('Test message');
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('api.telegram.org'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              chat_id: 'test-chat-id',
              text: 'Test message',
              parse_mode: 'Markdown',
            }),
          })
        );
      });
      
      it('should not send if token/chat_id is missing', async () => {
        delete process.env.TELEGRAM_BOT_TOKEN;
        const { sendToTelegram } = await import('./index.js');
        await sendToTelegram('Test message');
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration Test (main)', () => {
    it('should run full flow successfully', async () => {
      const { main } = await import('./index.js');
      await expect(main()).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Buscando commits'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Generando reporte'));
    });

    it('should handle no commits gracefully', async () => {
      const { execSync } = await import('child_process');
      const { main } = await import('./index.js');
      execSync.mockReturnValueOnce(''); 

      await expect(main()).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No hay commits'));
    });
  });
});
