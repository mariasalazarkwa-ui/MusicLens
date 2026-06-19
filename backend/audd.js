const axios = require('axios');
const FormData = require('form-data');

const AUDD_API_KEY = process.env.AUDD_API_KEY;
const AUDD_ENDPOINT = 'https://api.audd.io/';

async function recognizeSong({ audio_url, audio_data }) {
  const form = new FormData();
  form.append('api_token', AUDD_API_KEY);
  form.append('return', 'spotify,apple_music');

  if (audio_url) {
    form.append('url', audio_url);
  } else if (audio_data) {
    // audio_data should be a base64 string; convert to buffer
    const buffer = Buffer.from(audio_data, 'base64');
    form.append('audio', buffer, { filename: 'clip.mp3', contentType: 'audio/mpeg' });
  }

  const response = await axios.post(AUDD_ENDPOINT, form, {
    headers: form.getHeaders(),
  });

  const { status, result, error } = response.data;

  if (status !== 'success' || !result) {
    return { recognized: false, error: error?.error_message || 'No match found' };
  }

  return {
    recognized: true,
    track: result.title,
    artist: result.artist,
    album: result.album,
    release_date: result.release_date,
    spotify: result.spotify
      ? {
          track_id: result.spotify.id,
          url: result.spotify.external_urls?.spotify,
          preview_url: result.spotify.preview_url,
          album_art: result.spotify.album?.images?.[0]?.url,
        }
      : null,
    apple_music: result.apple_music
      ? {
          url: result.apple_music.url,
          artwork: result.apple_music.artwork?.url?.replace('{w}x{h}', '400x400'),
        }
      : null,
  };
}

module.exports = { recognizeSong };
