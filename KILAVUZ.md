# MagnetiX: İhtiyaç Panosu — Kullanım Kılavuzu

## Genel Bakış

MagnetiX, deprem sonrası eğitim ihtiyaçlarının uzman görüşleriyle belirlenmesi ve uzlaşma ile önceliklendirilmesi için tasarlanmış bir Delphi-benzeri karar destek sistemidir.

Sistem 3 uygulamadan oluşur ve veri akışı şu sırayla ilerler:

```
Expert (L1)  →  Preprocessor  →  Expert (L2)  →  Moderator (L3)
  Not yaz        İşle & Grupla     Tasnif et       Uzlaşma gör
```

---

## 1. Expert — L1 Modu (Not Yazma)

**Kim kullanır:** Uzmanlar (öğretmen, psikolog, STK temsilcisi vb.)

1. Expert uygulamasını aç
2. Adını gir, oturum seç, mod olarak **L1** seç
3. **Giriş Yap** butonuna tıkla
4. Açık uçlu olarak çocukların eğitim ihtiyaçlarını yaz
   - Her not bir kart olarak eklenir
   - Notları düzenleyebilir veya silebilirsin
5. **Gönder** butonuna tıkla
6. Notlar Firestore'a kaydedilir, "Bitti" ekranı gösterilir

---

## 2. Preprocessor (Ön İşleme)

**Kim kullanır:** Moderatör / araştırmacı

1. Preprocessor uygulamasını aç
2. Adını gir, mevcut oturumu seç veya yeni oturum oluştur
3. **Giriş Yap** butonuna tıkla
4. Veri kaynağını seç:
   - **Firestore** — L1'den gelen gerçek notlar
   - **JSON dosya** — dışarıdan yükleme
   - **localStorage** — tarayıcı belleği
   - **Mock** — 12 uzmanın hazır test verisi
5. **İşle** butonuna tıkla
   - Notlar otomatik olarak parse edilir, tekrarlar ayıklanır
   - Kural tabanlı olarak 8 kategoriye atanır
   - (Opsiyonel) LLM ile akıllı kategorileme yapılabilir
6. İnceleme ekranında:
   - Kartları sürükle-bırak ile gruplar arası taşı
   - Birden fazla kart seç ve **birleştir**
   - Yeni kategori oluştur
   - Kartları düzenle veya sil
7. **Onayla** butonuna tıkla
   - İşlenmiş veri (T2) Firestore'a kaydedilir
   - JSON olarak da indirilebilir

---

## 3. Expert — L2 Modu (Tasnif)

**Kim kullanır:** Uzmanlar (aynı kişiler, ikinci tur)

1. Expert uygulamasını aç
2. Adını gir, oturum seç, mod olarak **L2** seç
3. **Giriş Yap** butonuna tıkla
4. Preprocessor'dan gelen ihtiyaç kartları pool'da görünür
5. Gruplar oluştur (veya mevcut grupları kullan)
6. Kartları pool'dan gruplara **sürükle-bırak** ile tasnif et
   - Grup adlarını düzenleyebilirsin
   - Yeni grup ekleyebilirsin
   - Kartları gruplar arası taşıyabilirsin
7. **Gönder** butonuna tıkla
   - Tasnif sonucu (T3) Firestore'a kaydedilir

---

## 4. Moderator — L3 (Uzlaşma Treemap)

**Kim kullanır:** Moderatör / araştırmacı

1. Moderator uygulamasını aç
2. Adını gir, oturumu seç
3. **Giriş Yap** butonuna tıkla
4. Tüm uzmanların L2 tasnif sonuçları otomatik yüklenir
5. Uzlaşma (consensus) hesaplanır:
   - Her ihtiyaç için uzmanların çoğunluğunun aynı gruba koyduğu oran hesaplanır
   - **%25 ve üzeri** uzlaşma olan ihtiyaçlar otomatik olarak gruba atanır
   - Altında kalanlar **Pool** panelinde kalır
6. **Treemap** görünümünde:
   - Gruplar alan büyüklüğüne göre gösterilir (daha yüksek uzlaşma = daha büyük alan)
   - Her kartın yanında uzlaşma yüzdesi gösterilir
   - Pool'dan gruplara sürükle-bırak yapabilirsin
   - Yeni grup ekleyebilirsin
   - Grup isimlerini düzenleyebilirsin
7. **L2 Yükle** butonu ile JSON dosyasından ek uzman sonuçları yüklenebilir
8. **Kaydet** butonu ile son durumu kaydedebilirsin

---

## Veri Akışı Özeti

| Adım | Girdi | Çıktı | Depolama |
|------|-------|-------|----------|
| L1 (Expert) | Uzman serbest metin yazar | T1: Ham notlar | Firestore `l1_notes` |
| Preprocessor | T1 notları | T2: Gruplanmış kartlar | Firestore `preprocessed` |
| L2 (Expert) | T2 kartları | T3: Uzman tasnifi | Firestore `l2_results` |
| L3 (Moderator) | Tüm T3'ler | Uzlaşma treemap | Ekranda gösterilir |

---

## Vercel Deploy

Aynı GitHub reposunu 3 kez import edin, her biri farklı root directory ile:

| Proje Adı | Root Directory | Build Command | Output |
|-----------|---------------|---------------|--------|
| magnetix-expert | `expert` | `npm run build` | `dist` |
| magnetix-preprocessor | `preprocessor` | `npm run build` | `dist` |
| magnetix-moderator | `moderator` | `npm run build` | `dist` |

---

## Teknoloji

React 19, TypeScript, Vite 6, Tailwind CSS v4, Firebase Firestore, @dnd-kit, Motion (Framer Motion), Lucide Icons
