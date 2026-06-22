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

async function getArtistProfile({ artist, track, album }) {
  const systemPrompt = `You are MusicLens — brutally honest, punk-spirited music writer.
Authority and attitude. Sharp, specific, opinionated. No fluff, no PR speak.`;

  const userPrompt = `Write an artist profile for ${artist}.
Current track: "${track}"${album ? ` from "${album}"` : ''}.

Write exactly four sections with these headers on their own line. Each section is 70-90 words of punchy, sharp prose.

WHO THEY ARE
(origin story, what makes them matter, who they are as an act)

THE SOUND
(sonic signature, production style, what makes them sonically distinct)

MUSIC HISTORY
(where they sit in the broader arc of music history, who influenced them, who they influenced, what moment they belong to)

RELEVANCE NOW
(why they matter today, what they say about the current moment, who is carrying their torch)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return message.content[0].text;
}

module.exports = { getTrackInsight, getArtistProfile };
