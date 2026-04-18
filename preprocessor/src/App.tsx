import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LogIn,
  Sparkles,
  Cpu,
  Check,
  X,
  GripVertical,
  Users,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  Plus,
  Download,
  Merge,
  FolderPlus,
} from 'lucide-react';
import { cn } from './lib/utils';
import { MOCK_L1_NOTES } from '@shared/mockData';
import type { L1Note } from '@shared/types';
import {
  parseAndDedup,
  categorizeAllByRules,
  categorizeWithLLM,
  type ParsedNeed,
  type PreprocessedGroup,
  type PreprocessResult,
} from '@shared/categorize';
import {
  getL1Notes,
  savePreprocessed,
  listSessions,
  createSession,
  updateSessionStatus,
  type Session,
} from '@shared/firestoreService';

// ─── Color palette for groups ────────────────────────────────────────────────

const GROUP_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-200 text-blue-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-200 text-emerald-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-800', badge: 'bg-amber-200 text-amber-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100', text: 'text-purple-800', badge: 'bg-purple-200 text-purple-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-100', text: 'text-rose-800', badge: 'bg-rose-200 text-rose-800' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-100', text: 'text-cyan-800', badge: 'bg-cyan-200 text-cyan-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-200 text-orange-800' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-100', text: 'text-indigo-800', badge: 'bg-indigo-200 text-indigo-800' },
];

// ─── Sortable Need Card ──────────────────────────────────────────────────────

function SortableNeedCard({
  need,
  color,
  onEdit,
  onDelete,
  selected,
  onSelect,
}: {
  need: ParsedNeed;
  color?: typeof GROUP_COLORS[0];
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: need.id });
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(need.text);

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => onSelect?.(need.id)}
      className={cn(
        'group flex items-start gap-2 rounded-lg border p-2.5 text-sm transition-shadow cursor-pointer',
        color ? `${color.bg} ${color.border}` : 'bg-white border-gray-200',
        isDragging && 'shadow-lg ring-2 ring-blue-300',
        selected && 'ring-2 ring-purple-500 border-purple-400 bg-purple-50/50',
      )}
    >
      <button {...attributes} {...listeners} className="mt-0.5 cursor-grab text-gray-400 hover:text-gray-600 shrink-0" onClick={e => e.stopPropagation()}>
        <GripVertical size={14} />
      </button>

      {/* Selection checkbox */}
      <div className="mt-0.5 shrink-0">
        <div className={cn(
          'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
          selected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 bg-white',
        )}>
          {selected && <Check size={10} className="text-white" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <input
              className="flex-1 rounded border border-gray-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onEdit(need.id, editText); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <button onClick={() => { onEdit(need.id, editText); setEditing(false); }} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-1">
            <span className="leading-snug">{need.text}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setEditText(need.text); setEditing(true); }} className="p-0.5 text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
              <button onClick={() => onDelete(need.id)} className="p-0.5 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium', color?.badge || 'bg-gray-100 text-gray-600')}>
            <Users size={10} /> {need.frequency}
          </span>
          <span className="truncate">{need.experts.slice(0, 3).join(', ')}{need.experts.length > 3 ? ` +${need.experts.length - 3}` : ''}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Group Panel ─────────────────────────────────────────────────────────────

