import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import {
  Plus, Trash2, Pencil, Check, X, Send, User, LogOut,
  Loader2, StickyNote, ArrowRight, FolderPlus, GripVertical,
} from 'lucide-react';
import type { Need, Group, L1Note } from '@shared/types';
import { parseL1Notes } from '@shared/types';
import { MOCK_L1_NOTES, MOCK_L2_RESULTS } from '@shared/mockData';
import { cn } from './lib/utils';

const IS_MOCK = import.meta.env.VITE_MOCK === 'true';
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? '';

const GROUP_COLORS = [
  { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-sky-50', border: 'border-sky-200', header: 'bg-sky-100', text: 'text-sky-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-100', text: 'text-violet-800' },
  { bg: 'bg-teal-50', border: 'border-teal-200', header: 'bg-teal-100', text: 'text-teal-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-100', text: 'text-cyan-800' },
];

let _uid = 0;
function uid(prefix = 'id') { return `${prefix}_${Date.now()}_${_uid++}`; }

// ─── Draggable Card ──────────────────────────────────────────────────────────

function DraggableCard({ need, onRename, onDelete }: {
  need: Need; onRename: (id: string, t: string) => void; onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: need.id });
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(need.text);
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-lg border border-amber-200/60 bg-[#fdfaf0] px-3 py-2 shadow-sm transition-all',
        isDragging && 'opacity-40 shadow-lg',
      )}
    >
      <button {...listeners} {...attributes} className="cursor-grab text-amber-400 hover:text-amber-600 shrink-0">
        <GripVertical size={14} />
      </button>
      {editing ? (
        <form className="flex flex-1 items-center gap-1" onSubmit={(e) => { e.preventDefault(); onRename(need.id, text); setEditing(false); }}>
          <input className="flex-1 rounded border border-amber-300 bg-white px-2 py-0.5 text-sm outline-none" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <button type="submit" className="text-emerald-600 hover:text-emerald-800"><Check size={14} /></button>
          <button type="button" onClick={() => { setText(need.text); setEditing(false); }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </form>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700 select-none">{need.text}</span>
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-amber-700 transition-opacity"><Pencil size={13} /></button>
          <button onClick={() => onDelete(need.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 size={13} /></button>
        </>
      )}
    </div>
  );
}

// ─── Droppable Zone ──────────────────────────────────────────────────────────

function DroppableZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && 'ring-2 ring-amber-400/50')}>
      {children}
    </div>
  );
}

// ─── Group Card ──────────────────────────────────────────────────────────────

