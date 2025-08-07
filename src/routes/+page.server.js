import { SWID, ESPN_S2 } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const leagueId = 3925;
  const season = 2025;

  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;

  try {
    const res = await fetch(url, {
      headers: {
        cookie: `SWID=${SWID}; espn_s2=${ESPN_S2}`,
        'User-Agent': 'Mozilla/5.0',
        referer: 'https://fantasy.espn.com/'
      }
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return { league: json }; // ✅ SvelteKit expects this structure
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      throw new Error('Invalid JSON response from ESPN API');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Server error fetching ESPN data');
  }
}
