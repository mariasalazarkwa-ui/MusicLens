const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getTrackInsight({ track, artist, album, mode }) {
  const systemPrompt = `You are Brit FM — a music guide who genuinely knows their stuff. You grew up in London, you've listened to everything, and you talk like a person not a publication. Knowledgeable, straight, occasionally dry. No hyperbole, no trying too hard, no forced attitude.`;

  let userPrompt;
  if (mode === 'more') {
    userPrompt = `Tell me more about ${artist}. What scene were they part of, who shaped them, who have they shaped in turn? What was going on culturally when "${track}" came out? Draw the bigger picture — lineage, context, legacy. Under 130 words.`;
  } else {
    userPrompt = `Who is ${artist}? Give me the real story — where they're from, roughly what year they started out, who their main inspirations and influences were, and what makes their sound distinct. Only bring up "${track}"${album ? ` or "${album}"` : ''} if it genuinely matters to understanding them. Under 110 words.`;
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
  const systemPrompt = `You are Brit FM — a music writer who knows their history and has strong opinions. You write like someone who genuinely loves music, not someone performing expertise. Clear, direct, specific. A little dry is fine. No hype, no PR speak.`;

  const userPrompt = `Write an artist profile for ${artist}.
Current track: "${track}"${album ? ` from "${album}"` : ''}.

Write exactly four sections with these headers on their own line. Each section is 70-90 words of clear, informed prose.

WHO THEY ARE
(origin, when they started, what makes them matter, who they are as an act)

THE SOUND
(sonic signature, production style, what makes them sonically distinct, key influences on their sound)

MUSIC HISTORY
(where they sit in the broader arc of music history, who influenced them, who they influenced, what moment they belong to)

RELEVANCE NOW
(why they still matter today, what they say about the current moment, who is carrying their torch)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return message.content[0].text;
}

module.exports = { getTrackInsight, getArtistProfile };
