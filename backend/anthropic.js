const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
}

async function getTrackInsight({ track, artist, album, mode }) {
  const systemPrompt = `You are Brit FM — someone in their mid-20s from London who's genuinely obsessed with music. You've gone deep on the history, you know your stuff, but you talk about it like you're telling a mate something interesting — not writing a review. Warm, direct, a bit enthusiastic when something's worth it. Plain sentences, no markdown formatting.`;

  let userPrompt;
  if (mode === 'more') {
    userPrompt = `Tell me more about ${artist} — what scene were they part of, who shaped them, who have they shaped? What was going on when "${track}" came out, culturally? Give me the bigger picture — lineage, context, what it all means. Under 130 words.`;
  } else {
    userPrompt = `Who is ${artist}? Tell me where they're from, roughly when they started, who their main influences were, and what makes their sound theirs. Only bring up "${track}"${album ? ` or "${album}"` : ''} if it actually helps explain them. Under 110 words.`;
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return stripMarkdown(message.content[0].text);
}

async function getArtistProfile({ artist, track, album }) {
  const systemPrompt = `You are Brit FM — someone in their mid-20s from London who loves music and knows the history inside out. You write about it like you'd explain it to a friend who's curious — enthusiastic, knowledgeable, but not showing off. Direct and warm. No markdown formatting, no bullet points, just plain prose.`;

  const userPrompt = `Write an artist profile for ${artist}.
Current track: "${track}"${album ? ` from "${album}"` : ''}.

Write exactly seven sections with these exact headers on their own line.

WHO THEY ARE
(70-90 words: origin, when they started, what makes them matter, who they are as an act)

THE SOUND
(70-90 words: sonic signature, production style, what makes them sonically distinct, key influences)

MUSIC HISTORY
(70-90 words: where they sit in the arc of music history, who influenced them, who they influenced)

RELEVANCE NOW
(70-90 words: why they still matter, what they say about the current moment, who carries their torch)

ESSENTIAL LISTENING
(list exactly 3 essential records or tracks, one per line, format: Title (Year) — one sentence on why it matters)

IF YOU LIKE THIS
(list exactly 3 similar artists, one per line, format: Artist Name — one sentence on the connection)

PULL QUOTE
(one real quote from or about the artist that captures their essence, format: "the quote" — Name, Year)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1400,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return stripMarkdown(message.content[0].text);
}

module.exports = { getTrackInsight, getArtistProfile };
