# 📐 Math Studio • System Nakładek OBS do Matematyki (Tablet Huion)

Profesjonalny, nowoczesny prototyp aplikacji webowej typu **Broadcast Web Engine** zaprojektowany do nagrywania i transmisji lekcji matematyki na YouTube w **OBS Studio (1920x1080 60 FPS)** przy użyciu tabletu graficznego **Huion**.

---

## 🚀 Szybki start (1-Kliknięcie)

1. Uruchom plik **`run_studio.bat`** (lub wpisz `npm run dev` w terminalu).
2. Otworzy się automatycznie strona główna: `http://localhost:3000/`.
3. System uruchamia:
   - **Serwer WebSocket (Socket.io)** na porcie `3001` (Single Source of Truth)
   - **Aplikację Frontend (React 18 + Vite)** na porcie `3000`

---

## 🖥️ Dostępne widoki

| Widok | Adres URL | Opis i Zastosowanie |
|---|---|---|
| **Hub Nawigacyjny** | [`http://localhost:3000/`](http://localhost:3000/) | Panel powitalny z instrukcjami, kopiowaniem linku do OBS oraz skrótami |
| **Nakładka OBS** | [`http://localhost:3000/overlay`](http://localhost:3000/overlay) | **Główny widok do OBS Browser Source (1920×1080)**: Deszcz Matrixa 60 FPS, główny arkusz (1400×1048), wycięcie na kamerkę twarzy (472×290), kafelek z treścią zadania (472×742) oraz stoper |
| **Arkusz Tabletu Huion** | [`http://localhost:3000/presenter`](http://localhost:3000/presenter) | **Widok na tablet z ekranem (np. Huion Kamvas) lub laptop**: Pełnoekranowy arkusz z obsługą siły nacisku rysika Huion (W3C Pointer Events API), kaligrafią Beziera, paskiem narzędzi i wysuwaną treścią zadania |
| **Panel Reżysera** | [`http://localhost:3000/director`](http://localhost:3000/director) | **Sterowanie ze smartfona / drugiego monitora**: Zmiana zadań, odkrywanie stopniowych wskazówek, stoper z alertami, czyszczenie tablicy oraz wysyłanie banerów live i konfetti |

---

## 🎥 Konfiguracja w OBS Studio (Krok po kroku)

1. W OBS Studio utwórz Scenę, np. **"Lekcja Matematyki"**.
2. Dodaj źródło typu **Przeglądarka (Browser)**:
   - **URL**: `http://localhost:3000/overlay`
   - **Szerokość (Width)**: `1920`
   - **Wysokość (Height)**: `1080`
   - **FPS**: `60`
   - Zaznacz: *Odśwież przeglądarkę, gdy scena stanie się aktywna*
   - **Niestandardowy CSS**:
     ```css
     body { background: transparent; margin: 0px auto; overflow: hidden; }
     ```
3. W warstwach pod nakładką umieść swoje fizyczne źródło kamery (lub skorzystaj z wbudowanego podglądu kamery). Okienko kamerki w prawym górnym rogu (472×290 px) jest w 100% przezroczyste.

---

## ✍️ Integracja z Tabletem Huion & Skróty Klawiszowe

W sterowniku **Huion Tablet Driver** przypisz przyciski funkcyjne (ExpressKeys) na obudowie lub rysiku do poniższych skrótów:

- **`[1]`** – Pióro: Kolor biały (podstawowe notatki)
- **`[2]`** – Pióro: Kolor neon żółty / złoty (założenia, wzory kluczowe)
- **`[3]`** – Pióro: Kolor neon cyan (odpowiedzi, wyniki końcowe)
- **`[4]`** – Pióro: Kolor szmaragd (uproszczenia i kroki poprawne)
- **`[5]`** – Pióro: Kolor różowy / ostrzeżenie
- **`[E]`** – Przełączenie trybu Gumki (lub `Shift+E` / przycisk śmietnika do wyczyszczenia arkusza)
- **`[Ctrl+Z]`** – Cofnij ostatnią kreskę (`UNDO`)
- **`[N]`** – Następne zadanie (z płynną zmianą w OBS)
- **`[P]`** – Poprzednie zadanie
- **`[H]`** – Odkrycie kolejnego kroku / wskazówki rozwiązania
- **`[Spacja]`** – Start / Wstrzymanie stopera
- **`[T]`** – Przełączenie paska narzędzi na ekranie
- **`[F]`** – Tryb dopasowania do małego ekranu laptopa / 100% OBS

---

## 🛠️ Architektura Techniczna

- **React 18 + Vite 6 + TypeScript**: Błyskawiczny start i zerowe opóźnienia.
- **W3C Pointer Events API**: Obsługa siły nacisku piórka `e.pressure` (wzór: `baseWidth * (0.4 + pressure * 1.2)`) oraz wygładzanie krzywymi Beziera (`quadraticCurveTo`).
- **KaTeX (LaTeX)**: Ostry, wektorowy rendering równań, granic, ułamków i macierzy matematycznych w czasie rzeczywistym.
- **Express + Socket.io**: Dwukierunkowa replikacja stanu i kresek rysika pomiędzy widokiem tabletu, panelem reżysera i nakładką OBS.
- **HTML5 Canvas 60 FPS**: Tło w stylu cyfrowego deszczu Matrixa z symbolami matematycznymi (`∫`, `∑`, `√`, `π`, `∞`, `lim`).
- **Framer Motion**: Animowane wejścia kafelków, wskazówek oraz wyskakujących powiadomień studyjnych.

