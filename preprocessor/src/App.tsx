import { useState, useMemo, useCallback } from 'react';
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
  onMerge,
  showMerge,
}: {
  need: ParsedNeed;
  color?: typeof GROUP_COLORS[0];
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onMerge?: (id: string) => void;
  showMerge?: boolean;
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
      className={cn(
        'group flex items-start gap-2 rounded-lg border p-2.5 text-sm transition-shadow',
        color ? `${color.bg} ${color.border}` : 'bg-white border-gray-200',
        isDragging && 'shadow-lg ring-2 ring-blue-300',
      )}
    >
      <button {...attributes} {...listeners} className="mt-0.5 cursor-grab text-gray-400 hover:text-gray-600 shrink-0">
        <GripVertical size={14} />
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-1">
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
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {showMerge && onMerge && (
                <button onClick={() => onMerge(need.id)} title="Birleştir" className="p-0.5 text-purple-400 hover:text-purple-600"><Plus size={12} /></button>
              )}
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
}: {
  group: PreprocessedGroup;
  colorIdx: number;
  onEditNeed: (id: string, text: string) => void;
  onDeleteNeed: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
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

  // Processing state
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [parsedNeeds, setParsedNeeds] = useState<ParsedNeed[]>([]);
  const [result, setResult] = useState<PreprocessResult | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // DnD
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Step 1: Parse + Dedup ──────────────────────────────────────────

  const handleProcess = useCallback(async () => {
    setLoading(true);
    let notes: L1Note[];
    if (isMock) {
      notes = MOCK_L1_NOTES;
    } else {
      try {
        const url = import.meta.env.VITE_APPS_SCRIPT_URL;
        const res = await fetch(`${url}?action=getL1Notes`);
        notes = await res.json();
      } catch {
        notes = MOCK_L1_NOTES;
      }
    }

    const parsed = parseAndDedup(notes);
    setParsedNeeds(parsed);

    // Kural tabanlı kategorize
    const res = categorizeAllByRules(parsed);
    setResult(res);
    setLoading(false);
    setStep('review');
  }, [isMock]);

  // ── LLM Re-categorize ─────────────────────────────────────────────

  const handleLLMCategorize = useCallback(async () => {
    if (!geminiKey || !parsedNeeds.length) return;
    setLlmLoading(true);
    // Reset assignments
    const freshNeeds = parsedNeeds.map(n => ({ ...n, assignedGroup: undefined }));
    const res = await categorizeWithLLM(freshNeeds, geminiKey);
    setResult(res);
    setParsedNeeds(freshNeeds);
    setLlmLoading(false);
  }, [geminiKey, parsedNeeds]);

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

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preprocessed-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Also try to save to Google Sheets (fire-and-forget)
    if (!isMock) {
      try {
        const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'savePreprocessed', data: exportData }),
        });
      } catch { /* ignore */ }
    }
  }, [result, userName, isMock]);

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
            onSubmit={e => { e.preventDefault(); if (userName.trim()) setStep('process'); }}
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
            <button
              type="submit"
              disabled={!userName.trim()}
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
            12 uzmanin L1 notlari parse edilecek, tekrarlar birlestirilecek ve kural tabanli kategorize yapilacak.
          </p>

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <span className="text-sm text-gray-500">Isleniyor...</span>
            </div>
          ) : (
            <button
              onClick={handleProcess}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <Sparkles size={16} /> Islemeyi Baslat
            </button>
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
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Kategoriler</h2>
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
    </div>
  );
}
