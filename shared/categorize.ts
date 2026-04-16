// ─── Kural Tabanlı Kategorize + LLM Opsiyonu ────────────────────────────────
// Preprocessor modülünde kullanılır: L1 notlarından parse edilen ihtiyaçları
// önceden tanımlı 8 kategoriye atar.

export interface ParsedNeed {
  id: string;
  text: string;
  category?: string;        // L1'den gelen ham kategori (varsa)
  frequency: number;         // Kaç uzman aynı ihtiyacı yazmış
  experts: string[];         // Hangi uzmanlar yazmış
  assignedGroup?: string;    // Kural tabanlı veya LLM atanan grup
}

export interface PreprocessedGroup {
  id: string;
  name: string;
  needs: ParsedNeed[];
}

export interface PreprocessResult {
  groups: PreprocessedGroup[];
  unassigned: ParsedNeed[];  // Hiçbir gruba atanamayan
}

// ─── 8 Önceden Tanımlı Kategori + Anahtar Kelimeler ─────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Fiziksel Altyapı ve Güvenlik': [
    'bina', 'güçlendirme', 'prefabrik', 'ısıtma', 'ısınma', 'tuvalet', 'hijyen',
    'bahçe', 'duvar', 'çatı', 'izolasyon', 'elektrik', 'tesisat', 'su', 'sızıntı',
    'yangın', 'merdiven', 'moloz', 'hasar', 'çatlak', 'sıra', 'masa', 'aydınlatma',
    'led', 'tahliye', 'söndürme', 'cctv', 'kamera', 'güvenlik', 'toplanma',
    'altyapı', 'yapısal', 'inşa', 'tamir', 'onarım', 'çit', 'rampa',
  ],
  'Eğitim Altyapısı ve Materyaller': [
    'kitap', 'ders', 'müfredat', 'kütüphane', 'kırtasiye', 'defter', 'tahta',
    'telafi', 'eğitim programı', 'oyun temelli', 'materyal', 'öğrenme',
    'dijital eğitim', 'platform', 'çanta',
  ],
  'Psikososyal Destek': [
    'travma', 'psikolojik', 'psikososyal', 'psiko', 'terapi', 'danışmanlık',
    'panik', 'korku', 'stres', 'tssb', 'kriz', 'müdahale', 'güvenli alan',
    'regresyon', 'uyku', 'devamsızlık', 'akran desteği', 'süpervizyon',
    'sanat terapisi', 'ruh sağlığı', 'psikoeğitim', 'psikolojik ilkyardım',
  ],
  'Beslenme ve Sağlık': [
    'yemek', 'beslenme', 'gıda', 'süt', 'kantin', 'sağlık', 'ilkyardım',
    'diş', 'göz', 'aşı', 'alerji', 'kronik', 'sağlık odası', 'hijyen kit',
    'tarama', 'beslenme eğitimi',
  ],
  'Ekonomik Destek': [
    'burs', 'maddi', 'ekonomik', 'finansal', 'ulaşım', 'servis', 'ücret',
    'masraf', 'yardım', 'giysi', 'battaniye', 'kışlık', 'barınma',
  ],
  'Özel Eğitim ve Kapsayıcılık': [
    'engelli', 'özel eğitim', 'kaynaştırma', 'bireyselleştirilmiş', 'bep',
    'işitme cihazı', 'gözlük', 'dil desteği', 'mülteci', 'kız çocuk',
    'kapsayıcı', 'uyum programı', 'geçici koruma', 'yaş grubu karışık',
  ],
  'Öğretmen Desteği ve Mesleki Gelişim': [
    'öğretmen', 'atama', 'hizmet içi', 'mesleki gelişim', 'motivasyon',
    'tükenmişlik', 'nöbetçi', 'kapasite', 'ilkyardım eğitimi', 'tatbikat',
    'afet planı', 'afet çantası',
  ],
  'Teknoloji ve Dijital Altyapı': [
    'bilgisayar', 'laboratuvar', 'akıllı tahta', 'teknoloji', 'dijital',
    'jeneratör', 'internet', 'tablet', 'yazılım',
  ],
};

// ─── Normalize ───────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?'"()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Kural Tabanlı Kategorize ────────────────────────────────────────────────

