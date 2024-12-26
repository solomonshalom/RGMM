// Regular expression patterns for extracting IDs
export const patterns = {
  // Match Workshop IDs from URLs or explicit mentions
  workshopId: /(?:steamcommunity\.com\/sharedfiles\/filedetails\/\?id=|Workshop ID:?\s*)(\d{9,10})(?:\s|$|;|,)/gi,

  // Match Mod IDs with various formats
  modId: [
    // Standard format: Mod ID: xyz
    /(?:Mod(?:\s?)ID)(?:\:)(?:[\s+])([\w._&-]+)/gi,
    // Multiple IDs format: Mod IDs: xyz, abc
    /(?:Mod(?:\s?)IDs?)(?:\:)(?:[\s+])([\w._&-]+(?:\s*,\s*[\w._&-]+)*)/gi,
    // Required IDs format: Required IDs: xyz, abc
    /(?:Required(?:\s?)IDs?)(?:\:)(?:[\s+])([\w._&-]+(?:\s*,\s*[\w._&-]+)*)/gi,
    // Dependencies format: Dependencies: xyz, abc
    /(?:Dependencies?)(?:\:)(?:[\s+])([\w._&-]+(?:\s*,\s*[\w._&-]+)*)/gi
  ],

  // Match Map IDs
  mapId: /(?:Map ID:?\s*|map=)(map_[a-zA-Z0-9._-]+)(?:\s|$|;|,)/gi,

  // URL patterns
  workshopUrl: /steamcommunity\.com\/sharedfiles\/filedetails\/\?id=(\d+)/i
};