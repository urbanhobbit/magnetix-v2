import type { L1Note, ExpertResult } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// 12 Uzman — Deprem sonrası eğitim ihtiyaçları (gerçekçi senaryo)
// Bağlam: Güneydoğu Anadolu deprem bölgesi, ilkokul-ortaokul düzeyi
// ═══════════════════════════════════════════════════════════════════════════════

const EXPERTS = [
  'Ayşe Yılmaz',       // Okul müdürü
  'Mehmet Kara',        // Rehber öğretmen
  'Fatma Demir',        // Sınıf öğretmeni
  'Ali Çelik',          // Okul psikoloğu
  'Zeynep Aksoy',       // Sosyal hizmet uzmanı
  'Hasan Öztürk',       // İl MEM temsilcisi
  'Elif Şahin',         // STK koordinatörü (UNICEF)
  'Mustafa Aydın',      // Veli temsilcisi
  'Seda Koç',           // Özel eğitim uzmanı
  'İbrahim Yıldız',     // Okul güvenlik uzmanı
  'Derya Arslan',       // Beslenme / sağlık uzmanı
  'Kemal Bulut',        // Altyapı / mühendislik
] as const;

// ─── Ortak Grup İsimleri (uzmanların büyük çoğunluğu benzer gruplar oluşturur) ──

const COMMON_GROUPS = {
  fiziksel:     'Fiziksel Altyapı ve Güvenlik',
  egitim:       'Eğitim Altyapısı ve Materyaller',
  psikososyal:  'Psikososyal Destek',
  beslenme:     'Beslenme ve Sağlık',
  ekonomik:     'Ekonomik Destek',
  ozelEgitim:   'Özel Eğitim ve Kapsayıcılık',
  ogretmen:     'Öğretmen Desteği ve Mesleki Gelişim',
  teknoloji:    'Teknoloji ve Dijital Altyapı',
};

// ─── Her uzman biraz farklı grup isimleri kullanabilir ────────────────────────

function expertGroupName(base: string, expertIdx: number): string {
  // Çoğu uzman aynı ismi kullanır ama birkaçı farklı isim tercih eder
  const variants: Record<string, string[]> = {
    [COMMON_GROUPS.fiziksel]: ['Fiziksel Altyapı ve Güvenlik', 'Okul Binası ve Güvenlik', 'Yapısal İhtiyaçlar'],
    [COMMON_GROUPS.psikososyal]: ['Psikososyal Destek', 'Psikolojik Destek', 'Ruh Sağlığı Hizmetleri'],
    [COMMON_GROUPS.beslenme]: ['Beslenme ve Sağlık', 'Sağlık ve Beslenme', 'Temel Sağlık İhtiyaçları'],
    [COMMON_GROUPS.ekonomik]: ['Ekonomik Destek', 'Maddi Yardımlar', 'Finansal Destek'],
  };
  const arr = variants[base];
  if (!arr) return base;
  // İlk 8 uzman standart ismi kullanır, sonrakiler varyant
  if (expertIdx < 8) return arr[0];
  return arr[expertIdx % arr.length];
}

// ─── L1 Notları — Her uzman serbest metin yazar ─────────────────────────────