function GroupCard({ group, needs, colorIdx, onRenameGroup, onDeleteGroup, onRenameNeed, onDeleteNeed }: {
  group: Group; needs: Need[]; colorIdx: number;
  onRenameGroup: (id: string, n: string) => void; onDeleteGroup: (id: string) => void;
  onRenameNeed: (id: string, t: string) => void; onDeleteNeed: (id: string) => void;
}) {
  const c = GROUP_COLORS[colorIdx % GROUP_COLORS.length];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);

  return (
    <DroppableZone id={group.id} className={cn('rounded-xl border', c.bg, c.border, 'overflow-hidden')}>
      <div className={cn('flex items-center gap-2 px-3 py-2', c.header)}>
        {editing ? (
          <form className="flex flex-1 items-center gap-1" onSubmit={(e) => { e.preventDefault(); onRenameGroup(group.id, name); setEditing(false); }}>
            <input className="flex-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm font-medium outline-none" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <button type="submit" className="text-emerald-600"><Check size={14} /></button>
            <button type="button" onClick={() => { setName(group.name); setEditing(false); }} className="text-gray-400"><X size={14} /></button>
          </form>
        ) : (
          <>
            <span className={cn('flex-1 text-sm font-semibold', c.text)}>{group.name}</span>
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', c.text, 'bg-white/60')}>{needs.length}</span>
            <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600"><Pencil size={13} /></button>
            <button onClick={() => onDeleteGroup(group.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-2 min-h-[48px]">
        {needs.length === 0 && <p className="text-xs text-gray-400 italic text-center py-3">Buraya sürükle</p>}
        {needs.map((n) => (
          <DraggableCard key={n.id} need={n} onRename={onRenameNeed} onDelete={onDeleteNeed} />
        ))}
      </div>
    </DroppableZone>
  );
}

// ─── Note Card for L1 sidebar ────────────────────────────────────────────────

function NoteCard({ note, onRemove, onEdit }: {
  note: { id: string; text: string }; onRemove: (id: string) => void; onEdit: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="group relative rounded-lg border border-amber-200/60 bg-[#fdfaf0] p-3 shadow-sm"
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea className="w-full rounded border border-amber-300 bg-white p-2 text-sm outline-none resize-none" rows={3} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <div className="flex gap-1 justify-end">
            <button onClick={() => { onEdit(note.id, text); setEditing(false); }} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600">Kaydet</button>
            <button onClick={() => { setText(note.text); setEditing(false); }} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300">İptal</button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.text}</p>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="text-amber-500 hover:text-amber-700"><Pencil size={13} /></button>
            <button onClick={() => onRemove(note.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [expertName, setExpertName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'L1' | 'L2'>('L1');

  // L1
  const [notes, setNotes] = useState<{ id: string; text: string }[]>([]);
  const [noteText, setNoteText] = useState('');

  // L2
  const [needs, setNeeds] = useState<Need[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // UI
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ─── Login ───────────────────────────────────────────────────────────────────

  const handleLogin = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;
    setExpertName(name);
    setLoggedIn(true);
    // Load mock L1 notes for this expert
    if (IS_MOCK) {
      const mockNotes = MOCK_L1_NOTES.filter((n) => n.expertName === name);
      setNotes(mockNotes.map((n) => ({ id: n.id, text: n.text })));
    }
  }, [nameInput]);

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setExpertName('');
    setNameInput('');
    setCurrentLevel('L1');
    setNotes([]);
    setNeeds([]);
    setGroups([]);
    setDone(false);
  }, []);

  // ─── L1 ──────────────────────────────────────────────────────────────────────

  const addNote = useCallback(() => {
    const t = noteText.trim();
    if (!t) return;
    setNotes((prev) => [...prev, { id: uid('note'), text: t }]);
    setNoteText('');
    textareaRef.current?.focus();
  }, [noteText]);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const editNote = useCallback((id: string, text: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }, []);

  const submitL1 = useCallback(async () => {
    if (notes.length === 0) return;
    setLoadingNotes(true);

    // Save L1 notes
    if (!IS_MOCK && API_URL) {
      try {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveL1Notes', expertName, notes: notes.map((n) => n.text) }),
        });
      } catch (e) { console.error('L1 save error', e); }
    } else {
      console.log('[MOCK] saveL1Notes', { expertName, notes });
    }

    // Parse notes into needs for L2
    const l1Notes: L1Note[] = notes.map((n, i) => ({
      id: `parsed_${i}`, expertName, text: n.text, timestamp: new Date().toISOString(),
    }));
    const parsed = parseL1Notes(l1Notes);
    const poolNeeds: Need[] = parsed.map((p, i) => ({
      id: uid('need'), text: p.text, stage: 'pool' as const, groupId: undefined,
    }));

    // If mock, also load pre-populated L2 data
    if (IS_MOCK) {
      const mockResult = MOCK_L2_RESULTS.find((r) => r.expertName === expertName);
      if (mockResult) {
        const mockGroups: Group[] = mockResult.groups.map((g) => ({ id: g.id, name: g.name, stage: g.stage as 'pool' | 'selected' }));
        const mockNeeds: Need[] = mockResult.needs.map((n) => ({
          id: n.id, text: n.text, stage: n.stage as 'pool' | 'selected', groupId: n.groupId,
        }));
        setGroups(mockGroups);
        setNeeds(mockNeeds);
      } else {
        setNeeds(poolNeeds);
        setGroups([]);
      }
    } else {
      setNeeds(poolNeeds);
      setGroups([]);
    }

    await new Promise((r) => setTimeout(r, 1200));
    setLoadingNotes(false);
    setCurrentLevel('L2');
  }, [notes, expertName]);

  // ─── L2 ──────────────────────────────────────────────────────────────────────

  const poolNeeds = useMemo(() => needs.filter((n) => n.stage === 'pool'), [needs]);
  const groupNeeds = useCallback((gId: string) => needs.filter((n) => n.groupId === gId && n.stage === 'selected'), [needs]);

  const addGroup = useCallback(() => {
    const id = uid('grp');
    setGroups((prev) => [...prev, { id, name: `Grup ${prev.length + 1}`, stage: 'selected' }]);
  }, []);

  const renameGroup = useCallback((id: string, name: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setNeeds((prev) => prev.map((n) => (n.groupId === id ? { ...n, groupId: undefined, stage: 'pool' } : n)));
  }, []);

  const renameNeed = useCallback((id: string, text: string) => {
    setNeeds((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }, []);

  const deleteNeed = useCallback((id: string) => {
    setNeeds((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const needId = active.id as string;
    const overId = over.id as string;

    if (overId === 'pool') {
      setNeeds((prev) => prev.map((n) => (n.id === needId ? { ...n, stage: 'pool' as const, groupId: undefined } : n)));
    } else {
      // Check if overId is a group
      const isGroup = groups.some((g) => g.id === overId);
      if (isGroup) {
        setNeeds((prev) => prev.map((n) => (n.id === needId ? { ...n, stage: 'selected' as const, groupId: overId } : n)));
      }
    }
  }, [groups]);

  const activeNeed = useMemo(() => needs.find((n) => n.id === activeId), [needs, activeId]);

  const submitL2 = useCallback(async () => {
    setSending(true);
    if (!IS_MOCK && API_URL) {
      try {
        await fetch(API_URL, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveL2Board', expertName, needs, groups }),
        });
      } catch (e) { console.error('L2 save error', e); }
    } else {
      console.log('[MOCK] saveL2Board', { expertName, needs, groups });
    }
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setDone(true);
  }, [expertName, needs, groups]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Login screen
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#7a5020] to-[#a0703c] px-6 py-8 text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">MagnetiX</h1>
            <p className="text-amber-100 text-sm mt-1 font-medium">Uzman İhtiyaç Panosu</p>
          </div>
          <form
            className="p-6 space-y-5"
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Adınız</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Adınızı girin..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
            </div>
            <button
              type="submit" disabled={!nameInput.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7a5020] to-[#a0703c] text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-40 transition-all"
            >
              Panoya Giriş Yap
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Loading between L1→L2
  if (loadingNotes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <Loader2 size={40} className="text-[#7a5020]" />
        </motion.div>
        <p className="text-lg font-semibold text-[#7a5020]">Notlar Sentezleniyor...</p>
      </div>
    );
  }

  // Sending overlay
  if (sending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <Loader2 size={40} className="text-[#7a5020]" />
        </motion.div>
        <p className="text-lg font-semibold text-[#7a5020]">Gönderiliyor...</p>
      </div>
    );
  }

  // Done screen
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col items-center justify-center gap-4 p-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check size={40} className="text-emerald-600" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-emerald-800">Tamamlandı!</h2>
        <p className="text-emerald-600 text-center max-w-sm">Yanıtlarınız başarıyla kaydedildi. Katkınız için teşekkürler!</p>
        <button onClick={handleLogout} className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors">
          Çıkış Yap
        </button>
      </div>
    );
  }

  // Header
  const header = (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-amber-100 px-4 py-3 flex items-center gap-3">
      <h1 className="text-xl font-extrabold text-[#7a5020] tracking-tight">MagnetiX</h1>
      <span className={cn(
        'text-xs font-bold px-2 py-0.5 rounded-full',
        currentLevel === 'L1' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
      )}>
        {currentLevel}
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User size={14} />
        <span className="font-medium">{expertName}</span>
      </div>
      <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Çıkış">
        <LogOut size={18} />
      </button>
    </header>
  );

  // ─── L1 Screen ─────────────────────────────────────────────────────────────

  if (currentLevel === 'L1') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 font-sans">
        {header}
        <div className="flex h-[calc(100vh-57px)]">
          {/* Sidebar: saved notes */}
          <aside className="w-80 border-r border-amber-100 bg-white/60 flex flex-col">
            <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
              <StickyNote size={16} className="text-amber-600" />
              <h2 className="text-sm font-bold text-gray-700">Kaydedilen Notlar</h2>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{notes.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} onRemove={removeNote} onEdit={editNote} />
                ))}
              </AnimatePresence>
              {notes.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8 italic">Henüz not eklenmedi</p>
              )}
            </div>
          </aside>

          {/* Main area */}
          <main className="flex-1 flex flex-col p-6 gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-2">Yeni Not</label>
              <textarea
                ref={textareaRef}
                value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder={"Eğitim İhtiyaçları\n- Ders kitapları yetersiz\n- Sınıf mevcutları çok kalabalık\n\nBaşlıklar kategori, tire (-) ile başlayanlar ihtiyaç maddesidir."}
                className="flex-1 rounded-xl border border-amber-200 bg-white p-4 text-sm outline-none resize-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all shadow-sm custom-scrollbar font-mono leading-relaxed"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={addNote} disabled={!noteText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-40 shadow-md transition-all"
              >
                <Plus size={16} /> Not Ekle
              </button>
              <button
                onClick={submitL1} disabled={notes.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7a5020] to-[#a0703c] text-white font-semibold text-sm hover:shadow-lg disabled:opacity-40 shadow-md transition-all"
              >
                Gönder ve Devam Et <ArrowRight size={16} />
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ─── L2 Screen ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 font-sans">
      {header}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-[calc(100vh-57px)]">
          {/* Pool */}
          <DroppableZone id="pool" className="w-80 border-r border-amber-100 bg-[#f9f5ec] flex flex-col">
            <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
              <StickyNote size={16} className="text-amber-600" />
              <h2 className="text-sm font-bold text-gray-700">Havuz</h2>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{poolNeeds.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
              {poolNeeds.map((n) => (
                <DraggableCard key={n.id} need={n} onRename={renameNeed} onDelete={deleteNeed} />
              ))}
              {poolNeeds.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8 italic">Tüm kartlar tasnif edildi</p>
              )}
            </div>
          </DroppableZone>

          {/* Tasnif */}
          <main className="flex-1 flex flex-col bg-[#f0faf0]/40">
            <div className="px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
              <FolderPlus size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-700">Tasnif</h2>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{groups.length} grup</span>
              <button onClick={addGroup} className="flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                <Plus size={14} /> Yeni Grup
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map((g, i) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    needs={groupNeeds(g.id)}
                    colorIdx={i}
                    onRenameGroup={renameGroup}
                    onDeleteGroup={deleteGroup}
                    onRenameNeed={renameNeed}
                    onDeleteNeed={deleteNeed}
                  />
                ))}
              </div>
              {groups.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <FolderPlus size={48} className="opacity-30" />
                  <p className="text-sm italic">Henüz grup oluşturulmadı</p>
                  <button onClick={addGroup} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    <Plus size={16} /> İlk Grubu Oluştur
                  </button>
                </div>
              )}
            </div>
            {/* Submit */}
            <div className="px-4 py-3 border-t border-emerald-100 flex justify-end">
              <button
                onClick={submitL2}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7a5020] to-[#a0703c] text-white font-semibold text-sm hover:shadow-lg shadow-md transition-all"
              >
                <Send size={16} /> Gönder
              </button>
            </div>
          </main>
        </div>

        <DragOverlay>
          {activeNeed ? (
            <div className="rounded-lg border border-amber-300 bg-[#fdfaf0] px-3 py-2 shadow-xl text-sm text-gray-700 max-w-xs">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-amber-400" />
                {activeNeed.text}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
