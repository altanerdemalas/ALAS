import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3001),
  dbFile: process.env.DB_FILE || './data/alas.db',

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-5',
    // 'high' iyi bir denge; ağır araştırma için 'xhigh' yapabilirsin.
    effort: process.env.ANTHROPIC_EFFORT || 'high',
  },

  printify: {
    token: process.env.PRINTIFY_API_TOKEN || '',
    shopId: process.env.PRINTIFY_SHOP_ID || '',
    baseUrl: 'https://api.printify.com/v1',
  },

  // Kullanıcı profili: ajan araştırmayı ve dersleri buna göre kişiselleştirir.
  profile: {
    channels: (process.env.SALES_CHANNELS || 'etsy,shopify,printify_popup').split(',').map((s) => s.trim()),
    market: process.env.TARGET_MARKET || 'US',
    language: process.env.CONTENT_LANGUAGE || 'tr',
    budget: process.env.STARTING_BUDGET || 'düşük (<$200)',
    experience: process.env.EXPERIENCE_LEVEL || 'başlangıç',
  },

  research: {
    // Cron: her gün 07:00 (sunucu saati). Kapatmak için RESEARCH_CRON=off
    cron: process.env.RESEARCH_CRON || '0 7 * * *',
    topicsPerRun: Number(process.env.TOPICS_PER_RUN || 2),
  },
};

export const hasAI = () => Boolean(config.anthropic.apiKey);
export const hasPrintify = () => Boolean(config.printify.token);