export const MOCK_L1_NOTES: L1Note[] = [
  // 0: Ayşe Yılmaz (Okul müdürü)
  { id: 'l1_ayse_0', expertName: EXPERTS[0], text: 'Fiziksel Altyapı\n- Okul binasında çatlaklar var, acil güçlendirme gerekli\n- Prefabrik sınıfların ısınma sorunu\n- Tuvaletler yetersiz, hijyen sorunu\n- Bahçe duvarı yıkıldı, çocuklar güvende değil\n- Yangın merdiveni hasarlı', timestamp: '2026-04-10T08:00:00Z' },
  { id: 'l1_ayse_1', expertName: EXPERTS[0], text: 'Eğitim\n- Ders kitapları enkaz altında kaldı\n- Akıllı tahta kırıldı\n- Bilgisayar laboratuvarı kullanılamaz\n- Kütüphane kitapları yok oldu', timestamp: '2026-04-10T08:05:00Z' },
  { id: 'l1_ayse_2', expertName: EXPERTS[0], text: 'Personel\n- 3 öğretmen başka ile tayin istedi\n- Rehber öğretmen yok\n- Öğretmenlerin moral/motivasyonu düşük\n- Hizmet içi eğitim gerekli (travma sonrası)', timestamp: '2026-04-10T08:10:00Z' },

  // 1: Mehmet Kara (Rehber öğretmen)
  { id: 'l1_mehmet_0', expertName: EXPERTS[1], text: 'Psikolojik Destek\n- Çocuklarda uyku bozukluğu yaygın\n- Artçı sarsıntılarda panik ataklar\n- Okula devamsızlık arttı, okul korkusu\n- Ailelerinde kayıp olan çocuklar var\n- Travma sonrası stres belirtileri', timestamp: '2026-04-10T09:00:00Z' },
  { id: 'l1_mehmet_1', expertName: EXPERTS[1], text: 'Rehberlik\n- Bireysel psikolojik danışmanlık kapasitesi yetersiz\n- Grup terapisi için mekan yok\n- Psikoeğitim materyalleri lazım\n- Aile danışmanlığı hizmeti şart\n- Kriz müdahale ekibi oluşturulmalı', timestamp: '2026-04-10T09:05:00Z' },

  // 2: Fatma Demir (Sınıf öğretmeni)
  { id: 'l1_fatma_0', expertName: EXPERTS[2], text: 'Sınıf İhtiyaçları\n- Sıra ve masalar kırık\n- Isıtma sistemi çalışmıyor\n- Aydınlatma yetersiz\n- Yazı tahtası kırıldı\n- Öğrenci çantası ve kırtasiye ihtiyacı', timestamp: '2026-04-10T10:00:00Z' },
  { id: 'l1_fatma_1', expertName: EXPERTS[2], text: 'Öğretim\n- Ders kitapları kayıp\n- Müfredat gerisinde kalındı, telafi eğitimi şart\n- Bireyselleştirilmiş eğitim programı gerekli\n- Oyun temelli öğrenme materyalleri\n- Çocuklar konsantre olamıyor', timestamp: '2026-04-10T10:05:00Z' },

  // 3: Ali Çelik (Okul psikoloğu)
  { id: 'l1_ali_0', expertName: EXPERTS[3], text: 'Travma\n- TSSB tarama yapılmalı\n- Sanat terapisi materyalleri gerekli\n- Güvenli alan (safe space) oluşturulmalı\n- Çocuklarda regresyon gözlemleniyor\n- Öğretmenlere psikolojik ilkyardım eğitimi', timestamp: '2026-04-10T11:00:00Z' },
  { id: 'l1_ali_1', expertName: EXPERTS[3], text: 'Sistemik\n- Sevk zinciri net değil, psikiyatri randevuları uzun\n- Aile danışmanlığı hizmeti şart\n- Akran desteği programı kurulmalı\n- Öğretmenlerin tükenmişliği yüksek\n- Süpervizyon mekanizması yok', timestamp: '2026-04-10T11:05:00Z' },

  // 4: Zeynep Aksoy (Sosyal hizmet uzmanı)
  { id: 'l1_zeynep_0', expertName: EXPERTS[4], text: 'Sosyal\n- Ailelerin barınma sorunu devam ediyor\n- Çocuk işçiliği riski artmış\n- Göç eden aileler nedeniyle sınıf mevcutları değişken\n- Engelli çocukların erişim sorunu\n- Ayrımcılık ve dışlanma vakaları', timestamp: '2026-04-10T12:00:00Z' },
  { id: 'l1_zeynep_1', expertName: EXPERTS[4], text: 'Ekonomik\n- Aileler okul masraflarını karşılayamıyor\n- Burs desteği gerekli\n- Ücretsiz yemek programı şart\n- Kırtasiye yardımı\n- Ulaşım desteği (servis)', timestamp: '2026-04-10T12:05:00Z' },

  // 5: Hasan Öztürk (İl MEM temsilcisi)
  { id: 'l1_hasan_0', expertName: EXPERTS[5], text: 'Altyapı\n- 12 okulda hasar tespiti yapıldı, 4ü ağır hasarlı\n- Prefabrik sınıf ihtiyacı acil\n- Isınma sistemi merkezi çözüm gerektirir\n- Okul bahçeleri moloz doldu\n- Spor salonu çöktü', timestamp: '2026-04-10T13:00:00Z' },
  { id: 'l1_hasan_1', expertName: EXPERTS[5], text: 'İdari\n- Öğretmen atama süreçleri hızlandırılmalı\n- Bütçe tahsisi bekleniyor\n- Veri tabanı güncellenmeli, öğrenci sayıları belirsiz\n- Okul aile birliği gelirleri sıfır\n- Taşımalı eğitim güzergahları değişti', timestamp: '2026-04-10T13:05:00Z' },

  // 6: Elif Şahin (STK koordinatörü)
  { id: 'l1_elif_0', expertName: EXPERTS[6], text: 'Acil İhtiyaçlar\n- Hijyen kitleri dağıtılmalı\n- Kışlık giysi ve battaniye\n- Çadır okul desteği\n- Psikososyal destek ekibi\n- Gıda paketi dağıtımı devam etmeli', timestamp: '2026-04-10T14:00:00Z' },
  { id: 'l1_elif_1', expertName: EXPERTS[6], text: 'Orta Vadeli\n- Kalıcı okul binası\n- Öğretmen kapasitesi güçlendirme\n- Toplum merkezi kurulması\n- Çocuk dostu alan (CFS)\n- Dijital eğitim platformu erişimi', timestamp: '2026-04-10T14:05:00Z' },

  // 7: Mustafa Aydın (Veli temsilcisi)
  { id: 'l1_mustafa_0', expertName: EXPERTS[7], text: 'Veliler olarak en çok endişelendiğimiz konular:\n- Okul binası güvenli mi?\n- Çocuklarımız deprem travması yaşıyor\n- Ücretsiz yemek verilmeli\n- Servis ücreti karşılanamıyor\n- Kitap ve defter ihtiyacı var', timestamp: '2026-04-10T15:00:00Z' },
  { id: 'l1_mustafa_1', expertName: EXPERTS[7], text: '- Sınıflar soğuk, ısıtma yok\n- Tuvaletler pis\n- Bahçede moloz var, tehlikeli\n- Öğretmenler sık değişiyor, çocuklar uyum sağlayamıyor\n- Burs desteği lazım', timestamp: '2026-04-10T15:05:00Z' },

  // 8: Seda Koç (Özel eğitim uzmanı)
  { id: 'l1_seda_0', expertName: EXPERTS[8], text: 'Özel Eğitim\n- Engelli rampaları yıkıldı\n- Özel eğitim sınıfı kullanılamaz durumda\n- Bireysel eğitim programları güncellenmeli\n- İşitme cihazı ve gözlük ihtiyacı\n- Kaynaştırma öğrencileri için destek yetersiz', timestamp: '2026-04-10T16:00:00Z' },
  { id: 'l1_seda_1', expertName: EXPERTS[8], text: 'Kapsayıcılık\n- Geçici koruma altındaki çocuklar için dil desteği\n- Mülteci çocuklara uyum programı\n- Kız çocuklarının okula devam oranı düştü\n- Yaş grubu karışık sınıflarda bireysel destek\n- Özel eğitim öğretmeni atanmalı', timestamp: '2026-04-10T16:05:00Z' },

  // 9: İbrahim Yıldız (Okul güvenlik uzmanı)
  { id: 'l1_ibrahim_0', expertName: EXPERTS[9], text: 'Güvenlik\n- Deprem tahliye planı güncellenmeli\n- Yangın söndürme cihazları kontrol edilmeli\n- CCTV kameraları çalışmıyor\n- Nöbetçi öğretmen yetersiz\n- Bahçe duvarı ve çit tamiri\n- Acil toplanma alanı belirlenmeli', timestamp: '2026-04-10T17:00:00Z' },
  { id: 'l1_ibrahim_1', expertName: EXPERTS[9], text: 'Tatbikat\n- Deprem tatbikatı düzenli yapılmalı\n- İlkyardım eğitimi öğretmen ve öğrencilere\n- Afet çantası hazırlanmalı\n- Okul afet planı oluşturulmalı\n- Velilere bilgilendirme toplantısı', timestamp: '2026-04-10T17:05:00Z' },

  // 10: Derya Arslan (Beslenme / sağlık uzmanı)
  { id: 'l1_derya_0', expertName: EXPERTS[10], text: 'Beslenme\n- Ücretsiz öğle yemeği programı acil\n- Okul kantini çalışmıyor\n- Süt dağıtım programı devam etmeli\n- Beslenme eğitimi verilmeli\n- Alerji ve kronik hastalık takibi', timestamp: '2026-04-10T18:00:00Z' },
  { id: 'l1_derya_1', expertName: EXPERTS[10], text: 'Sağlık\n- Okul sağlık odası hasarlı\n- İlkyardım malzemesi yok\n- Diş tarama programı\n- Göz tarama programı\n- Aşı takibi güncellenmeli\n- Hijyen eğitimi ve malzemesi', timestamp: '2026-04-10T18:05:00Z' },

  // 11: Kemal Bulut (Altyapı / mühendislik)
  { id: 'l1_kemal_0', expertName: EXPERTS[11], text: 'Yapısal\n- Ana bina B2 hasar sınıfı, güçlendirme şart\n- Prefabrik geçici sınıflar 6 ay içinde kurulmalı\n- Elektrik tesisatı yenilenmeli\n- Su tesisatı sızıntı yapıyor\n- Çatı izolasyonu bozuk', timestamp: '2026-04-10T19:00:00Z' },
  { id: 'l1_kemal_1', expertName: EXPERTS[11], text: 'Donanım\n- Isıtma sistemi (merkezi kalorifer) tamamen değişmeli\n- Aydınlatma LED panele geçilmeli\n- Spor salonu yeniden inşa edilmeli\n- Bilgisayar laboratuvarı ekipmanı\n- Akıllı tahta kurulumu\n- Jeneratör alınmalı (elektrik kesintileri için)', timestamp: '2026-04-10T19:05:00Z' },
];