export function categorizeByRules(need: ParsedNeed): string | undefined {
  const norm = normalize(need.text);
  let bestCategory: string | undefined;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (norm.includes(kw.toLowerCase())) {
        score += kw.length; // Uzun keyword = daha spesifik = daha yüksek skor
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return bestCategory;
}

// ─── Toplu Kural Tabanlı Kategorize ──────────────────────────────────────────

export function categorizeAllByRules(needs: ParsedNeed[]): PreprocessResult {
  const groupMap: Record<string, ParsedNeed[]> = {};
  const unassigned: ParsedNeed[] = [];

  // Initialize all groups
  for (const name of Object.keys(CATEGORY_KEYWORDS)) {
    groupMap[name] = [];
  }

  for (const need of needs) {
    const category = categorizeByRules(need);
    if (category) {
      need.assignedGroup = category;
      groupMap[category].push(need);
    } else {
      unassigned.push(need);
    }
  }

  const groups: PreprocessedGroup[] = [];
  let gIdx = 0;
  for (const [name, groupNeeds] of Object.entries(groupMap)) {
    if (groupNeeds.length > 0) {
      groups.push({ id: `pg_${gIdx++}`, name, needs: groupNeeds });
    }
  }

  return { groups, unassigned };
}

// ─── LLM Kategorize (Gemini API) ────────────────────────────────────────────

export async function categorizeWithLLM(
  needs: ParsedNeed[],
  apiKey: string,
): Promise<PreprocessResult> {
  const categoryNames = Object.keys(CATEGORY_KEYWORDS);
  const needTexts = needs.map((n, i) => `${i + 1}. ${n.text}`).join('\n');

  const prompt = `Sen bir eğitim ihtiyaçları analisti sin. Aşağıdaki ihtiyaç listesini verilen kategorilere ayır.

Kategoriler:
${categoryNames.map((c, i) => `${i + 1}. ${c}`).join('\n')}

İhtiyaçlar:
${needTexts}

Her ihtiyaç için en uygun kategori numarasını ver. Eğer hiçbir kategori uymuyorsa 0 yaz.
Yanıtı JSON array olarak ver, sadece sayılar: [1, 3, 2, 0, ...]
Başka hiçbir şey yazma.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      },
    );

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON array from response
    const match = text.match(/\[[\d\s,]+\]/);
    if (!match) throw new Error('LLM response parse error');

    const indices: number[] = JSON.parse(match[0]);

    const groupMap: Record<string, ParsedNeed[]> = {};
    const unassigned: ParsedNeed[] = [];

    for (const name of categoryNames) groupMap[name] = [];

    for (let i = 0; i < needs.length; i++) {
      const catIdx = indices[i];
      if (catIdx && catIdx >= 1 && catIdx <= categoryNames.length) {
        const catName = categoryNames[catIdx - 1];
        needs[i].assignedGroup = catName;
        groupMap[catName].push(needs[i]);
      } else {
        unassigned.push(needs[i]);
      }
    }

    const groups: PreprocessedGroup[] = [];
    let gIdx = 0;
    for (const [name, groupNeeds] of Object.entries(groupMap)) {
      if (groupNeeds.length > 0) {
        groups.push({ id: `pg_${gIdx++}`, name, needs: groupNeeds });
      }
    }

    return { groups, unassigned };
  } catch (err) {
    console.error('LLM categorize failed, falling back to rules:', err);
    return categorizeAllByRules(needs);
  }
}

// ─── L1 Notlarından Parse + Dedup + Frekans ──────────────────────────────────

import type { L1Note } from './types';

export function parseAndDedup(notes: L1Note[]): ParsedNeed[] {
  const map: Map<string, { text: string; experts: Set<string> }> = new Map();

  for (const note of notes) {
    const lines = note.text.split('\n').map(l => l.trim()).filter(Boolean);
    let _currentCategory: string | undefined;

    for (const line of lines) {
      if (line.startsWith('-')) {
        const text = line.replace(/^-\s*/, '').trim();
        if (!text) continue;
        const key = normalize(text);
        const existing = map.get(key);
        if (existing) {
          existing.experts.add(note.expertName);
        } else {
          map.set(key, { text, experts: new Set([note.expertName]) });
        }
      } else {
        _currentCategory = line;
      }
    }
  }

  const result: ParsedNeed[] = [];
  let idx = 0;
  for (const [, entry] of map) {
    result.push({
      id: `pn_${idx++}`,
      text: entry.text,
      frequency: entry.experts.size,
      experts: Array.from(entry.experts),
    });
  }

  // Frekansa göre sırala (yüksek önce)
  result.sort((a, b) => b.frequency - a.frequency);
  return result;
}
