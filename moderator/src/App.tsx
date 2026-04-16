import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  GripVertical,
  Users,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from './lib/utils';
import type { Need, Group, ExpertResult } from '@shared/types';
import { computeConsensus } from '@shared/types';
import { MOCK_L2_RESULTS } from '@shared/mockData';

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL = '';
const POOL_ID = '__pool__';

const GROUP_COLORS = [
  { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-400/40', header: 'bg-blue-500/80', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-400/40', header: 'bg-purple-500/80', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'from-teal-500/20 to-teal-600/10', border: 'border-teal-400/40', header: 'bg-teal-500/80', badge: 'bg-teal-100 text-teal-800' },
  { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-400/40', header: 'bg-orange-500/80', badge: 'bg-orange-100 text-orange-800' },
  { bg: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-400/40', header: 'bg-pink-500/80', badge: 'bg-pink-100 text-pink-800' },
  { bg: 'from-indigo-500/20 to-indigo-600/10', border: 'border-indigo-400/40', header: 'bg-indigo-500/80', badge: 'bg-indigo-100 text-indigo-800' },
];

function getGroupColor(index: number) {
  return GROUP_COLORS[index % GROUP_COLORS.length];
}

function consensusBadge(c: number) {
  const pct = Math.round(c * 100);
  if (c >= 0.7) return { text: `%${pct}`, cls: 'bg-emerald-100 text-emerald-700' };
  if (c >= 0.4) return { text: `%${pct}`, cls: 'bg-amber-100 text-amber-700' };
  return { text: `%${pct}`, cls: 'bg-red-100 text-red-700' };
}

// ─── Treemap Layout ──────────────────────────────────────────────────────────

interface TreemapRect {
  groupId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function computeTreemapLayout(
  groups: { id: string; value: number }[],
  containerW: number,
  containerH: number,
): TreemapRect[] {
  if (groups.length === 0 || containerW <= 0 || containerH <= 0) return [];
  const totalValue = groups.reduce((s, g) => s + g.value, 0);
  if (totalValue <= 0) return groups.map((g, i) => ({ groupId: g.id, x: i * 120, y: 0, w: 120, h: containerH }));

  const sorted = [...groups].sort((a, b) => b.value - a.value);
  const rects: TreemapRect[] = [];
  let x = 0;

  for (const g of sorted) {
    const frac = g.value / totalValue;
    const w = Math.max(frac * containerW, 100);
    rects.push({ groupId: g.id, x, y: 0, w, h: containerH });
    x += w;
  }

  // normalize to fit exactly
  const totalW = rects.reduce((s, r) => s + r.w, 0);
  if (totalW > 0) {
    const scale = containerW / totalW;
    let cx = 0;
    for (const r of rects) {
      r.x = cx;
      r.w = r.w * scale;
      cx += r.w;
    }
  }

  return rects;
}

// ─── DraggableCard ───────────────────────────────────────────────────────────

function DraggableCard({ need, isDragOverlay }: { need: Need; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: need.id });
  const badge = consensusBadge(need.consensus ?? 0);

  if (isDragOverlay) {
    return (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2 flex items-center gap-2 max-w-xs rotate-2 opacity-90">
        <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-xs font-medium text-gray-700 truncate flex-1">{need.text}</span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0', badge.cls)}>{badge.text}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/60 px-2.5 py-1.5 flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-gray-300',
        isDragging && 'opacity-30 scale-95',
      )}
    >
      <GripVertical className="w-3 h-3 text-gray-400 shrink-0" />
      <span className="text-[11px] font-medium text-gray-700 truncate flex-1">{need.text}</span>
      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap', badge.cls)}>{badge.text}</span>
    </div>
  );
}

// ─── DroppableGroup (treemap cell) ───────────────────────────────────────────

function DroppableGroup({
  group,
  needs,
  rect,
  colorIdx,
  onRenameStart,
  editingGroupId,
  editingName,
  setEditingName,
  onRenameConfirm,
  onRenameCancel,
  onDelete,
}: {
  group: Group;
  needs: Need[];
  rect: TreemapRect;
  colorIdx: number;
  onRenameStart: (id: string, name: string) => void;
  editingGroupId: string | null;
  editingName: string;
  setEditingName: (v: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onDelete: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: group.id });
  const color = getGroupColor(colorIdx);
  const isEditing = editingGroupId === group.id;
  const totalConsensus = needs.reduce((s, n) => s + (n.consensus ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute bg-gradient-to-br rounded-xl border-2 transition-all flex flex-col overflow-hidden',
        color.bg,
        color.border,
        isOver && 'ring-2 ring-blue-400 ring-offset-1 border-blue-400 scale-[1.01]',
      )}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-1.5 px-3 py-2 text-white shrink-0', color.header)}>
        {isEditing ? (
          <>
            <input
              className="bg-white/20 backdrop-blur-sm text-white placeholder-white/60 text-xs font-semibold rounded px-2 py-0.5 flex-1 outline-none"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onRenameConfirm(); if (e.key === 'Escape') onRenameCancel(); }}
              autoFocus
            />
            <button onClick={onRenameConfirm} className="hover:bg-white/20 rounded p-0.5"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={onRenameCancel} className="hover:bg-white/20 rounded p-0.5"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <>
            <span className="text-xs font-bold truncate flex-1">{group.name}</span>
            <span className="text-[10px] font-medium bg-white/20 rounded-full px-1.5 py-0.5">{needs.length}</span>
            <button onClick={() => onRenameStart(group.id, group.name)} className="hover:bg-white/20 rounded p-0.5"><Pencil className="w-3 h-3" /></button>
            <button onClick={() => onDelete(group.id)} className="hover:bg-white/20 rounded p-0.5"><Trash2 className="w-3 h-3" /></button>
          </>
        )}
      </div>

      {/* Needs */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
        {needs.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-[10px] italic">
            Sürükleyip bırakın
          </div>
        )}
        {needs.map((n) => (
          <DraggableCard key={n.id} need={n} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1 text-[10px] text-gray-500 font-medium border-t border-gray-200/40 bg-white/30 shrink-0">
        Toplam uzlaşma: {totalConsensus.toFixed(2)}
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

type AppView = 'login' | 'loading' | 'main';

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [moderatorName, setModeratorName] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Data
  const [needs, setNeeds] = useState<Need[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // UI
  const [poolCollapsed, setPoolCollapsed] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const treemapRef = useRef<HTMLDivElement>(null);

  // ─── Sensors ───────────────────────────────────────────────────────────────

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ─── Resize observer ──────────────────────────────────────────────────────

  useEffect(() => {
    const el = treemapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [view]);

  // ─── Login ─────────────────────────────────────────────────────────────────

  const handleLogin = () => {
    if (!nameInput.trim()) return;
    setModeratorName(nameInput.trim());
    setView('loading');
    loadData();
  };

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    let expertResults: ExpertResult[] | null = null;

    try {
      const resp = await fetch(`${API_URL}?action=getL2Results`);
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) expertResults = json;
      }
    } catch {
      // fallback to mock
    }

    if (!expertResults) expertResults = MOCK_L2_RESULTS;

    // Simulate computation delay
    await new Promise((r) => setTimeout(r, 1800));

    const { mergedNeeds, mergedGroups } = computeConsensus(expertResults);
    setNeeds(mergedNeeds);
    setGroups(mergedGroups);
    setView('main');
  }, []);

  // ─── Pool needs ────────────────────────────────────────────────────────────

  const poolNeeds = useMemo(() => needs.filter((n) => n.stage === 'pool' || !n.groupId), [needs]);

  // ─── Treemap data ─────────────────────────────────────────────────────────

  const groupValues = useMemo(() => {
    return groups.map((g) => {
      const gNeeds = needs.filter((n) => n.groupId === g.id && n.stage === 'selected');
      const value = gNeeds.reduce((s, n) => s + (n.consensus ?? 0), 0);
      return { id: g.id, value: Math.max(value, 0.1) };
    });
  }, [groups, needs]);

  const treemapRects = useMemo(
    () => computeTreemapLayout(groupValues, containerSize.w, containerSize.h),
    [groupValues, containerSize],
  );

  // ─── DnD handlers ─────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const needId = active.id as string;
    const targetId = over.id as string;

    setNeeds((prev) =>
      prev.map((n) => {
        if (n.id !== needId) return n;
        if (targetId === POOL_ID) {
          return { ...n, stage: 'pool' as const, groupId: undefined };
        }
        // target is a group
        const targetGroup = groups.find((g) => g.id === targetId);
        if (targetGroup) {
          return { ...n, stage: 'selected' as const, groupId: targetId };
        }
        return n;
      }),
    );
  };

  // ─── Group operations ─────────────────────────────────────────────────────

  const handleNewGroup = () => {
    const id = `newg_${Date.now()}`;
    setGroups((prev) => [...prev, { id, name: 'Yeni Grup', stage: 'selected' }]);
  };

  const handleRenameStart = (id: string, name: string) => {
    setEditingGroupId(id);
    setEditingName(name);
  };

  const handleRenameConfirm = () => {
    if (!editingGroupId || !editingName.trim()) return;
    setGroups((prev) => prev.map((g) => (g.id === editingGroupId ? { ...g, name: editingName.trim() } : g)));
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleDeleteGroup = (id: string) => {
    setNeeds((prev) => prev.map((n) => (n.groupId === id ? { ...n, stage: 'pool' as const, groupId: undefined } : n)));
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveL3', moderator: moderatorName, needs, groups }),
      });
    } catch {
      // silent
    }
  };

  // ─── Active drag need ─────────────────────────────────────────────────────

  const activeDragNeed = activeDragId ? needs.find((n) => n.id === activeDragId) : null;

  // ─── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    setView('login');
    setModeratorName('');
    setNameInput('');
    setNeeds([]);
    setGroups([]);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2060b0] to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">MagnetiX</h1>
            </div>
            <p className="text-purple-200 text-sm font-medium">Moderatör Panosu</p>
            <p className="text-purple-300/60 text-xs mt-1">L3 — Uzlaşma ve Treemap Görünümü</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">Adınız</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Moderatör adı..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm outline-none focus:border-[#2060b0] focus:ring-2 focus:ring-[#2060b0]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">Rol</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-purple-300 text-sm cursor-not-allowed">
                Moderatör
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!nameInput.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all',
                nameInput.trim()
                  ? 'bg-gradient-to-r from-[#2060b0] to-purple-600 text-white hover:shadow-lg hover:shadow-[#2060b0]/30 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed',
              )}
            >
              <LogIn className="w-4 h-4" />
              Giriş Yap
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-14 h-14 border-4 border-purple-400/30 border-t-[#2060b0] rounded-full mx-auto mb-6"
          />
          <h2 className="text-lg font-bold text-white mb-2">Uzlaşma Hesaplanıyor...</h2>
          <p className="text-purple-300/60 text-xs">12 uzmanın L2 sonuçları analiz ediliyor</p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50 font-sans">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <header className="shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2060b0] to-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-extrabold text-gray-800 tracking-tight">MagnetiX</span>
            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">Moderatör</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={handleNewGroup}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#2060b0] to-purple-600 text-white text-xs font-bold rounded-lg px-3 py-1.5 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Grup
          </button>

          <button
            onClick={handleSave}
            className="text-xs font-semibold text-gray-500 hover:text-[#2060b0] px-2 py-1 rounded-lg hover:bg-gray-100 transition-all"
          >
            Kaydet
          </button>

          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2060b0] to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {moderatorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-600">{moderatorName}</span>
            <button
              onClick={handleLogout}
              className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors ml-1"
            >
              Çıkış
            </button>
          </div>
        </header>

        {/* ─── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* ─── Pool Panel ────────────────────────────────────────────────── */}
          <PoolPanel
            poolNeeds={poolNeeds}
            collapsed={poolCollapsed}
            onToggle={() => setPoolCollapsed((v) => !v)}
          />

          {/* ─── Treemap Area ──────────────────────────────────────────────── */}
          <div className="flex-1 p-3 overflow-hidden">
            <div ref={treemapRef} className="relative w-full h-full rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
              {treemapRects.map((rect, i) => {
                const group = groups.find((g) => g.id === rect.groupId);
                if (!group) return null;
                const gNeeds = needs.filter((n) => n.groupId === group.id && n.stage === 'selected');
                return (
                  <DroppableGroup
                    key={group.id}
                    group={group}
                    needs={gNeeds}
                    rect={rect}
                    colorIdx={i}
                    onRenameStart={handleRenameStart}
                    editingGroupId={editingGroupId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    onRenameConfirm={handleRenameConfirm}
                    onRenameCancel={handleRenameCancel}
                    onDelete={handleDeleteGroup}
                  />
                );
              })}

              {groups.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Henüz grup yok. "Yeni Grup" ile ekleyin.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Drag Overlay ──────────────────────────────────────────────────── */}
      <DragOverlay dropAnimation={null}>
        {activeDragNeed ? <DraggableCard need={activeDragNeed} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Pool Panel Component ────────────────────────────────────────────────────

function PoolPanel({
  poolNeeds,
  collapsed,
  onToggle,
}: {
  poolNeeds: Need[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: POOL_ID });

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 bg-white border-r border-gray-200 flex flex-col items-center py-3">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mb-2">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
        <div className="writing-mode-vertical text-[10px] font-bold text-gray-400 tracking-wider" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          HAVUZ ({poolNeeds.length})
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all',
        isOver && 'bg-blue-50 border-blue-300',
      )}
    >
      {/* Pool Header */}
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-xs font-bold text-gray-700 flex-1">Havuz</span>
        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{poolNeeds.length}</span>
      </div>

      <div className="text-[10px] text-gray-400 px-4 py-1.5 border-b border-gray-50">
        Uzlaşma &lt; %70 olan ihtiyaçlar
      </div>

      {/* Pool Cards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
        {poolNeeds.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-300 text-[10px] italic py-8">
            Havuz boş
          </div>
        )}
        {poolNeeds.map((n) => (
          <DraggableCard key={n.id} need={n} />
        ))}
      </div>
    </div>
  );
}
