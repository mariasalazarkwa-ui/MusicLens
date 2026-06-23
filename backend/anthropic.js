const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
}

const VOICE = `You are a music writer for Brit FM. You know the history deeply, you've heard everything, and you are not easily impressed. Your writing is specific and observational — you earn any praise with a precise detail rather than a general superlative. If something is genuinely great, say so in one clear sentence and move on. If something is solid but overhyped, you can say that. If it's just fine, say it's fine. You do not use words like groundbreaking, iconic, visionary, revolutionary, essential, or timeless unless you can back them up with a specific reason in the same sentence. No AI optimism. No cheerleading. Plain sentences, no markdown formatting.`;

async function getTrackInsight({ track, artist, album, mode }) {
  let userPrompt;
  if (mode === 'more') {
    userPrompt = `Tell me more about ${artist} — what scene were they part of, who shaped them, who have they shaped? What was going on culturally when "${track}" came out? Give me the lineage and context, not a sales pitch. Under 130 words.`;
  } else {
    userPrompt = `Who is ${artist}? Where are they from, roughly when did they start, who were their main influences, and what makes their sound theirs — for better or worse. Only mention "${track}"${album ? ` or "${album}"` : ''} if it genuinely helps explain them. Under 110 words.`;
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: userPrompt }],
    system: VOICE,
  });

  return stripMarkdown(message.content[0].text);
}

async function getArtistProfile({ artist, track, album }) {
  const userPrompt = `Write an artist profile for ${artist}.
Current track: "${track}"${album ? ` from "${album}"` : ''}.

Write exactly seven sections with these exact headers on their own line. Be specific and observational. Do not oversell. If they're brilliant, say exactly why in concrete terms. If they're divisive or flawed, say that too.

WHO THEY ARE
(70-90 words: origin, when they started, what kind of act they are — honestly, not as a press release)

THE SOUND
(70-90 words: what they actually sound like, who influenced them, what is distinct or derivative about it)

MUSIC HISTORY
(70-90 words: where they fit in the arc of music history — not where they'd like to fit, where they actually do)

RELEVANCE NOW
(70-90 words: what they mean right now — are they still vital, coasting, influential, or a reference point? Be honest)

ESSENTIAL LISTENING
(exactly 3 records or tracks, one per line, format: Title (Year) — one sentence on what it tells you about them)

IF YOU LIKE THIS
(exactly 3 artists, one per line, format: Artist Name — one sentence on the actual connection)

PULL QUOTE
(one real, attributed quote from or about the artist — something that captures how they actually think or are seen, format: "quote" — Name, Year)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1400,
    messages: [{ role: 'user', content: userPrompt }],
    system: VOICE,
  });

  return stripMarkdown(message.content[0].text);
}

module.exports = { getTrackInsight, getArtistProfile };
