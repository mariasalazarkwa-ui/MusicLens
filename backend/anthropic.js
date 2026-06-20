const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getTrackInsight({ track, artist, album, mode }) {
  const systemPrompt = `You are MusicLens — a brutally honest, punk-spirited music companion.
Raw, sharp, no fluff, no corporate music-speak. Occasionally irreverent.`;

  let userPrompt;
  if (mode === 'more') {
    userPrompt = `Go deeper on ${artist}. What scene were they part of, who influenced them, who did they shape? What was happening culturally when "${track}" came out? Legacy, context, the bigger picture. Under 130 words.`;
  } else {
    userPrompt = `Who is ${artist}? Give me the real story — origin, what makes them matter, their sound and attitude. Only mention "${track}"${album ? ` or "${album}"` : ''} if it's genuinely significant to understanding them. Under 110 words.`;
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return message.content[0].text;
}

module.exports = { getTrackInsight };
