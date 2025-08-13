import { json } from '@sveltejs/kit';

// In-memory cache for NFL players data
let playersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache for detailed player data
let detailedPlayerCache = new Map();

async function fetchDetailedPlayerData(playerId) {
  // Check cache first
  if (detailedPlayerCache.has(playerId)) {
    return detailedPlayerCache.get(playerId);
  }

  try {
    // Fetch detailed player data from ESPN
    const playerResponse = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${playerId}`);
    
    if (!playerResponse.ok) {
      throw new Error(`ESPN player API returned ${playerResponse.status}`);
    }

    const playerData = await playerResponse.json();
    
    let teamData = null;
    
    // Fetch team data if team URL exists
    if (playerData.team?.$ref) {
      try {
        const teamResponse = await fetch(playerData.team.$ref);
        if (teamResponse.ok) {
          teamData = await teamResponse.json();
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    }

    const detailedData = {
      position: playerData.position?.abbreviation || playerData.position?.name || null,
      team: teamData?.abbreviation || null,
      teamName: teamData?.displayName || null
    };

    // Cache the result
    detailedPlayerCache.set(playerId, detailedData);
    
    return detailedData;
  } catch (error) {
    console.error(`Error fetching detailed data for player ${playerId}:`, error);
    return { position: null, team: null, teamName: null };
  }
}

export async function GET({ url }) {
  try {
    // Check for detailed player request
    const playerIdParam = url.searchParams.get('playerId');
    if (playerIdParam) {
      const detailedData = await fetchDetailedPlayerData(playerIdParam);
      return json(detailedData);
    }

    // Check if we need to fetch new data
    const now = Date.now();
    const shouldRefresh = !playersCache || !lastFetchTime || (now - lastFetchTime) > CACHE_DURATION;

    if (shouldRefresh) {
      console.log('Fetching fresh NFL players data from ESPN API...');
      
      const response = await fetch('https://sports.core.api.espn.com/v3/sports/football/nfl/athletes?limit=20000&active=true');
      
      if (!response.ok) {
        throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform and cache the players data
      playersCache = data.items?.map(athlete => ({
        id: athlete.id,
        name: athlete.displayName || athlete.fullName || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
        fullName: athlete.fullName || athlete.displayName || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        position: athlete.position?.abbreviation || athlete.position?.name || 'N/A',
        team: athlete.team?.abbreviation || 'FA',
        teamName: athlete.team?.displayName || 'Free Agent',
        jersey: athlete.jersey,
        age: athlete.age,
        height: athlete.displayHeight || athlete.height,
        weight: athlete.displayWeight || athlete.weight,
        experience: athlete.experience?.years,
        headshot: athlete.headshot?.href,
        college: athlete.college?.name,
        birthPlace: athlete.birthPlace?.city && athlete.birthPlace?.state 
          ? `${athlete.birthPlace.city}, ${athlete.birthPlace.state}`
          : null,
        status: athlete.active ? 'Active' : 'Inactive'
      })).filter(player => 
        // Filter out invalid entries like "[35]", "[Downed]", etc.
        player.name && 
        !player.name.startsWith('[') && 
        !player.name.includes('[') &&
        player.name.length > 2 &&
        player.firstName && 
        player.lastName
      ) || [];

      lastFetchTime = now;
      console.log(`Cached ${playersCache.length} NFL players`);
    }

    // Handle search query
    const searchQuery = url.searchParams.get('search');
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const filteredPlayers = playersCache
        .filter(player => 
          player.name.toLowerCase().includes(query) ||
          player.fullName.toLowerCase().includes(query)
        )
        .slice(0, 10); // Limit to 10 results

      return json({
        players: filteredPlayers,
        total: filteredPlayers.length,
        cached: !shouldRefresh,
        lastUpdated: new Date(lastFetchTime).toISOString()
      });
    }

    // Return all players if no search query
    return json({
      players: playersCache,
      total: playersCache.length,
      cached: !shouldRefresh,
      lastUpdated: new Date(lastFetchTime).toISOString()
    });

  } catch (error) {
    console.error('Error fetching NFL players:', error);
    
    // If we have cached data, return it even if refresh failed
    if (playersCache) {
      console.log('Returning cached data due to fetch error');
      return json({
        players: playersCache,
        total: playersCache.length,
        cached: true,
        lastUpdated: new Date(lastFetchTime).toISOString(),
        error: 'Failed to refresh data, returning cached results'
      });
    }

    return json(
      { 
        error: 'Failed to fetch NFL players data',
        players: [],
        total: 0
      }, 
      { status: 500 }
    );
  }
}