// ─── L2 Tasnif Sonuçları — Her uzman ihtiyaçları gruplara koymuş ─────────────
// Consensus testi: Yüksek (10+/12 aynı gruba), Orta (6-9/12), Düşük (1-5/12)

function gId(expert: number, group: number) { return `g_${expert}_${group}`; }
function nId(expert: number, need: number) { return `n_${expert}_${need}`; }

export const MOCK_L2_RESULTS: ExpertResult[] = [
  // ── 0: Ayşe Yılmaz ──────────────────────────────────────────────────
  {
    expertName: EXPERTS[0],
    groups: [
      { id: gId(0,1), name: expertGroupName(COMMON_GROUPS.fiziksel, 0), stage: 'selected' },
      { id: gId(0,2), name: expertGroupName(COMMON_GROUPS.egitim, 0), stage: 'selected' },
      { id: gId(0,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 0), stage: 'selected' },
      { id: gId(0,4), name: expertGroupName(COMMON_GROUPS.ogretmen, 0), stage: 'selected' },
      { id: gId(0,5), name: expertGroupName(COMMON_GROUPS.beslenme, 0), stage: 'selected' },
    ],
    needs: [
      // Fiziksel (yüksek consensus hedefi)
      { id: nId(0,1),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,2),  text: 'Prefabrik sınıf ihtiyacı',           stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,3),  text: 'Isıtma sistemi tamiri',              stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,4),  text: 'Tuvalet ve hijyen iyileştirme',      stage: 'selected', groupId: gId(0,1) },
      { id: nId(0,5),  text: 'Bahçe duvarı tamiri',                stage: 'selected', groupId: gId(0,1) },
      // Eğitim
      { id: nId(0,6),  text: 'Ders kitabı temini',                 stage: 'selected', groupId: gId(0,2) },
      { id: nId(0,7),  text: 'Akıllı tahta kurulumu',              stage: 'selected', groupId: gId(0,2) },
      { id: nId(0,8),  text: 'Bilgisayar laboratuvarı yenileme',   stage: 'selected', groupId: gId(0,2) },
      { id: nId(0,9),  text: 'Kütüphane yeniden kurulumu',         stage: 'selected', groupId: gId(0,2) },
      // Psikososyal
      { id: nId(0,10), text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(0,3) },
      { id: nId(0,11), text: 'Aile danışmanlığı hizmeti',          stage: 'selected', groupId: gId(0,3) },
      // Öğretmen
      { id: nId(0,12), text: 'Öğretmenlere travma eğitimi',        stage: 'selected', groupId: gId(0,4) },
      { id: nId(0,13), text: 'Öğretmen motivasyon desteği',        stage: 'selected', groupId: gId(0,4) },
      // Beslenme
      { id: nId(0,14), text: 'Ücretsiz öğle yemeği',               stage: 'selected', groupId: gId(0,5) },
      // Pool
      { id: nId(0,15), text: 'Yangın merdiveni tamiri',            stage: 'pool' },
      { id: nId(0,16), text: 'Spor salonu inşası',                 stage: 'pool' },
    ],
  },

  // ── 1: Mehmet Kara ──────────────────────────────────────────────────
  {
    expertName: EXPERTS[1],
    groups: [
      { id: gId(1,1), name: expertGroupName(COMMON_GROUPS.psikososyal, 1), stage: 'selected' },
      { id: gId(1,2), name: expertGroupName(COMMON_GROUPS.fiziksel, 1), stage: 'selected' },
      { id: gId(1,3), name: expertGroupName(COMMON_GROUPS.egitim, 1), stage: 'selected' },
      { id: gId(1,4), name: expertGroupName(COMMON_GROUPS.ogretmen, 1), stage: 'selected' },
      { id: gId(1,5), name: expertGroupName(COMMON_GROUPS.ekonomik, 1), stage: 'selected' },
    ],
    needs: [
      // Psikososyal
      { id: nId(1,1),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,2),  text: 'Aile danışmanlığı hizmeti',          stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,3),  text: 'Kriz müdahale ekibi',                stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,4),  text: 'Psikoeğitim materyalleri',           stage: 'selected', groupId: gId(1,1) },
      { id: nId(1,5),  text: 'Akran desteği programı',             stage: 'selected', groupId: gId(1,1) },
      // Fiziksel
      { id: nId(1,6),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(1,2) },
      { id: nId(1,7),  text: 'Isıtma sistemi tamiri',              stage: 'selected', groupId: gId(1,2) },
      // Eğitim
      { id: nId(1,8),  text: 'Ders kitabı temini',                 stage: 'selected', groupId: gId(1,3) },
      { id: nId(1,9),  text: 'Telafi eğitimi programı',            stage: 'selected', groupId: gId(1,3) },
      // Öğretmen
      { id: nId(1,10), text: 'Öğretmenlere travma eğitimi',        stage: 'selected', groupId: gId(1,4) },
      { id: nId(1,11), text: 'Öğretmen motivasyon desteği',        stage: 'selected', groupId: gId(1,4) },
      // Ekonomik
      { id: nId(1,12), text: 'Burs desteği',                       stage: 'selected', groupId: gId(1,5) },
      // Pool
      { id: nId(1,13), text: 'Grup terapisi mekanı',               stage: 'pool' },
    ],
  },

  // ── 2: Fatma Demir ──────────────────────────────────────────────────
  {
    expertName: EXPERTS[2],
    groups: [
      { id: gId(2,1), name: expertGroupName(COMMON_GROUPS.fiziksel, 2), stage: 'selected' },
      { id: gId(2,2), name: expertGroupName(COMMON_GROUPS.egitim, 2), stage: 'selected' },
      { id: gId(2,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 2), stage: 'selected' },
      { id: gId(2,4), name: expertGroupName(COMMON_GROUPS.ekonomik, 2), stage: 'selected' },
    ],
    needs: [
      // Fiziksel
      { id: nId(2,1),  text: 'Isıtma sistemi tamiri',              stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,2),  text: 'Sıra ve masa temini',                stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,3),  text: 'Aydınlatma iyileştirme',             stage: 'selected', groupId: gId(2,1) },
      { id: nId(2,4),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(2,1) },
      // Eğitim
      { id: nId(2,5),  text: 'Ders kitabı temini',                 stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,6),  text: 'Telafi eğitimi programı',            stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,7),  text: 'Oyun temelli öğrenme materyalleri',   stage: 'selected', groupId: gId(2,2) },
      { id: nId(2,8),  text: 'Kırtasiye malzemesi temini',         stage: 'selected', groupId: gId(2,2) },
      // Psikososyal
      { id: nId(2,9),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(2,3) },
      // Ekonomik
      { id: nId(2,10), text: 'Kırtasiye malzemesi temini',         stage: 'selected', groupId: gId(2,4) },
      // Pool
      { id: nId(2,11), text: 'Yazı tahtası değişimi',              stage: 'pool' },
    ],
  },

  // ── 3: Ali Çelik ────────────────────────────────────────────────────
  {
    expertName: EXPERTS[3],
    groups: [
      { id: gId(3,1), name: expertGroupName(COMMON_GROUPS.psikososyal, 3), stage: 'selected' },
      { id: gId(3,2), name: expertGroupName(COMMON_GROUPS.ogretmen, 3), stage: 'selected' },
      { id: gId(3,3), name: expertGroupName(COMMON_GROUPS.fiziksel, 3), stage: 'selected' },
    ],
    needs: [
      // Psikososyal
      { id: nId(3,1),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,2),  text: 'Aile danışmanlığı hizmeti',          stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,3),  text: 'Sanat terapisi materyalleri',         stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,4),  text: 'Güvenli alan oluşturma',             stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,5),  text: 'Akran desteği programı',             stage: 'selected', groupId: gId(3,1) },
      { id: nId(3,6),  text: 'Kriz müdahale ekibi',                stage: 'selected', groupId: gId(3,1) },
      // Öğretmen
      { id: nId(3,7),  text: 'Öğretmenlere travma eğitimi',        stage: 'selected', groupId: gId(3,2) },
      { id: nId(3,8),  text: 'Öğretmen motivasyon desteği',        stage: 'selected', groupId: gId(3,2) },
      { id: nId(3,9),  text: 'Süpervizyon mekanizması',            stage: 'selected', groupId: gId(3,2) },
      // Fiziksel
      { id: nId(3,10), text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(3,3) },
      // Pool
      { id: nId(3,11), text: 'TSSB tarama programı',               stage: 'pool' },
    ],
  },

  // ── 4: Zeynep Aksoy ────────────────────────────────────────────────
  {
    expertName: EXPERTS[4],
    groups: [
      { id: gId(4,1), name: expertGroupName(COMMON_GROUPS.ekonomik, 4), stage: 'selected' },
      { id: gId(4,2), name: expertGroupName(COMMON_GROUPS.ozelEgitim, 4), stage: 'selected' },
      { id: gId(4,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 4), stage: 'selected' },
      { id: gId(4,4), name: expertGroupName(COMMON_GROUPS.beslenme, 4), stage: 'selected' },
      { id: gId(4,5), name: expertGroupName(COMMON_GROUPS.fiziksel, 4), stage: 'selected' },
    ],
    needs: [
      // Ekonomik
      { id: nId(4,1),  text: 'Burs desteği',                       stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,2),  text: 'Ulaşım desteği',                    stage: 'selected', groupId: gId(4,1) },
      { id: nId(4,3),  text: 'Kırtasiye malzemesi temini',         stage: 'selected', groupId: gId(4,1) },
      // Özel eğitim
      { id: nId(4,4),  text: 'Engelli erişim düzenlemesi',         stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,5),  text: 'Dil desteği programı',               stage: 'selected', groupId: gId(4,2) },
      { id: nId(4,6),  text: 'Kız çocukları devam programı',       stage: 'selected', groupId: gId(4,2) },
      // Psikososyal
      { id: nId(4,7),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(4,3) },
      { id: nId(4,8),  text: 'Aile danışmanlığı hizmeti',          stage: 'selected', groupId: gId(4,3) },
      // Beslenme
      { id: nId(4,9),  text: 'Ücretsiz öğle yemeği',               stage: 'selected', groupId: gId(4,4) },
      // Fiziksel
      { id: nId(4,10), text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(4,5) },
      // Pool
      { id: nId(4,11), text: 'Çocuk işçiliği önleme programı',     stage: 'pool' },
      { id: nId(4,12), text: 'Mülteci çocuk uyum programı',        stage: 'pool' },
    ],
  },

  // ── 5: Hasan Öztürk ────────────────────────────────────────────────
  {
    expertName: EXPERTS[5],
    groups: [
      { id: gId(5,1), name: expertGroupName(COMMON_GROUPS.fiziksel, 5), stage: 'selected' },
      { id: gId(5,2), name: expertGroupName(COMMON_GROUPS.egitim, 5), stage: 'selected' },
      { id: gId(5,3), name: expertGroupName(COMMON_GROUPS.ogretmen, 5), stage: 'selected' },
      { id: gId(5,4), name: expertGroupName(COMMON_GROUPS.ekonomik, 5), stage: 'selected' },
      { id: gId(5,5), name: expertGroupName(COMMON_GROUPS.teknoloji, 5), stage: 'selected' },
    ],
    needs: [
      // Fiziksel
      { id: nId(5,1),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(5,1) },
      { id: nId(5,2),  text: 'Prefabrik sınıf ihtiyacı',           stage: 'selected', groupId: gId(5,1) },
      { id: nId(5,3),  text: 'Isıtma sistemi tamiri',              stage: 'selected', groupId: gId(5,1) },
      { id: nId(5,4),  text: 'Spor salonu inşası',                 stage: 'selected', groupId: gId(5,1) },
      { id: nId(5,5),  text: 'Bahçe temizliği ve düzenleme',       stage: 'selected', groupId: gId(5,1) },
      // Eğitim
      { id: nId(5,6),  text: 'Ders kitabı temini',                 stage: 'selected', groupId: gId(5,2) },
      // Öğretmen
      { id: nId(5,7),  text: 'Öğretmen atama süreçleri',           stage: 'selected', groupId: gId(5,3) },
      { id: nId(5,8),  text: 'Öğretmenlere travma eğitimi',        stage: 'selected', groupId: gId(5,3) },
      // Ekonomik
      { id: nId(5,9),  text: 'Burs desteği',                       stage: 'selected', groupId: gId(5,4) },
      { id: nId(5,10), text: 'Ulaşım desteği',                    stage: 'selected', groupId: gId(5,4) },
      // Teknoloji
      { id: nId(5,11), text: 'Bilgisayar laboratuvarı yenileme',   stage: 'selected', groupId: gId(5,5) },
      { id: nId(5,12), text: 'Akıllı tahta kurulumu',              stage: 'selected', groupId: gId(5,5) },
      // Pool
      { id: nId(5,13), text: 'Taşımalı eğitim güzergah güncellemesi', stage: 'pool' },
    ],
  },

  // ── 6: Elif Şahin ──────────────────────────────────────────────────
  {
    expertName: EXPERTS[6],
    groups: [
      { id: gId(6,1), name: expertGroupName(COMMON_GROUPS.beslenme, 6), stage: 'selected' },
      { id: gId(6,2), name: expertGroupName(COMMON_GROUPS.psikososyal, 6), stage: 'selected' },
      { id: gId(6,3), name: expertGroupName(COMMON_GROUPS.fiziksel, 6), stage: 'selected' },
      { id: gId(6,4), name: expertGroupName(COMMON_GROUPS.egitim, 6), stage: 'selected' },
      { id: gId(6,5), name: expertGroupName(COMMON_GROUPS.ozelEgitim, 6), stage: 'selected' },
    ],
    needs: [
      // Beslenme
      { id: nId(6,1),  text: 'Ücretsiz öğle yemeği',               stage: 'selected', groupId: gId(6,1) },
      { id: nId(6,2),  text: 'Hijyen kitleri dağıtımı',            stage: 'selected', groupId: gId(6,1) },
      // Psikososyal
      { id: nId(6,3),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(6,2) },
      { id: nId(6,4),  text: 'Güvenli alan oluşturma',             stage: 'selected', groupId: gId(6,2) },
      // Fiziksel
      { id: nId(6,5),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(6,3) },
      { id: nId(6,6),  text: 'Prefabrik sınıf ihtiyacı',           stage: 'selected', groupId: gId(6,3) },
      // Eğitim
      { id: nId(6,7),  text: 'Ders kitabı temini',                 stage: 'selected', groupId: gId(6,4) },
      { id: nId(6,8),  text: 'Dijital eğitim platformu',           stage: 'selected', groupId: gId(6,4) },
      // Özel eğitim
      { id: nId(6,9),  text: 'Dil desteği programı',               stage: 'selected', groupId: gId(6,5) },
      // Pool
      { id: nId(6,10), text: 'Çadır okul desteği',                 stage: 'pool' },
      { id: nId(6,11), text: 'Kışlık giysi dağıtımı',             stage: 'pool' },
    ],
  },

  // ── 7: Mustafa Aydın ───────────────────────────────────────────────
  {
    expertName: EXPERTS[7],
    groups: [
      { id: gId(7,1), name: expertGroupName(COMMON_GROUPS.fiziksel, 7), stage: 'selected' },
      { id: gId(7,2), name: expertGroupName(COMMON_GROUPS.beslenme, 7), stage: 'selected' },
      { id: gId(7,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 7), stage: 'selected' },
      { id: gId(7,4), name: expertGroupName(COMMON_GROUPS.ekonomik, 7), stage: 'selected' },
      { id: gId(7,5), name: expertGroupName(COMMON_GROUPS.egitim, 7), stage: 'selected' },
    ],
    needs: [
      // Fiziksel
      { id: nId(7,1),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(7,1) },
      { id: nId(7,2),  text: 'Isıtma sistemi tamiri',              stage: 'selected', groupId: gId(7,1) },
      { id: nId(7,3),  text: 'Tuvalet ve hijyen iyileştirme',      stage: 'selected', groupId: gId(7,1) },
      { id: nId(7,4),  text: 'Bahçe temizliği ve düzenleme',       stage: 'selected', groupId: gId(7,1) },
      // Beslenme
      { id: nId(7,5),  text: 'Ücretsiz öğle yemeği',               stage: 'selected', groupId: gId(7,2) },
      // Psikososyal
      { id: nId(7,6),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(7,3) },
      // Ekonomik
      { id: nId(7,7),  text: 'Burs desteği',                       stage: 'selected', groupId: gId(7,4) },
      { id: nId(7,8),  text: 'Ulaşım desteği',                    stage: 'selected', groupId: gId(7,4) },
      // Eğitim
      { id: nId(7,9),  text: 'Ders kitabı temini',                 stage: 'selected', groupId: gId(7,5) },
      { id: nId(7,10), text: 'Kırtasiye malzemesi temini',         stage: 'selected', groupId: gId(7,5) },
      // Pool
      { id: nId(7,11), text: 'Öğretmen sık değişimi sorunu',       stage: 'pool' },
    ],
  },

  // ── 8: Seda Koç ────────────────────────────────────────────────────
  {
    expertName: EXPERTS[8],
    groups: [
      { id: gId(8,1), name: expertGroupName(COMMON_GROUPS.ozelEgitim, 8), stage: 'selected' },
      { id: gId(8,2), name: expertGroupName(COMMON_GROUPS.fiziksel, 8), stage: 'selected' },
      { id: gId(8,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 8), stage: 'selected' },
      { id: gId(8,4), name: expertGroupName(COMMON_GROUPS.egitim, 8), stage: 'selected' },
    ],
    needs: [
      // Özel eğitim
      { id: nId(8,1),  text: 'Engelli erişim düzenlemesi',         stage: 'selected', groupId: gId(8,1) },
      { id: nId(8,2),  text: 'Dil desteği programı',               stage: 'selected', groupId: gId(8,1) },
      { id: nId(8,3),  text: 'Kız çocukları devam programı',       stage: 'selected', groupId: gId(8,1) },
      { id: nId(8,4),  text: 'Özel eğitim öğretmeni atanması',     stage: 'selected', groupId: gId(8,1) },
      { id: nId(8,5),  text: 'Bireyselleştirilmiş eğitim programı', stage: 'selected', groupId: gId(8,1) },
      // Fiziksel
      { id: nId(8,6),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(8,2) },
      // Psikososyal
      { id: nId(8,7),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(8,3) },
      { id: nId(8,8),  text: 'Aile danışmanlığı hizmeti',          stage: 'selected', groupId: gId(8,3) },
      // Eğitim
      { id: nId(8,9),  text: 'Telafi eğitimi programı',            stage: 'selected', groupId: gId(8,4) },
      // Pool
      { id: nId(8,10), text: 'İşitme cihazı ve gözlük temini',    stage: 'pool' },
      { id: nId(8,11), text: 'Kaynaştırma destek programı',        stage: 'pool' },
    ],
  },

  // ── 9: İbrahim Yıldız ──────────────────────────────────────────────
  {
    expertName: EXPERTS[9],
    groups: [
      { id: gId(9,1), name: expertGroupName(COMMON_GROUPS.fiziksel, 9), stage: 'selected' },
      { id: gId(9,2), name: expertGroupName(COMMON_GROUPS.ogretmen, 9), stage: 'selected' },
      { id: gId(9,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 9), stage: 'selected' },
    ],
    needs: [
      // Fiziksel (güvenlik odaklı)
      { id: nId(9,1),  text: 'Okul binası güçlendirme',            stage: 'selected', groupId: gId(9,1) },
      { id: nId(9,2),  text: 'Bahçe duvarı tamiri',                stage: 'selected', groupId: gId(9,1) },
      { id: nId(9,3),  text: 'Deprem tahliye planı güncelleme',    stage: 'selected', groupId: gId(9,1) },
      { id: nId(9,4),  text: 'Yangın söndürme cihazı kontrolü',    stage: 'selected', groupId: gId(9,1) },
      { id: nId(9,5),  text: 'Acil toplanma alanı belirleme',      stage: 'selected', groupId: gId(9,1) },
      // Öğretmen
      { id: nId(9,6),  text: 'Öğretmenlere travma eğitimi',        stage: 'selected', groupId: gId(9,2) },
      { id: nId(9,7),  text: 'İlkyardım eğitimi',                  stage: 'selected', groupId: gId(9,2) },
      // Psikososyal
      { id: nId(9,8),  text: 'Travma sonrası psikolojik destek',   stage: 'selected', groupId: gId(9,3) },
      // Pool
      { id: nId(9,9),  text: 'CCTV kamera sistemi',                stage: 'pool' },
      { id: nId(9,10), text: 'Jeneratör alımı',                    stage: 'pool' },
      { id: nId(9,11), text: 'Okul afet planı oluşturma',          stage: 'pool' },
    ],
  },

  // ── 10: Derya Arslan ───────────────────────────────────────────────
  {
    expertName: EXPERTS[10],
    groups: [
      { id: gId(10,1), name: expertGroupName(COMMON_GROUPS.beslenme, 10), stage: 'selected' },
      { id: gId(10,2), name: expertGroupName(COMMON_GROUPS.fiziksel, 10), stage: 'selected' },
      { id: gId(10,3), name: expertGroupName(COMMON_GROUPS.psikososyal, 10), stage: 'selected' },
      { id: gId(10,4), name: expertGroupName(COMMON_GROUPS.egitim, 10), stage: 'selected' },
    ],
    needs: [
      // Beslenme
      { id: nId(10,1),  text: 'Ücretsiz öğle yemeği',              stage: 'selected', groupId: gId(10,1) },
      { id: nId(10,2),  text: 'Süt dağıtım programı',             stage: 'selected', groupId: gId(10,1) },
      { id: nId(10,3),  text: 'Hijyen kitleri dağıtımı',           stage: 'selected', groupId: gId(10,1) },
      { id: nId(10,4),  text: 'Beslenme eğitimi',                  stage: 'selected', groupId: gId(10,1) },
      // Fiziksel
      { id: nId(10,5),  text: 'Okul binası güçlendirme',           stage: 'selected', groupId: gId(10,2) },
      { id: nId(10,6),  text: 'Tuvalet ve hijyen iyileştirme',     stage: 'selected', groupId: gId(10,2) },
      // Psikososyal
      { id: nId(10,7),  text: 'Travma sonrası psikolojik destek',  stage: 'selected', groupId: gId(10,3) },
      // Eğitim
      { id: nId(10,8),  text: 'Ders kitabı temini',                stage: 'selected', groupId: gId(10,4) },
      // Pool
      { id: nId(10,9),  text: 'Okul sağlık odası tamiri',          stage: 'pool' },
      { id: nId(10,10), text: 'Diş tarama programı',               stage: 'pool' },
      { id: nId(10,11), text: 'Göz tarama programı',               stage: 'pool' },
    ],
  },

  // ── 11: Kemal Bulut ────────────────────────────────────────────────
  {
    expertName: EXPERTS[11],
    groups: [
      { id: gId(11,1), name: expertGroupName(COMMON_GROUPS.fiziksel, 11), stage: 'selected' },
      { id: gId(11,2), name: expertGroupName(COMMON_GROUPS.teknoloji, 11), stage: 'selected' },
      { id: gId(11,3), name: expertGroupName(COMMON_GROUPS.egitim, 11), stage: 'selected' },
    ],
    needs: [
      // Fiziksel
      { id: nId(11,1),  text: 'Okul binası güçlendirme',           stage: 'selected', groupId: gId(11,1) },
      { id: nId(11,2),  text: 'Prefabrik sınıf ihtiyacı',          stage: 'selected', groupId: gId(11,1) },
      { id: nId(11,3),  text: 'Isıtma sistemi tamiri',             stage: 'selected', groupId: gId(11,1) },
      { id: nId(11,4),  text: 'Elektrik tesisatı yenileme',        stage: 'selected', groupId: gId(11,1) },
      { id: nId(11,5),  text: 'Su tesisatı tamiri',                stage: 'selected', groupId: gId(11,1) },
      { id: nId(11,6),  text: 'Çatı izolasyonu',                   stage: 'selected', groupId: gId(11,1) },
      { id: nId(11,7),  text: 'Spor salonu inşası',                stage: 'selected', groupId: gId(11,1) },
      // Teknoloji
      { id: nId(11,8),  text: 'Bilgisayar laboratuvarı yenileme',  stage: 'selected', groupId: gId(11,2) },
      { id: nId(11,9),  text: 'Akıllı tahta kurulumu',             stage: 'selected', groupId: gId(11,2) },
      { id: nId(11,10), text: 'Jeneratör alımı',                   stage: 'selected', groupId: gId(11,2) },
      // Eğitim
      { id: nId(11,11), text: 'Ders kitabı temini',                stage: 'selected', groupId: gId(11,3) },
      // Pool
      { id: nId(11,12), text: 'Aydınlatma LED panele geçiş',       stage: 'pool' },
    ],
  },
];

// ─── Consensus Beklentisi (referans) ─────────────────────────────────────────
// Yüksek consensus (>=10/12):
//   - "Okul binası güçlendirme" → Fiziksel (12/12 = %100)
//   - "Travma sonrası psikolojik destek" → Psikososyal (11/12 = %92)
//   - "Ders kitabı temini" → Eğitim (9/12 = %75)
//   - "Isıtma sistemi tamiri" → Fiziksel (6/12 ama hepsi aynı gruba)
// Orta consensus (5-8/12):
//   - "Öğretmenlere travma eğitimi" → Öğretmen (5/12 = %42)
//   - "Burs desteği" → Ekonomik (4/12 = %33)
//   - "Ücretsiz öğle yemeği" → Beslenme (5/12 = %42)
// Düşük consensus (<5/12):
//   - "Spor salonu inşası" → Fiziksel (2/12 = %17)
//   - "Jeneratör alımı" → pool'da çoğu uzman
//   - "Sanat terapisi materyalleri" → tek uzman
