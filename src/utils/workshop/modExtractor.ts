export function extractModIds(text: string): string[] {
  const patterns = [
    // Explicit Mod ID patterns
    /(?:Mod ID|ModID|Mod Id):?\s*([a-zA-Z][a-zA-Z0-9._-]+)/gi,
    /(?:ID|Id):?\s*([a-zA-Z][a-zA-Z0-9._-]+)/gi,
    
    // Framework patterns
    /(?:Framework|Library|API):?\s*([a-zA-Z][a-zA-Z0-9._-]+)/gi,
    
    // Common mod naming patterns
    /(?:^|\s)([a-zA-Z][a-zA-Z0-9._-]{2,}(?:\.mod)?)\b/gm,
    
    // Specific mod formats
    /\b([a-zA-Z][a-zA-Z0-9]+_[a-zA-Z0-9]+)\b/g, // word_word format
    /\b([a-zA-Z][a-zA-Z0-9]+\.[a-zA-Z0-9]+)\b/g  // word.word format
  ];

  const modIds = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const id = match[1].trim();
      if (isValidModId(id)) {
        modIds.add(id);
      }
    }
  }

  return Array.from(modIds);
}

function isValidModId(id: string): boolean {
  // Common words to filter out
  const blacklist = [
    'mod', 'map', 'workshop', 'the', 'and', 'for', 'version',
    'game', 'item', 'content', 'download', 'subscribe', 'description',
    'info', 'details', 'steam', 'collection', 'update', 'latest',
    'required', 'optional', 'compatible', 'author', 'created', 'updated'
  ];
  
  return (
    // Must be 3-50 characters
    id.length >= 3 && id.length <= 50 &&
    // Must start with a letter
    /^[a-zA-Z]/.test(id) &&
    // Must contain only valid characters
    /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(id) &&
    // Must not be in blacklist
    !blacklist.includes(id.toLowerCase()) &&
    // Must not be a common file extension
    !/\.(txt|jpg|png|gif|zip)$/i.test(id)
  );
}