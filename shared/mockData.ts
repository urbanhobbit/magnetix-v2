import type { L1Note, ExpertResult } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// 5 Uzman — Çocuk İhtiyaçları Analizi (CSV verisine dayalı gerçekçi senaryo)
// Kaynak: 2025-12-19 Delphi çalışması, 9 uzman, 10 kategori, ~65 ihtiyaç
// ═══════════════════════════════════════════════════════════════════════════════

const EXPERTS = [
  'Dr. Aylin Kaya',    // Çocuk psikoloğu
  'Murat Demir',       // Okul müdürü
  'Zehra Yıldız',      // Sosyal hizmet uzmanı
  'Can Arslan',        // Dijital eğitim uzmanı
  'Fatma Şen',         // Çocuk hakları avukatı
] as const;

// ─── Ortak Grup İsimleri ─────────────────────────────────────────────────────

const COMMON_GROUPS = {
  aile:       'Aile ve Bakımveren Desteği',
  dijital:    'Dijital Erişim ve Teknoloji',
  egitim:     'Eğitim ve Okul Yaşamı',
  guvenlik:   'Güvenlik ve Koruma',
  haklar:     'Haklar, Katılım ve Gelecek',
  saglik:     'Sağlık ve Psikososyal İyi Oluş',
  sosyal:     'Sosyal Katılım, Oyun ve Boş Zaman',
  temel:      'Temel Yaşam ve Maddi Güvenlik',
  ulasim:     'Ulaşım ve Kamusal Alanlar',
};

// ─── L1 Notları — Her uzman kendi bakış açısından serbest metin yazar ────────

