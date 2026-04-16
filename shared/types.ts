// ─── Shared Types for MagnetiX İhtiyaç Panosu ───────────────────────────────

export type Stage = 'pool' | 'selected';

export type Level = 'L1' | 'L2' | 'L3';

export interface Need {
  id: string;
  text: string;
  stage: Stage;
  groupId?: string;
  consensus?: number;       // 0–1 arası, kaç uzman aynı gruba koydu
  originalNotes?: string[]; // Hangi uzmanlardan geldi
}

export interface Group {
  id: string;
  name: string;
  stage: Stage;
}

export interface L1Note {
  id: string;
  expertName: string;
  text: string;
  timestamp: string;
}

export interface ExpertResult {
  expertName: string;
  needs: { id: string; text: string; stage: string; groupId?: string; groupName?: string }[];
  groups: { id: string; name: string; stage: string }[];
}

// ─── Consensus Computation ───────────────────────────────────────────────────

export function computeConsensus(expertResults: ExpertResult[]): { mergedNeeds: Need[]; mergedGroups: Group[] } {
  const totalExperts = expertResults.length;
  const needTextMap: Record<string, {
    text: string;
    assignments: { groupName: string; expertName: string }[];
  }> = {};
  const allGroupNames = new Set<string>();

  for (const er of expertResults) {
    const groupMap: Record<string, string> = {};
    for (const g of er.groups) groupMap[g.id] = g.name;

    for (const n of er.needs) {
      const key = n.text.trim().toLowerCase().replace(/[.,;:!?]/g, '').replace(/\s+/g, ' ').trim();
      if (!key) continue;
      if (!needTextMap[key]) needTextMap[key] = { text: n.text, assignments: [] };
      const groupName = n.groupId ? (groupMap[n.groupId] || n.groupName || '') : '';
      needTextMap[key].assignments.push({ groupName, expertName: er.expertName });
      if (groupName) allGroupNames.add(groupName);
    }
  }

  const mergedGroups: Group[] = [];
  const groupNameToId: Record<string, string> = {};
  let gIdx = 0;
  for (const name of Array.from(allGroupNames)) {
    const gId = `mg_${gIdx++}`;
    groupNameToId[name] = gId;
    mergedGroups.push({ id: gId, name, stage: 'selected' });
  }

  const mergedNeeds: Need[] = [];
  let nIdx = 0;
  for (const key of Object.keys(needTextMap)) {
    const entry = needTextMap[key];
    const groupCounts: Record<string, number> = {};
    for (const a of entry.assignments) {
      if (a.groupName) groupCounts[a.groupName] = (groupCounts[a.groupName] || 0) + 1;
    }
    let bestGroup = '';
    let bestCount = 0;
    for (const gn of Object.keys(groupCounts)) {
      if (groupCounts[gn] > bestCount) { bestCount = groupCounts[gn]; bestGroup = gn; }
    }
    const consensus = bestGroup ? Math.round((bestCount / totalExperts) * 100) / 100 : 0;
    const isConsensus = consensus >= 0.25;
    mergedNeeds.push({
      id: `mn_${nIdx}`,
      text: entry.text,
      stage: isConsensus ? 'selected' : 'pool',
      groupId: isConsensus && bestGroup ? groupNameToId[bestGroup] : undefined,
      consensus,
      originalNotes: entry.assignments.map(a => `${a.expertName}: ${entry.text}`),
    });
    nIdx++;
  }

  // Filter out groups that have no needs assigned
  const usedGroupIds = new Set(mergedNeeds.filter(n => n.groupId).map(n => n.groupId));
  const finalGroups = mergedGroups.filter(g => usedGroupIds.has(g.id));

  return { mergedNeeds, mergedGroups: finalGroups };
}

// ─── L1 Parse + Dedup ────────────────────────────────────────────────────────

export function parseL1Notes(notes: L1Note[]): { text: string; category?: string }[] {
  const seen = new Set<string>();
  const items: { text: string; category?: string }[] = [];
  let currentCategory: string | undefined;

  for (const note of notes) {
    const lines = note.text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('-')) {
        const text = line.replace(/^-\s*/, '').trim();
        const key = text.toLowerCase().replace(/[.,;:!?]/g, '').replace(/\s+/g, ' ');
        if (text && !seen.has(key)) {
          seen.add(key);
          items.push({ text, category: currentCategory });
        }
      } else {
        currentCategory = line;
      }
    }
  }
  return items;
}
