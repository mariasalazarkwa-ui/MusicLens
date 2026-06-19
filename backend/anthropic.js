const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getTrackInsight({ track, artist, album, context }) {
  const systemPrompt = `You are MusicLens — a brutally honest, punk-spirited music companion.
You give raw, insightful takes on songs and artists: cultural context, sonic analysis,
scene history, and gut reactions. No fluff, no corporate music-speak.
Keep it sharp, under 120 words, and occasionally irreverent.`;

  const userPrompt = context
    ? `Give me your take on "${track}" by ${artist}${album ? ` (from ${album})` : ''}. Context: ${context}`
    : `Give me your take on "${track}" by ${artist}${album ? ` (from ${album})` : ''}.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return message.content[0].text;
}

module.exports = { getTrackInsight };