export const MOCK_L1_NOTES: L1Note[] = [
  // ── 0: Dr. Aylin Kaya (Çocuk psikoloğu) ────────────────────────────────
  { id: 'l1_aylin_0', expertName: EXPERTS[0], text: 'Psikososyal Destek\n- Psikolojik danışmanlık hizmeti acil ihtiyaç\n- Psikososyal destek ve kriz müdahalesi programları kurulmalı\n- Menstrüasyon ve ergenlik sağlığı konusunda bilgilendirme\n- Bakımverenin psikososyal desteği çocuğun iyilik hali için kritik\n- Akranlarla sosyal etkileşim fırsatları artırılmalı', timestamp: '2026-04-10T09:00:00Z' },
  { id: 'l1_aylin_1', expertName: EXPERTS[0], text: 'Güvenlik ve Koruma\n- İhmal, istismar ve şiddetten korunma en temel hak\n- Okulda güvenlik hissi sağlanmalı\n- Evde fiziksel güvenlik değerlendirilmeli\n- Siber zorbalıktan korunma programları\n- Güvenli oyun alanlarına erişim şart', timestamp: '2026-04-10T09:10:00Z' },
  { id: 'l1_aylin_2', expertName: EXPERTS[0], text: 'Sağlık\n- Kronik hastalık takibi ve ilaçlara erişim\n- Temel sağlık hizmetlerine erişim\n- Engelli çocuklar için sağlık ve rehabilitasyon\n- Bakım ve hijyen malzemelerine erişim\n- Diş ve göz sağlığı hizmetleri', timestamp: '2026-04-10T09:20:00Z' },
  { id: 'l1_aylin_3', expertName: EXPERTS[0], text: 'Aile Desteği\n- Aile içi iletişim ve destek güçlendirilmeli\n- Çocuk bakım hizmetlerine erişim\n- Sosyal yardımlara erişim kolaylaştırılmalı', timestamp: '2026-04-10T09:30:00Z' },

  // ── 1: Murat Demir (Okul müdürü) ───────────────────────────────────────
  { id: 'l1_murat_0', expertName: EXPERTS[1], text: 'Eğitim Altyapısı\n- Okulun fiziki koşulları iyileştirilmeli (sınıf, tuvalet, bahçe, kantin)\n- Sınıf mevcudunun uygunluğu sağlanmalı\n- Eğitim materyallerine erişim\n- Okul yemeğinin sağlıklı ve yeterli olması\n- Okula erişim ve düzenli devam desteklenmeli', timestamp: '2026-04-10T10:00:00Z' },
  { id: 'l1_murat_1', expertName: EXPERTS[1], text: 'Eğitim Kalitesi\n- Rehberlik ve akademik destek güçlendirilmeli\n- Okul öncesi eğitime erişim artırılmalı\n- Okulda kapsayıcı ve ayrımcılıktan uzak ortam\n- Sınavlara hazırlık ve ek ders imkânları\n- Öğretmen ve ebeveyn dijital desteği', timestamp: '2026-04-10T10:10:00Z' },
  { id: 'l1_murat_2', expertName: EXPERTS[1], text: 'Okul Güvenliği\n- Afet ve acil durumlarda çocuk koruma planı\n- Okulda güvenlik hissi\n- Dijital ortamda güvenlik\n- Okula ve kurslara güvenli ulaşım', timestamp: '2026-04-10T10:20:00Z' },
  { id: 'l1_murat_3', expertName: EXPERTS[1], text: 'Beslenme ve Temel\n- Düzenli öğün ve okul yemeği\n- Temel giyim ve mevsimlik kıyafet\n- Sağlıklı yaşam ve beslenme bilgisi', timestamp: '2026-04-10T10:30:00Z' },

  // ── 2: Zehra Yıldız (Sosyal hizmet uzmanı) ─────────────────────────────
  { id: 'l1_zehra_0', expertName: EXPERTS[2], text: 'Temel Yaşam\n- Barınma güvencesi en acil ihtiyaç\n- Gıda ve dengeli beslenmeye erişim\n- Temiz içme suyu\n- Elektrik, su ve internet faturalarının karşılanabilmesi\n- Kira ve borç yükünün yönetilebilirliği\n- Konutun fiziksel güvenliği (deprem, ısınma, nem)', timestamp: '2026-04-10T11:00:00Z' },
  { id: 'l1_zehra_1', expertName: EXPERTS[2], text: 'Ekonomik Destek\n- Düzenli öğün / okul yemeği\n- Temel giyim ve mevsimlik kıyafet\n- Kişisel alan (yatak, masa, dolap)\n- Sosyal yardımlara erişim\n- Bakımverenin ekonomik yükünün hafifletilmesi\n- Çok çocuklu ailelere yönelik destekler', timestamp: '2026-04-10T11:10:00Z' },
  { id: 'l1_zehra_2', expertName: EXPERTS[2], text: 'Aile ve Koruma\n- Bakımverenin psikososyal desteği\n- Çocuk işçiliğinin önlenmesi\n- İhmal, istismar ve şiddetten korunma\n- Aile içi iletişim ve destek\n- Çocuk bakım hizmetlerine erişim', timestamp: '2026-04-10T11:20:00Z' },
  { id: 'l1_zehra_3', expertName: EXPERTS[2], text: 'Ulaşım\n- Okula ve kurslara güvenli ulaşım\n- Engelli çocuklar için erişilebilir ulaşım\n- Toplu taşımaya erişim\n- Güvenli sokaklar ve aydınlatma\n- Kız çocukları için güvenli ulaşım', timestamp: '2026-04-10T11:30:00Z' },

  // ── 3: Can Arslan (Dijital eğitim uzmanı) ──────────────────────────────
  { id: 'l1_can_0', expertName: EXPERTS[3], text: 'Dijital Erişim\n- İnternet bağlantısına erişim en temel dijital ihtiyaç\n- Bilgisayar, tablet veya telefon temini\n- Eğitim uygulamalarına erişim\n- Dijital okuryazarlık eğitimi\n- Güvenli internet kullanımı bilgisi\n- Öğretmen ve ebeveyn dijital desteği', timestamp: '2026-04-10T12:00:00Z' },
  { id: 'l1_can_1', expertName: EXPERTS[3], text: 'Eğitim Teknolojisi\n- Eğitim materyallerine erişim dijitalleşmeli\n- Okul öncesi eğitime erişim uzaktan da mümkün olmalı\n- Sınavlara hazırlık ve ek ders imkânları online platformlarla desteklenmeli\n- Rehberlik ve akademik destek dijital araçlarla güçlendirilebilir', timestamp: '2026-04-10T12:10:00Z' },
  { id: 'l1_can_2', expertName: EXPERTS[3], text: 'Dijital Güvenlik\n- Dijital ortamda güvenlik\n- Siber zorbalıktan korunma\n- Kız çocukları için güvenli ulaşım (dijital taciz dahil)\n- Çocuk dostu kamusal alanlar (dijital dahil)', timestamp: '2026-04-10T12:20:00Z' },
  { id: 'l1_can_3', expertName: EXPERTS[3], text: 'Sosyal ve Kültürel\n- Akranlarla sosyal etkileşim (online ve yüz yüze)\n- Kültürel ve sanatsal etkinlikler\n- Kurslar ve beceri geliştirme faaliyetleri\n- Spor faaliyetlerine katılım', timestamp: '2026-04-10T12:30:00Z' },

  // ── 4: Fatma Şen (Çocuk hakları avukatı) ───────────────────────────────
  { id: 'l1_fatma_s_0', expertName: EXPERTS[4], text: 'Güvenlik ve Koruma\n- Afet ve acil durumlarda çocuk koruma en öncelikli\n- İhmal, istismar ve şiddetten korunma\n- Çocuk işçiliğinin önlenmesi\n- Mahallede güvenli hareket edebilme\n- Evde fiziksel güvenlik\n- Kız çocukları için güvenli ulaşım', timestamp: '2026-04-10T13:00:00Z' },
  { id: 'l1_fatma_s_1', expertName: EXPERTS[4], text: 'Haklar ve Katılım\n- Haklar konusunda bilgilendirme\n- Çocukların görüşlerinin dikkate alınması\n- Karar alma süreçlerine katılım\n- Eğitim ve meslek beklentileri\n- Hukuki destek ihtiyacı\n- Geleceğe dair umut ve planlar', timestamp: '2026-04-10T13:10:00Z' },
  { id: 'l1_fatma_s_2', expertName: EXPERTS[4], text: 'Eğitim Hakları\n- Okula erişim ve düzenli devam bir hak\n- Okulda kapsayıcı ve ayrımcılıktan uzak ortam\n- Okul öncesi eğitime erişim\n- Engelli çocuklar için sağlık ve rehabilitasyon', timestamp: '2026-04-10T13:20:00Z' },
  { id: 'l1_fatma_s_3', expertName: EXPERTS[4], text: 'Kamusal Alan\n- Çocuk dostu kamusal alanlar\n- Güvenli sokaklar ve aydınlatma\n- Güvenli oyun alanlarına erişim\n- Serbest zaman ve dinlenme alanları\n- Okul gezileri ve şehir içi etkinlikler', timestamp: '2026-04-10T13:30:00Z' },
];

