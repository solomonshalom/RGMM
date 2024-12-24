import { ParsedWorkshopData, OutputFormat, WorkshopRelationship } from '../../types/workshop';

export function formatOutput(data: ParsedWorkshopData, format: OutputFormat): string {
  switch (format) {
    case 'flat':
      return formatFlat(data);
    case 'grouped':
      return formatGrouped(data);
    case 'relationship':
      return formatRelationship(data);
    default:
      return formatFlat(data);
  }
}

function formatFlat(data: ParsedWorkshopData): string {
  return [
    'Workshop IDs: ' + data.totalWorkshopIds.join(';'),
    'Mod IDs: ' + data.totalModIds.join(';')
  ].join('\n');
}

function formatGrouped(data: ParsedWorkshopData): string {
  return data.items.map(item => {
    const header = `Workshop ID: ${item.workshopId}`;
    const modIds = item.modIds.length ? `Mod IDs: ${item.modIds.join(';')}` : 'No Mod IDs found';
    const deps = item.dependencies?.length 
      ? `Dependencies: ${item.dependencies.join(';')}`
      : '';
    
    return [header, modIds, deps].filter(Boolean).join('\n');
  }).join('\n\n');
}

function formatRelationship(data: ParsedWorkshopData): string {
  const relationships: WorkshopRelationship[] = data.items.map(item => ({
    workshopId: item.workshopId,
    modIds: item.modIds.map(id => ({
      id,
      type: determineModType(id, item.description || ''),
      dependencies: item.dependencies
    }))
  }));

  return relationships.map(rel => {
    return rel.modIds.map(mod => {
      const type = mod.type ? ` (${mod.type})` : '';
      const deps = mod.dependencies?.length 
        ? ` [requires: ${mod.dependencies.join(', ')}]`
        : '';
      return `${mod.id}${type}: ${rel.workshopId}${deps}`;
    }).join('\n');
  }).join('\n');
}

function determineModType(modId: string, description: string): 'framework' | 'variant' | 'difficulty' | 'standard' {
  const lowerDesc = description.toLowerCase();
  if (/framework|library|api|core/i.test(lowerDesc)) return 'framework';
  if (/variant|version|model/i.test(lowerDesc)) return 'variant';
  if (/difficulty|mode|setting/i.test(lowerDesc)) return 'difficulty';
  return 'standard';
}