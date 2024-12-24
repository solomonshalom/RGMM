export function extractWorkshopIds(text: string): string[] {
  const patterns = [
    // URL pattern
    /steamcommunity\.com\/sharedfiles\/filedetails\/\?id=(\d{9,10})/g,
    // Explicit Workshop ID pattern
    /Workshop ID:?\s*(\d{9,10})/gi,
    // Simple numeric pattern (with validation)
    /\b(\d{9,10})\b/g
  ];

  const workshopIds = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const id = match[1].trim();
      if (isValidWorkshopId(id)) {
        workshopIds.add(id);
      }
    }
  }

  return Array.from(workshopIds);
}

function isValidWorkshopId(id: string): boolean {
  // Workshop IDs are typically 9-10 digits
  return /^\d{9,10}$/.test(id);
}