function GroupPanel({
  group,
  colorIdx,
  onEditNeed,
  onDeleteNeed,
  onRenameGroup,
  onDeleteGroup,
  collapsed,
  onToggle,
  selectedIds,
  onSelectNeed,
}: {
  group: PreprocessedGroup;
  colorIdx: number;
  onEditNeed: (id: string, text: string) => void;
  onDeleteNeed: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  selectedIds: Set<string>;
  onSelectNeed: (id: string) => void;
}) {
  const color = GROUP_COLORS[colorIdx % GROUP_COLORS.length];
  const [renaming, setRenaming] = useState(false);
  const [nameText, setNameText] = useState(group.name);

  return (
    <motion.div layout className={cn('rounded-xl border overflow-hidden', color.border, color.bg)}>
      <div className={cn('flex items-center gap-2 px-3 py-2', color.header)}>
        <button onClick={onToggle} className="shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        {renaming ? (
          <div className="flex flex-1 gap-1">
            <input
              className="flex-1 rounded border px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={nameText}
              onChange={e => setNameText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onRenameGroup(group.id, nameText); setRenaming(false); } if (e.key === 'Escape') setRenaming(false); }}
              autoFocus
            />
            <button onClick={() => { onRenameGroup(group.id, nameText); setRenaming(false); }} className="text-green-600"><Check size={14} /></button>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-between min-w-0">
            <span className={cn('font-semibold text-sm truncate', color.text)}>{group.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', color.badge)}>{group.needs.length}</span>
              <button onClick={() => { setNameText(group.name); setRenaming(true); }} className="p-0.5 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100"><Pencil size={12} /></button>
              <button onClick={() => onDeleteGroup(group.id)} className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-2 pb-2"
          >
            <SortableContext items={group.needs.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 mt-2">
                {group.needs.map(need => (
                  <SortableNeedCard
                    key={need.id}
                    need={need}
                    color={color}
                    onEdit={onEditNeed}
                    onDelete={onDeleteNeed}
                    selected={selectedIds.has(need.id)}
                    onSelect={onSelectNeed}
                  />
                ))}
              </div>
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

type Step = 'login' | 'process' | 'review';

export default function App() {
  const isMock = import.meta.env.VITE_MOCK === 'true';
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Login
  const [step, setStep] = useState<Step>('login');
  const [userName, setUserName] = useState('');

  // Session
  const [sessionId, setSessionId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    setSessionsLoading(true);
    listSessions()
      .then(s => { setSessions(s); if (s.length > 0) { setSessionId(s[0].id); } else { setCreateMode(true); } })
      .catch(() => { setCreateMode(true); })
      .finally(() => setSessionsLoading(false));
  }, []);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [parsedNeeds, setParsedNeeds] = useState<ParsedNeed[]>([]);
  const [result, setResult] = useState<PreprocessResult | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // DnD
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Multi-select & Merge
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeText, setMergeText] = useState('');
  const [mergePickedId, setMergePickedId] = useState<string | null>(null);

  // New category
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectedNeeds = useMemo(() => {
    if (!result) return [];
    const all = [...result.groups.flatMap(g => g.needs), ...result.unassigned];
    return all.filter(n => selectedIds.has(n.id));
  }, [result, selectedIds]);

  // ── L1 notes source ────────────────────────────────────────────────

  const [l1Source, setL1Source] = useState<'mock' | 'localStorage' | 'file' | null>(null);
  const [importedL1Notes, setImportedL1Notes] = useState<L1Note[] | null>(null);
  const l1FileRef = useCallback((node: HTMLInputElement | null) => { if (node) node.value = ''; }, []);

  // Check localStorage for L1 notes on mount
  const localL1Notes = useMemo<L1Note[]>(() => {
    try {
      const raw = localStorage.getItem('magnetix_l1_notes');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      return parsed.map((n: any) => ({
        id: n.id || `l1-${Date.now()}-${Math.random()}`,
        expertName: n.expertName || 'Bilinmeyen',
        text: n.text || '',
        timestamp: n.timestamp || '',
      }));
    } catch { return []; }
  }, []);

  const handleL1FileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        // Support both array format and single-object format
        const arr = Array.isArray(data) ? data : [data];
        const notes: L1Note[] = arr.map((n: any, i: number) => ({
          id: n.id || `imported-${i}`,
          expertName: n.expertName || 'Bilinmeyen',
          text: n.text || (Array.isArray(n.notes) ? n.notes.join('\n') : ''),
          timestamp: n.timestamp || '',
        }));
        setImportedL1Notes(notes);
        setL1Source('file');
      } catch (err) {
        alert('Gecersiz JSON dosyasi');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── Step 1: Parse + Dedup ──────────────────────────────────────────

  const handleProcess = useCallback(async (source: 'mock' | 'localStorage' | 'file' | 'firestore') => {
    setLoading(true);
    let notes: L1Note[];

    if (source === 'firestore' && sessionId) {
      try {
        const firestoreNotes = await getL1Notes(sessionId);
        notes = firestoreNotes.map((n, i) => ({
          id: `fs-${i}`,
          expertName: n.expertName,
          text: n.text,
          timestamp: n.timestamp,
        }));
        if (notes.length === 0) {
          alert('Firestore\'da bu oturum icin L1 notu bulunamadi.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Firestore L1 read error', e);
        alert('Firestore\'dan okunamadi. Baska kaynak deneyin.');
        setLoading(false);
        return;
      }
    } else if (source === 'file' && importedL1Notes) {
      notes = importedL1Notes;
    } else if (source === 'localStorage' && localL1Notes.length > 0) {
      notes = localL1Notes;
    } else {
      notes = MOCK_L1_NOTES;
    }

    const parsed = parseAndDedup(notes);
    setParsedNeeds(parsed);

    const res = categorizeAllByRules(parsed);
    setResult(res);
    setLoading(false);
    setStep('review');
  }, [importedL1Notes, localL1Notes, sessionId]);

  // ── LLM Re-categorize ─────────────────────────────────────────────

  const [llmError, setLlmError] = useState<string | null>(null);

  const handleLLMCategorize = useCallback(async () => {
    if (!geminiKey || !result) return;
    setLlmLoading(true);
    setLlmError(null);
    try {
      // Gather all current needs from result (groups + unassigned)
      const allNeeds = [
        ...result.groups.flatMap(g => g.needs),
        ...result.unassigned,
      ].map(n => ({ ...n, assignedGroup: undefined }));

      const res = await categorizeWithLLM(allNeeds, geminiKey);
      setResult(res);
      setParsedNeeds(allNeeds);
    } catch (err: any) {
      console.error('LLM error:', err);
      setLlmError(err?.message || 'LLM kategorize basarisiz');
    } finally {
      setLlmLoading(false);
    }
  }, [geminiKey, result]);

  // ── Edit / Delete operations ───────────────────────────────────────

  const editNeed = useCallback((id: string, text: string) => {
    setResult(prev => {
      if (!prev) return prev;
      const update = (needs: ParsedNeed[]) => needs.map(n => n.id === id ? { ...n, text } : n);
      return {
        groups: prev.groups.map(g => ({ ...g, needs: update(g.needs) })),
        unassigned: update(prev.unassigned),
      };
    });
  }, []);

  const deleteNeed = useCallback((id: string) => {
    setResult(prev => {
      if (!prev) return prev;
      return {
        groups: prev.groups.map(g => ({ ...g, needs: g.needs.filter(n => n.id !== id) })).filter(g => g.needs.length > 0),
        unassigned: prev.unassigned.filter(n => n.id !== id),
      };
    });
  }, []);

  const renameGroup = useCallback((id: string, name: string) => {
    setResult(prev => {
      if (!prev) return prev;
      return { ...prev, groups: prev.groups.map(g => g.id === id ? { ...g, name } : g) };
    });
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setResult(prev => {
      if (!prev) return prev;
      const group = prev.groups.find(g => g.id === id);
      if (!group) return prev;
      return {
        groups: prev.groups.filter(g => g.id !== id),
        unassigned: [...prev.unassigned, ...group.needs],
      };
    });
  }, []);

  // ── Merge selected needs ──────────────────────────────────────────

  const openMergeModal = useCallback(() => {
    if (selectedNeeds.length < 2) return;
    setMergePickedId(selectedNeeds[0].id);
    setMergeText(selectedNeeds[0].text);
    setShowMergeModal(true);
  }, [selectedNeeds]);

  const executeMerge = useCallback(() => {
    if (!result || selectedIds.size < 2) return;
    const finalText = mergeText.trim();
    if (!finalText) return;

    // Combine experts (deduplicated) and sum frequency
    const allExperts = [...new Set(selectedNeeds.flatMap(n => n.experts))];
    const totalFrequency = allExperts.length;

    const mergedNeed: ParsedNeed = {
      id: `merged-${Date.now()}`,
      text: finalText,
      frequency: totalFrequency,
      experts: allExperts,
    };

    // Find which container the first selected need is in — merged card goes there
    let targetContainer = 'unassigned';
    for (const g of result.groups) {
      if (g.needs.some(n => selectedIds.has(n.id))) {
        targetContainer = g.id;
        break;
      }
    }

    setResult(prev => {
      if (!prev) return prev;
      // Remove all selected needs from everywhere
      let newGroups = prev.groups.map(g => ({
        ...g,
        needs: g.needs.filter(n => !selectedIds.has(n.id)),
      }));
      let newUnassigned = prev.unassigned.filter(n => !selectedIds.has(n.id));

      // Add merged need to target
      if (targetContainer === 'unassigned') {
        newUnassigned = [mergedNeed, ...newUnassigned];
      } else {
        newGroups = newGroups.map(g =>
          g.id === targetContainer ? { ...g, needs: [mergedNeed, ...g.needs] } : g
        );
      }

      // Remove empty groups
      newGroups = newGroups.filter(g => g.needs.length > 0);

      return { groups: newGroups, unassigned: newUnassigned };
    });

    setSelectedIds(new Set());
    setShowMergeModal(false);
    setMergeText('');
    setMergePickedId(null);
  }, [result, selectedIds, selectedNeeds, mergeText]);

  // ── Add new category ──────────────────────────────────────────────

  const addNewCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name || !result) return;
    const newGroup: PreprocessedGroup = {
      id: `group-custom-${Date.now()}`,
      name,
      needs: [],
    };
    setResult(prev => prev ? { ...prev, groups: [...prev.groups, newGroup] } : prev);
    setNewCategoryName('');
    setShowNewCategory(false);
  }, [newCategoryName, result]);

  // ── DnD ────────────────────────────────────────────────────────────

  const allNeedsFlat = useMemo(() => {
    if (!result) return [];
    return [...result.groups.flatMap(g => g.needs), ...result.unassigned];
  }, [result]);

  const activeNeed = useMemo(() => activeId ? allNeedsFlat.find(n => n.id === activeId) : null, [activeId, allNeedsFlat]);

  function findContainer(needId: string): string {
    if (!result) return 'unassigned';
    for (const g of result.groups) {
      if (g.needs.some(n => n.id === needId)) return g.id;
    }
    return 'unassigned';
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !result) return;

    const activeContainer = findContainer(active.id as string);
    let overContainer: string;

    // Check if dropping over a group header (droppable area)
    if (result.groups.some(g => g.id === over.id)) {
      overContainer = over.id as string;
    } else if (over.id === 'unassigned') {
      overContainer = 'unassigned';
    } else {
      overContainer = findContainer(over.id as string);
    }

    if (activeContainer === overContainer) return;

    setResult(prev => {
      if (!prev) return prev;

      // Remove from source
      let movedNeed: ParsedNeed | undefined;
      let newGroups = prev.groups.map(g => {
        if (g.id === activeContainer) {
          const idx = g.needs.findIndex(n => n.id === active.id);
          if (idx >= 0) {
            movedNeed = g.needs[idx];
            return { ...g, needs: g.needs.filter(n => n.id !== active.id) };
          }
        }
        return g;
      });
      let newUnassigned = [...prev.unassigned];
      if (activeContainer === 'unassigned') {
        const idx = newUnassigned.findIndex(n => n.id === active.id);
        if (idx >= 0) {
          movedNeed = newUnassigned[idx];
          newUnassigned = newUnassigned.filter(n => n.id !== active.id);
        }
      }

      if (!movedNeed) return prev;

      // Add to target
      if (overContainer === 'unassigned') {
        newUnassigned.push(movedNeed);
      } else {
        newGroups = newGroups.map(g => {
          if (g.id === overContainer) {
            return { ...g, needs: [...g.needs, movedNeed!] };
          }
          return g;
        });
      }

      // Remove empty groups
      newGroups = newGroups.filter(g => g.needs.length > 0);

      return { groups: newGroups, unassigned: newUnassigned };
    });
  };

  // ── Export / Save ──────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!result) return;

    const exportData = {
      preprocessedBy: userName,
      timestamp: new Date().toISOString(),
      groups: result.groups.map(g => ({
        name: g.name,
        needs: g.needs.map(n => ({ text: n.text, frequency: n.frequency, experts: n.experts })),
      })),
      unassigned: result.unassigned.map(n => ({ text: n.text, frequency: n.frequency, experts: n.experts })),
    };

    // Save to Firestore
    if (sessionId) {
      try {
        await savePreprocessed(sessionId, exportData);
        await updateSessionStatus(sessionId, 'l2');
      } catch (e) { console.error('Firestore T2 save error', e); }
    }

    // Save to localStorage for Expert L2 to read (fallback)
    localStorage.setItem('magnetix_preprocessed', JSON.stringify(exportData));

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preprocessed-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, userName, sessionId]);

  // ── Toggle collapse ────────────────────────────────────────────────

  const toggleCollapse = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!result) return null;
    const totalNeeds = result.groups.reduce((s, g) => s + g.needs.length, 0) + result.unassigned.length;
    return { totalNeeds, groupCount: result.groups.length, unassigned: result.unassigned.length };
  }, [result]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  // ── Login ──────────────────────────────────────────────────────────

  if (step === 'login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur"
        >
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-3">
              <Cpu size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MagnetiX</h1>
            <p className="text-sm text-gray-500 mt-1">On Isleme Panosu</p>
          </div>

          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!userName.trim()) return;
              // Create session if in create mode
              if (createMode && sessionName.trim()) {
                const id = `session_${Date.now()}`;
                try {
                  await createSession({ id, name: sessionName.trim(), createdBy: userName.trim(), status: 'l1' });
                } catch (err) {
                  console.warn('Firestore session create failed, continuing offline:', err);
                }
                setSessionId(id);
              }
              setStep('process');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adiniz</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Moderator adi"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oturum</label>
              {sessionsLoading ? (
                <p className="text-xs text-gray-400 py-2">Yükleniyor...</p>
              ) : createMode ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Yeni oturum adı (ör: Deprem Eğitim 2026)"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                  />
                  {sessions.length > 0 && (
                    <button type="button" onClick={() => setCreateMode(false)} className="text-xs text-blue-600 hover:underline">
                      Mevcut oturum sec
                    </button>
                  )}
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={sessionId}
                    onChange={e => setSessionId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setCreateMode(true)} className="text-xs text-blue-600 hover:underline">
                    + Yeni oturum olustur
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Oturum adı (ör: Deprem Eğitim 2026)"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">Ilk oturumu siz olusturuyorsunuz.</p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!userName.trim() || (createMode && !sessionName.trim()) || (!createMode && sessions.length === 0 && !sessionName.trim())}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 transition"
            >
              <LogIn size={16} /> Giris Yap
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Process (loading) ──────────────────────────────────────────────

  if (step === 'process') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur text-center"
        >
          <Cpu size={48} className="mx-auto text-indigo-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">L1 Notlarini Isle</h2>
          <p className="text-sm text-gray-500 mb-6">
            Veri kaynagi secin, parse + dedup + kural tabanli kategorize yapilacak.
          </p>

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <span className="text-sm text-gray-500">Isleniyor...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* JSON file import */}
              <div>
                <input type="file" accept=".json" onChange={handleL1FileImport} className="hidden" id="l1-file-input" />
                <label
                  htmlFor="l1-file-input"
                  className={cn(
                    'flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium cursor-pointer transition',
                    importedL1Notes
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-400 hover:text-blue-600',
                  )}
                >
                  <Save size={16} />
                  {importedL1Notes
                    ? `${importedL1Notes.length} not yuklendi (JSON)`
                    : 'L1 Notlari JSON Yukle'}
                </label>
              </div>

              {/* Source buttons */}
              <div className="grid grid-cols-1 gap-2">
                {sessionId && (
                  <button
                    onClick={() => handleProcess('firestore')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    <Sparkles size={16} /> Firestore'dan Isle (oturum: {sessions.find(s => s.id === sessionId)?.name || sessionId})
                  </button>
                )}

                {importedL1Notes && (
                  <button
                    onClick={() => handleProcess('file')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:from-green-700 hover:to-emerald-700 transition"
                  >
                    <Sparkles size={16} /> Yuklenen JSON ile Isle ({importedL1Notes.length} not)
                  </button>
                )}

                {localL1Notes.length > 0 && (
                  <button
                    onClick={() => handleProcess('localStorage')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
                  >
                    <Save size={16} /> localStorage'dan Isle ({localL1Notes.length} not)
                  </button>
                )}

                <button
                  onClick={() => handleProcess('mock')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  <Cpu size={16} /> Mock Veri ile Isle (5 uzman)
                </button>
              </div>

              {!geminiKey && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                  Gemini API key bulunamadi — LLM kategorize devre disi, sadece kural tabanli kategorize yapilacak.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Review (main board) ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Cpu size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">On Isleme Panosu</h1>
              <p className="text-xs text-gray-500">{userName} - Moderator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats && (
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 mr-4">
                <span><strong className="text-gray-700">{stats.totalNeeds}</strong> ihtiyac</span>
                <span><strong className="text-gray-700">{stats.groupCount}</strong> grup</span>
                <span><strong className="text-amber-600">{stats.unassigned}</strong> atanamayan</span>
              </div>
            )}

            {selectedIds.size >= 2 && (
              <button
                onClick={openMergeModal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition"
              >
                <Merge size={12} />
                Birlestir ({selectedIds.size})
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={12} />
                Secimi Temizle
              </button>
            )}

            {geminiKey && (
              <button
                onClick={handleLLMCategorize}
                disabled={llmLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-40 transition"
              >
                {llmLoading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
                ) : (
                  <Sparkles size={12} />
                )}
                LLM ile Yeniden Kategorize
              </button>
            )}

            {llmError && (
              <span className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{llmError}</span>
            )}

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:from-green-700 hover:to-emerald-700 transition"
            >
              <Download size={12} /> Onayla & Kaydet
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Main: Groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Kategoriler</h2>
                {showNewCategory ? (
                  <div className="flex items-center gap-1">
                    <input
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Kategori adi..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addNewCategory(); if (e.key === 'Escape') setShowNewCategory(false); }}
                      autoFocus
                    />
                    <button onClick={addNewCategory} className="p-1 text-green-600 hover:text-green-800"><Check size={16} /></button>
                    <button onClick={() => setShowNewCategory(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCategory(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
                  >
                    <FolderPlus size={14} /> Yeni Kategori
                  </button>
                )}
              </div>
              {result?.groups.map((group, idx) => (
                <GroupPanel
                  key={group.id}
                  group={group}
                  colorIdx={idx}
                  onEditNeed={editNeed}
                  onDeleteNeed={deleteNeed}
                  onRenameGroup={renameGroup}
                  onDeleteGroup={deleteGroup}
                  collapsed={collapsedGroups.has(group.id)}
                  onToggle={() => toggleCollapse(group.id)}
                  selectedIds={selectedIds}
                  onSelectNeed={toggleSelect}
                />
              ))}
            </div>

            {/* Sidebar: Unassigned */}
            <div>
              <div className="sticky top-20">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  Atanamayan
                  {result && result.unassigned.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {result.unassigned.length}
                    </span>
                  )}
                </h2>
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-3 min-h-[200px] max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
                  <SortableContext items={result?.unassigned.map(n => n.id) || []} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                      <AnimatePresence>
                        {result?.unassigned.map(need => (
                          <SortableNeedCard
                            key={need.id}
                            need={need}
                            onEdit={editNeed}
                            onDelete={deleteNeed}
                            selected={selectedIds.has(need.id)}
                            onSelect={toggleSelect}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                  {result?.unassigned.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">Tum ihtiyaclar kategorize edildi</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeNeed && (
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-2.5 text-sm shadow-xl ring-2 ring-blue-400">
              <span>{activeNeed.text}</span>
              <div className="text-xs text-gray-500 mt-1">
                <Users size={10} className="inline mr-1" />{activeNeed.frequency} uzman
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Merge Modal */}
      <AnimatePresence>
        {showMergeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMergeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Merge size={20} className="text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Ihtiyaclari Birlestir</h3>
              </div>

              <p className="text-sm text-gray-500 mb-3">{selectedNeeds.length} ihtiyac secildi. Birini secin veya yeni metin yazin:</p>

              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {selectedNeeds.map(need => (
                  <label
                    key={need.id}
                    className={cn(
                      'flex items-start gap-2 rounded-lg border p-2.5 text-sm cursor-pointer transition',
                      mergePickedId === need.id ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-300' : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <input
                      type="radio"
                      name="mergePick"
                      checked={mergePickedId === need.id}
                      onChange={() => { setMergePickedId(need.id); setMergeText(need.text); }}
                      className="mt-0.5 accent-purple-600"
                    />
                    <div>
                      <span>{need.text}</span>
                      <div className="text-xs text-gray-400 mt-0.5">{need.frequency} uzman</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sonuc metni (duzenleyebilirsiniz):</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  rows={3}
                  value={mergeText}
                  onChange={e => { setMergeText(e.target.value); setMergePickedId(null); }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Iptal
                </button>
                <button
                  onClick={executeMerge}
                  disabled={!mergeText.trim()}
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition"
                >
                  <Merge size={14} className="inline mr-1" />
                  Birlestir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
