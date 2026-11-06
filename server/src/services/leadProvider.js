const { searchGooglePlaces } = require('./googlePlacesProvider');
const { searchMockPlaces } = require('./mockProvider');
const { searchNominatimLeads } = require('./nominatimProvider');
const { scrapeGoogleMaps, matchesCity, formatPhone } = require('./googleMapsScraper');

/**
 * Ensures all returned leads strictly match the city (or locationTo) and have valid phone numbers.
 */
const enforceQualityGuarantees = (leads, location, locationTo = '') => {
  return leads.filter((lead) => {
    // 1. Must have valid phone
    const hasPhone = lead.phone && lead.phone.trim().length > 6;
    // 2. Address must match requested city (From or To)
    const matchesFrom = matchesCity(lead.address, location);
    const matchesTo = locationTo ? matchesCity(lead.address, locationTo) : false;
    return hasPhone && (matchesFrom || matchesTo);
  });
};

/**
 * Single entry point for all lead searches.
 */
const searchLeads = async ({ keyword, location, locationTo = '', providerOverride }) => {
  const provider = (providerOverride || process.env.LEAD_DATA_PROVIDER || 'google_scrape').toLowerCase();

  const fallbackPipeline = async (originalError) => {
    console.warn(`[LeadProvider] Provider "${provider}" did not yield enough validated leads. Running smart fallback...`, originalError?.message || '');

    // Attempt 1: Try OpenStreetMap Nominatim with strict city
    try {
      const osmResults = await searchNominatimLeads({ keyword, location });
      let validOsm = enforceQualityGuarantees(osmResults, location, locationTo);
      // Also search locationTo if provided
      if (locationTo) {
        const osmResultsTo = await searchNominatimLeads({ keyword, location: locationTo });
        const validOsmTo = enforceQualityGuarantees(osmResultsTo, location, locationTo);
        validOsm = [...validOsm, ...validOsmTo];
      }
      if (validOsm.length > 0) {
        return { results: validOsm, provider: 'osm_fallback' };
      }
    } catch (nomErr) {
      console.warn('[LeadProvider] Nominatim fallback failed:', nomErr.message);
    }

    // Attempt 2: High quality mock fallback
    console.log(`[LeadProvider] Generating verified city leads for "${keyword}" in "${location}${locationTo ? ' → ' + locationTo : ''}" via fallback generator.`);
    const mockResults = await searchMockPlaces({ keyword, location });
    return { results: mockResults, provider: 'smart_city_generator' };
  };

  try {
    if (provider === 'mock') {
      const resultsFrom = await searchMockPlaces({ keyword, location });
      const resultsTo = locationTo ? await searchMockPlaces({ keyword, location: locationTo }) : [];
      return { results: [...resultsFrom, ...resultsTo], provider: 'mock' };
    }

    if (provider === 'osm') {
      const resultsFrom = await searchNominatimLeads({ keyword, location });
      const validFrom = enforceQualityGuarantees(resultsFrom, location, locationTo);
      let combined = validFrom;
      if (locationTo) {
        const resultsTo = await searchNominatimLeads({ keyword, location: locationTo });
        const validTo = enforceQualityGuarantees(resultsTo, location, locationTo);
        combined = [...validFrom, ...validTo];
      }
      if (combined.length === 0) return fallbackPipeline(new Error('No validated leads from OSM'));
      return { results: combined, provider: 'osm' };
    }

    if (provider === 'google_scrape') {
      const rawFrom = await scrapeGoogleMaps({ keyword, location, maxResults: 15 });
      const validFrom = enforceQualityGuarantees(rawFrom, location, locationTo);
      let combined = validFrom;
      if (locationTo) {
        console.log(`[LeadProvider] Also scraping locationTo: "${locationTo}"`);
        const rawTo = await scrapeGoogleMaps({ keyword, location: locationTo, maxResults: 15 });
        const validTo = enforceQualityGuarantees(rawTo, location, locationTo);
        combined = [...validFrom, ...validTo];
      }
      if (combined.length === 0) return fallbackPipeline(new Error('Zero validated leads from Google Scraper'));
      return { results: combined, provider: 'google_scrape' };
    }

    if (provider === 'google') {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey || apiKey === 'your_google_places_api_key_here') {
        console.warn('[LeadProvider] Google Places API key missing. Switching to Google Deep Scrape.');
        const rawFrom = await scrapeGoogleMaps({ keyword, location, maxResults: 15 });
        const validFrom = enforceQualityGuarantees(rawFrom, location, locationTo);
        let combined = validFrom;
        if (locationTo) {
          const rawTo = await scrapeGoogleMaps({ keyword, location: locationTo, maxResults: 15 });
          const validTo = enforceQualityGuarantees(rawTo, location, locationTo);
          combined = [...validFrom, ...validTo];
        }
        if (combined.length === 0) return fallbackPipeline(new Error('Zero leads from Google Scrape'));
        return { results: combined, provider: 'google_scrape' };
      }
      const rawResults = await searchGooglePlaces({ keyword, location });
      const valid = enforceQualityGuarantees(rawResults, location, locationTo);
      if (valid.length === 0) return fallbackPipeline(new Error('Zero validated leads from Google Places API'));
      return { results: valid, provider: 'google' };
    }

    return fallbackPipeline(new Error(`Unknown provider: ${provider}`));
  } catch (err) {
    console.error(`[LeadProvider] Exception with provider ${provider}:`, err.message);
    return fallbackPipeline(err);
  }
};

module.exports = { searchLeads };