// ─── L2 Tasnif Sonuçları ─────────────────────────────────────────────────────
// Her uzman preprocessor'dan gelen kartları gruplara atar
// CSV'deki include_rate ve consensus'a dayalı gerçekçi dağılım

function gId(expert: number, group: number) { return `g_${expert}_${group}`; }
function nId(expert: number, need: number) { return `n_${expert}_${need}`; }

export const MOCK_L2_RESULTS: ExpertResult[] = [
  // ── 0: Dr. Aylin Kaya (psikososyal odaklı) ─────────────────────────────
  {
    expertName: EXPERTS[0],
    groups: [
      { id: gId(0,1), name: COMMON_GROUPS.saglik, stage: 'selected' },
      { id: gId(0,2), name: COMMON_GROUPS.guvenlik, stage: 'selected' },
      { id: gId(0,3), name: COMMON_GROUPS.aile, stage: 'selected' },
      { id: gId(0,4), name: COMMON_GROUPS.sosyal, stage: 'selected' },
      { id: gId(0,5), name: COMMON_GROUPS.egitim, stage: 'selected' },
      { id: gId(0,6), name: COMMON_GROUPS.temel, stage: 'selected' },
    ],
    needs: [
      // Sağlık
      { id: nId(0,1),  text: 'Psikolojik danışmanlık',                        stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,2),  text: 'Psikososyal destek ve kriz müdahalesi',         stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,3),  text: 'Kronik hastalık takibi ve ilaçlara erişim',     stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,4),  text: 'Temel sağlık hizmetlerine erişim',              stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,5),  text: 'Engelli çocuklar için sağlık ve rehabilitasyon', stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,6),  text: 'Bakım ve hijyen malzemelerine erişim',          stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,7),  text: 'Menstrüasyon ve ergenlik sağlığı',              stage: 'selected', groupId: gId(0,1) },
      // Güvenlik
      { id: nId(0,8),  text: 'İhmal, istismar ve şiddetten korunma',          stage: 'selected', groupId: gId(0,2) },
      { id: nId(0,9),  text: 'Afet ve acil durumlarda çocuk koruma',          stage: 'selected', groupId: gId(0,2) },
      { id: nId(0,10), text: 'Okulda güvenlik hissi',                         stage: 'selected', groupId: gId(0,2) },
      { id: nId(0,11), text: 'Siber zorbalıktan korunma',                     stage: 'selected', groupId: gId(0,2) },
      // Aile
      { id: nId(0,12), text: 'Bakımverenin psikososyal desteği',              stage: 'selected', groupId: gId(0,3) },
      { id: nId(0,13), text: 'Aile içi iletişim ve destek',                   stage: 'selected', groupId: gId(0,3) },
      { id: nId(0,14), text: 'Çocuk bakım hizmetlerine erişim',               stage: 'selected', groupId: gId(0,3) },
      // Sosyal
      { id: nId(0,15), text: 'Akranlarla sosyal etkileşim',                   stage: 'selected', groupId: gId(0,4) },
      { id: nId(0,16), text: 'Güvenli oyun alanlarına erişim',                stage: 'selected', groupId: gId(0,4) },
      // Eğitim
      { id: nId(0,17), text: 'Okulda kapsayıcı ve ayrımcılıktan uzak ortam', stage: 'selected', groupId: gId(0,5) },
      { id: nId(0,18), text: 'Rehberlik ve akademik destek',                  stage: 'selected', groupId: gId(0,5) },
      // Temel
      { id: nId(0,19), text: 'Düzenli öğün / okul yemeği',                    stage: 'selected', groupId: gId(0,6) },
      // Pool
      { id: nId(0,20), text: 'Sağlıklı yaşam ve beslenme bilgisi',           stage: 'pool' },
      { id: nId(0,21), text: 'Diş ve göz sağlığı hizmetleri',                stage: 'pool' },
    ],
  },

  // ── 1: Murat Demir (eğitim/altyapı odaklı) ────────────────────────────
  {
    expertName: EXPERTS[1],
    groups: [
      { id: gId(1,1), name: COMMON_GROUPS.egitim, stage: 'selected' },
      { id: gId(1,2), name: COMMON_GROUPS.guvenlik, stage: 'selected' },
      { id: gId(1,3), name: COMMON_GROUPS.temel, stage: 'selected' },
      { id: gId(1,4), name: COMMON_GROUPS.dijital, stage: 'selected' },
      { id: gId(1,5), name: COMMON_GROUPS.saglik, stage: 'selected' },
      { id: gId(1,6), name: COMMON_GROUPS.ulasim, stage: 'selected' },
    ],
    needs: [
      // Eğitim
      { id: nId(1,1),  text: 'Okulda kapsayıcı ve ayrımcılıktan uzak ortam', stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,2),  text: 'Okulun fiziki koşulları (sınıf, tuvalet, bahçe, kantin)', stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,3),  text: 'Eğitim materyallerine erişim',                  stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,4),  text: 'Sınıf mevcudunun uygunluğu',                   stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,5),  text: 'Okul yemeğinin sağlıklı ve yeterli olması',    stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,6),  text: 'Rehberlik ve akademik destek',                  stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,7),  text: 'Okul öncesi eğitime erişim',                   stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,8),  text: 'Okula erişim ve düzenli devam',                stage: 'selected', groupId: gId(1,1) },
      // Güvenlik
      { id: nId(1,9),  text: 'Afet ve acil durumlarda çocuk koruma',          stage: 'selected', groupId: gId(1,2) },
      { id: nId(1,10), text: 'Okulda güvenlik hissi',                         stage: 'selected', groupId: gId(1,2) },
      { id: nId(1,11), text: 'Dijital ortamda güvenlik',                      stage: 'selected', groupId: gId(1,2) },
      // Temel
      { id: nId(1,12), text: 'Düzenli öğün / okul yemeği',                    stage: 'selected', groupId: gId(1,3) },
      { id: nId(1,13), text: 'Temel giyim ve mevsimlik kıyafet',             stage: 'selected', groupId: gId(1,3) },
      // Dijital
      { id: nId(1,14), text: 'Öğretmen ve ebeveyn dijital desteği',           stage: 'selected', groupId: gId(1,4) },
      { id: nId(1,15), text: 'Eğitim uygulamalarına erişim',                  stage: 'selected', groupId: gId(1,4) },
      // Sağlık
      { id: nId(1,16), text: 'Psikososyal destek ve kriz müdahalesi',         stage: 'selected', groupId: gId(1,5) },
      // Ulaşım
      { id: nId(1,17), text: 'Okula ve kurslara güvenli ulaşım',              stage: 'selected', groupId: gId(1,6) },
      // Pool
      { id: nId(1,18), text: 'Sınavlara hazırlık ve ek ders imkânları',      stage: 'pool' },
    ],
  },

  // ── 2: Zehra Yıldız (sosyal hizmet, ekonomik odaklı) ───────────────────
  {
    expertName: EXPERTS[2],
    groups: [
      { id: gId(2,1), name: COMMON_GROUPS.temel, stage: 'selected' },
      { id: gId(2,2), name: COMMON_GROUPS.aile, stage: 'selected' },
      { id: gId(2,3), name: COMMON_GROUPS.guvenlik, stage: 'selected' },
      { id: gId(2,4), name: COMMON_GROUPS.ulasim, stage: 'selected' },
      { id: gId(2,5), name: COMMON_GROUPS.saglik, stage: 'selected' },
      { id: gId(2,6), name: COMMON_GROUPS.egitim, stage: 'selected' },
    ],
    needs: [
      // Temel
      { id: nId(2,1),  text: 'Barınma güvencesi',                             stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,2),  text: 'Gıda ve dengeli beslenmeye erişim',             stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,3),  text: 'Temiz içme suyu',                               stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,4),  text: 'Düzenli öğün / okul yemeği',                    stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,5),  text: 'Elektrik, su ve internet faturalarının karşılanabilmesi', stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,6),  text: 'Kira ve borç yükünün yönetilebilirliği',        stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,7),  text: 'Temel giyim ve mevsimlik kıyafet',             stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,8),  text: 'Konutun fiziksel güvenliği (deprem, ısınma, nem)', stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,9),  text: 'Kişisel alan (yatak, masa, dolap)',             stage: 'selected', groupId: gId(2,1) },
      // Aile
      { id: nId(2,10), text: 'Bakımverenin psikososyal desteği',              stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,11), text: 'Bakımverenin ekonomik yükünün hafifletilmesi',   stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,12), text: 'Sosyal yardımlara erişim',                      stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,13), text: 'Çocuk bakım hizmetlerine erişim',               stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,14), text: 'Çok çocuklu ailelere yönelik destekler',        stage: 'selected', groupId: gId(2,2) },
      // Güvenlik
      { id: nId(2,15), text: 'Çocuk işçiliğinin önlenmesi',                   stage: 'selected', groupId: gId(2,3) },
      { id: nId(2,16), text: 'İhmal, istismar ve şiddetten korunma',          stage: 'selected', groupId: gId(2,3) },
      { id: nId(2,17), text: 'Afet ve acil durumlarda çocuk koruma',          stage: 'selected', groupId: gId(2,3) },
      // Ulaşım
      { id: nId(2,18), text: 'Okula ve kurslara güvenli ulaşım',              stage: 'selected', groupId: gId(2,4) },
      { id: nId(2,19), text: 'Engelli çocuklar için erişilebilir ulaşım',     stage: 'selected', groupId: gId(2,4) },
      { id: nId(2,20), text: 'Kız çocukları için güvenli ulaşım',             stage: 'selected', groupId: gId(2,4) },
      { id: nId(2,21), text: 'Toplu taşımaya erişim',                         stage: 'selected', groupId: gId(2,4) },
      { id: nId(2,22), text: 'Güvenli sokaklar ve aydınlatma',                stage: 'selected', groupId: gId(2,4) },
      // Sağlık
      { id: nId(2,23), text: 'Temel sağlık hizmetlerine erişim',              stage: 'selected', groupId: gId(2,5) },
      // Eğitim
      { id: nId(2,24), text: 'Okula erişim ve düzenli devam',                stage: 'selected', groupId: gId(2,6) },
      // Pool
      { id: nId(2,25), text: 'Aile içi iletişim ve destek',                   stage: 'pool' },
    ],
  },

  // ── 3: Can Arslan (dijital eğitim odaklı) ─────────────────────────────
  {
    expertName: EXPERTS[3],
    groups: [
      { id: gId(3,1), name: COMMON_GROUPS.dijital, stage: 'selected' },
      { id: gId(3,2), name: COMMON_GROUPS.egitim, stage: 'selected' },
      { id: gId(3,3), name: COMMON_GROUPS.guvenlik, stage: 'selected' },
      { id: gId(3,4), name: COMMON_GROUPS.sosyal, stage: 'selected' },
      { id: gId(3,5), name: COMMON_GROUPS.saglik, stage: 'selected' },
    ],
    needs: [
      // Dijital
      { id: nId(3,1),  text: 'İnternet bağlantısına erişim',                  stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,2),  text: 'Bilgisayar, tablet veya telefon',               stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,3),  text: 'Eğitim uygulamalarına erişim',                  stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,4),  text: 'Dijital okuryazarlık',                          stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,5),  text: 'Güvenli internet kullanımı bilgisi',            stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,6),  text: 'Öğretmen ve ebeveyn dijital desteği',           stage: 'selected', groupId: gId(3,1) },
      // Eğitim
      { id: nId(3,7),  text: 'Eğitim materyallerine erişim',                  stage: 'selected', groupId: gId(3,2) },
      { id: nId(3,8),  text: 'Rehberlik ve akademik destek',                  stage: 'selected', groupId: gId(3,2) },
      { id: nId(3,9),  text: 'Okul öncesi eğitime erişim',                   stage: 'selected', groupId: gId(3,2) },
      { id: nId(3,10), text: 'Sınavlara hazırlık ve ek ders imkânları',      stage: 'selected', groupId: gId(3,2) },
      // Güvenlik
      { id: nId(3,11), text: 'Dijital ortamda güvenlik',                      stage: 'selected', groupId: gId(3,3) },
      { id: nId(3,12), text: 'Siber zorbalıktan korunma',                     stage: 'selected', groupId: gId(3,3) },
      // Sosyal
      { id: nId(3,13), text: 'Akranlarla sosyal etkileşim',                   stage: 'selected', groupId: gId(3,4) },
      { id: nId(3,14), text: 'Kültürel ve sanatsal etkinlikler',              stage: 'selected', groupId: gId(3,4) },
      { id: nId(3,15), text: 'Kurslar ve beceri geliştirme faaliyetleri',     stage: 'selected', groupId: gId(3,4) },
      { id: nId(3,16), text: 'Spor faaliyetlerine katılım',                   stage: 'selected', groupId: gId(3,4) },
      // Sağlık
      { id: nId(3,17), text: 'Psikolojik danışmanlık',                        stage: 'selected', groupId: gId(3,5) },
      // Pool
      { id: nId(3,18), text: 'Çocuk dostu kamusal alanlar',                   stage: 'pool' },
    ],
  },

  // ── 4: Fatma Şen (çocuk hakları, güvenlik odaklı) ─────────────────────
  {
    expertName: EXPERTS[4],
    groups: [
      { id: gId(4,1), name: COMMON_GROUPS.guvenlik, stage: 'selected' },
      { id: gId(4,2), name: COMMON_GROUPS.haklar, stage: 'selected' },
      { id: gId(4,3), name: COMMON_GROUPS.egitim, stage: 'selected' },
      { id: gId(4,4), name: COMMON_GROUPS.sosyal, stage: 'selected' },
      { id: gId(4,5), name: COMMON_GROUPS.ulasim, stage: 'selected' },
      { id: gId(4,6), name: COMMON_GROUPS.saglik, stage: 'selected' },
    ],
    needs: [
      // Güvenlik
      { id: nId(4,1),  text: 'Afet ve acil durumlarda çocuk koruma',          stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,2),  text: 'İhmal, istismar ve şiddetten korunma',          stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,3),  text: 'Çocuk işçiliğinin önlenmesi',                   stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,4),  text: 'Mahallede güvenli hareket edebilme',            stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,5),  text: 'Evde fiziksel güvenlik',                        stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,6),  text: 'Kız çocukları için güvenli ulaşım',             stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,7),  text: 'Dijital ortamda güvenlik',                      stage: 'selected', groupId: gId(4,1) },
      // Haklar
      { id: nId(4,8),  text: 'Haklar konusunda bilgilendirme',                stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,9),  text: 'Çocukların görüşlerinin dikkate alınması',      stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,10), text: 'Karar alma süreçlerine katılım',                stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,11), text: 'Eğitim ve meslek beklentileri',                 stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,12), text: 'Hukuki destek ihtiyacı',                        stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,13), text: 'Geleceğe dair umut ve planlar',                 stage: 'selected', groupId: gId(4,2) },
      // Eğitim
      { id: nId(4,14), text: 'Okula erişim ve düzenli devam',                stage: 'selected', groupId: gId(4,3) },
      { id: nId(4,15), text: 'Okulda kapsayıcı ve ayrımcılıktan uzak ortam', stage: 'selected', groupId: gId(4,3) },
      { id: nId(4,16), text: 'Engelli çocuklar için sağlık ve rehabilitasyon', stage: 'selected', groupId: gId(4,3) },
      // Sosyal
      { id: nId(4,17), text: 'Güvenli oyun alanlarına erişim',                stage: 'selected', groupId: gId(4,4) },
      { id: nId(4,18), text: 'Serbest zaman ve dinlenme alanları',            stage: 'selected', groupId: gId(4,4) },
      { id: nId(4,19), text: 'Okul gezileri ve şehir içi etkinlikler',        stage: 'selected', groupId: gId(4,4) },
      // Ulaşım
      { id: nId(4,20), text: 'Çocuk dostu kamusal alanlar',                   stage: 'selected', groupId: gId(4,5) },
      { id: nId(4,21), text: 'Güvenli sokaklar ve aydınlatma',                stage: 'selected', groupId: gId(4,5) },
      // Sağlık
      { id: nId(4,22), text: 'Engelli çocuklar için sağlık ve rehabilitasyon', stage: 'selected', groupId: gId(4,6) },
      // Pool
      { id: nId(4,23), text: 'Toplu taşımaya erişim',                         stage: 'pool' },
    ],
  },
];

// ─── Consensus Beklentisi (CSV verisine dayalı referans) ─────────────────────
// Yüksek consensus (tüm uzmanlar aynı gruba):
//   - "Afet ve acil durumlarda çocuk koruma" → Güvenlik (4/5 = %80)
//   - "İhmal, istismar ve şiddetten korunma" → Güvenlik (4/5 = %80)
//   - "İnternet bağlantısına erişim" → Dijital (1/5 ama tek uzman)
// Orta consensus:
//   - "Rehberlik ve akademik destek" → Eğitim (3/5)
//   - "Düzenli öğün / okul yemeği" → Temel (3/5)
//   - "Psikososyal destek ve kriz müdahalesi" → Sağlık (2/5)
// Düşük consensus:
//   - "Sınavlara hazırlık" → pool çoğu uzmanda
//   - "Diş ve göz sağlığı" → pool
