const axios = require('axios');
const querystring = require('querystring');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const SCOPES = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-read-playback-state',
].join(' ');

function getSpotifyAuthUrl(user) {
  const state = Buffer.from(user).toString('base64');
  const params = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

async function exchangeCode(code) {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );
  return response.data;
}

async function refreshToken(refresh_token) {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );
  return response.data;
}

async function getCurrentTrack(access_token) {
  const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (response.status === 204 || !response.data) return { playing: false };

  const { item, is_playing, progress_ms } = response.data;
  return {
    playing: is_playing,
    progress_ms,
    track: item.name,
    artist: item.artists.map((a) => a.name).join(', '),
    album: item.album.name,
    album_art: item.album.images[0]?.url,
    duration_ms: item.duration_ms,
    spotify_url: item.external_urls.spotify,
    track_id: item.id,
  };
}

async function getRecentTracks(access_token, limit = 10) {
  const response = await axios.get(
    `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  return response.data.items.map(({ track, played_at }) => ({
    played_at,
    track: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    album_art: track.album.images[0]?.url,
    track_id: track.id,
  }));
}

async function searchArtistImage(access_token, artistName) {
  const response = await axios.get(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const items = response.data.artists?.items;
  if (!items || items.length === 0) return null;
  return items[0].images?.[0]?.url || null;
}

module.exports = { getSpotifyAuthUrl, exchangeCode, refreshToken, getCurrentTrack, getRecentTracks, searchArtistImage };
