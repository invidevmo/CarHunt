# 🚗💨 CarHunt GPS – Samochodowy Chowany w Czasie Rzeczywistym

<div align="center">

[![Author](https://img.shields.io/badge/Autor-Wiktor_%22Kehoyooon%22_Augustyniak-f59e0b?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kehoyooon)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Status](https://img.shields.io/badge/Status-Produkcyjny-cyan?style=for-the-badge)](#)

<p align="center">
  <strong>Zaawansowana platforma telematyczna do miejskiego pościgu i zabawy w samochodowego chowanego z wykorzystaniem GPS, WebSockets, skanerów kodów QR i dynamicznych stref rozgrywki.</strong>
</p>

</div>

---

## 👤 Twórca i Autor Projektu

* **Autor:** **Wiktor "Kehoyooon" Augustyniak**
* **GitHub:** [@Kehoyooon](https://github.com/Kehoyooon)
* **Koncepcja:** Zespołowa gra miejska nowej generacji łącząca pasję motoryzacyjną, telematykę na żywo oraz taktyczną rywalizację załóg samochodowych.

---

## 🌟 Główne Funkcje Platformy

### 1. 🎯 Dynamiczne Tryby Gry (Strefa Rozgrywki & Battle Royale)
* **Tryb Stały (Static Zone):** Kapitan pokoju wyznacza na mapie promień operacyjny (od 1.0 km do 10 km). Opuszczenie strefy przez auto uruchamia odliczanie karencji (15s–60s) – brak powrotu na czas skutkuje natychmiastowym ujawnieniem dokładnej lokalizacji pojazdu wszystkim łowcom!
* **Tryb Dynamiczny / Battle Royale (Moving Zone):** Podwójna strefa! Duży okrąg określa granice terenu (np. 6 km), a mniejszy okrąg (np. 1.8 km) stanowi aktywny obszar dla samochodów. Co określony czas (np. co 3 lub 4 minuty) strefa losowo przemieszcza się, dając załogom czas na przejazd. Samochody, które nie zdążą wjechać do nowej strefy, zostają zdemaskowane!

### 2. 📷 Niezawodny Skaner Kodów QR + Awaryjny PIN
* Każde uciekające auto posiada unikalny, generowany kryptograficznie token QR oraz 4-cyfrowy awaryjny kod PIN.
* Uciekinier kładzie telefon z kodem QR za przednią szybą lub na desce rozdzielczej.
* Łowca po dojechaniu do auta skanuje kod wbudowanym aparatem lub wpisuje PIN w przypadku mocno przyciemnionych szyb.
* Moduł skanera jest w 100% odporny na błędy renderowania przeglądarek mobilnych (iOS Safari / WebKit / Android Chrome).

### 3. 🔄 Płynne Odzyskiwanie Sesji (Session Persistence)
* Przypadkowe odświeżenie strony na telefonie, chwilowy spadek zasięgu LTE lub przełączenie aplikacji nie wyrzuca gracza z pokoju!
* Serwer utrzymuje 120-sekundowy bufor ochronny (grace period), a klient automatycznie przywraca rolę, stan pojazdu i pozycję po ponownym połączeniu.

### 4. 🛰️ Zaawansowany Filtr GPS (Anti-Jitter & Drift Filter)
* Algorytm eliminacji szumów satelitarnych dedykowany do telematyki samochodowej:
  * **Deadband 7m:** Skasowanie "pływania" i skakania pozycji zaparkowanego lub stojącego na światłach auta.
  * **Blokada obrotu kompasu:** Stabilizacja kąta natarcia pojazdu – ikona nie kręci się w miejscu.
  * **Odrzucanie anomalii prędkości:** Filtrowanie nagłych przeskoków GPS i fałszywych prędkości.

### 5. 🪟 Tryb Taktyczny HUD (Projekcja na Przednią Szybę)
* Pełnoekranowy tryb HUD o wysokim kontraście.
* Funkcja **odbicia lustrzanego (Mirror Mode)** – po położeniu telefonu pod przednią szybą w nocy, ekran odbija się na szkle jak profesjonalny wyświetlacz HUD w autach sportowych.
* Cyfrowy prędkościomierz, telemetryczny odczyt odległości do celu w metrach oraz kompas kierunkowy.

### 6. 🚘 Personalizacja Pojazdów i Polskie Tablice Rejestracyjne
* Wybór marki i modelu pojazdu (np. `BMW E46`, `Audi A4`, `VW Golf`).
* Paleta kolorów z miniaturowymi wskaźnikami na markerach mapy.
* Realistycznie renderowane europejskie tablice rejestracyjne z wyróżnikiem kraju **PL** (np. `[KR 12345]`).

### 7. 🗺️ Darmowa Infrastruktura Mapowa (Zero Opłat API)
* Zintegrowane szybkie kafelki bez limitów zapytań:
  * **Tryb Ciemny (Tactical Cyber OSM)** – wysoki kontrast i czytelność w nocy dzięki filtrowi cyfrowemu.
  * **Tryb Satelitarny (Esri World Imagery)** – widok rzeczywistych parkingów, uliczek i zaułków.
  * **Tryb Dzienny (OpenStreetMap Standard)** – jasny motyw drogowy.

---

## 🎮 Zasady i Przebieg Rozgrywki ("Radar & Scout")

1. **Podział na Role:**
   * 🚗 **Uciekinierzy (Hiders):** Samochody mające za zadanie dotrzeć do legalnego miejsca postojowego w strefie i pozostać niezauważonymi.
   * 🚓 **Łowcy (Seekers):** Załogi polujące na uciekające auta.
   * ⚠️ **Zasada Bezpieczeństwa:** Aplikację w każdym samochodzie obsługuje **pilot / pasażer**. Kierowca skupia się w 100% na drodze i przepisach ruchu drogowego.

2. **Faza 1 – Ukrywanie:**
   * Uciekinierzy mają wyznaczony czas (np. 3 minuty) na zajęcie kryjówek.
   * Ich pozycje są w tym czasie całkowicie niewidoczne dla łowców.

3. **Faza 2 – Polowanie i Radar:**
   * Łowcy ruszają w teren.
   * Dokładne koordynaty uciekinierów są ukryte. Zamiast tego serwer co 90 sekund generuje **Radar Ping** – rozmyty okrąg poszukiwań o promieniu ~200 m wokół uciekiniera.

4. **Faza 3 – Schwytanie:**
   * Łowca, który zlokalizuje auto uciekiniera, podbiega/podjeżdża i aparatem telefonu skanuje kod QR znajdujący się za szybą pojazdu.
   * Zeskanowanie natychmiast rejestruje eliminację i aktualizuje stan gry w czasie rzeczywistym.

---

## 🚀 Instrukcja Uruchomienia

### Wymagania:
* Node.js w wersji **18.x** lub **20.x**
* Menedżer pakietów `npm`

### 1. Klonowanie repozytorium:
```bash
git clone https://github.com/Kehoyooon/carhunt-gps.git
cd carhunt-gps
```

### 2. Instalacja zależności:
```bash
npm run build
```

### 3. Start Aplikacji:
```bash
npm start
```
Serwer uruchomi się domyślnie na porcie **3001**:
* Interfejs lokalny: `http://localhost:3001`
* Wersja HTTPS (do testów lokalnych): `https://localhost:3443`

---

## 📱 Dostęp Mobilny na Smartfonach

Nowoczesne smartfony wymagają bezpiecznego połączenia **HTTPS**, aby udostępnić moduł geolokalizacji GPS oraz aparat fotograficzny.

### Opcja A: Dostęp przez darmowy tunel Cloudflare (Zalecane na zloty i testy w terenie)
```bash
cloudflared tunnel --url http://localhost:3001
```
Otrzymasz publiczny adres HTTPS (np. `https://twoj-tunel.trycloudflare.com`), który każdy ze znajomych może otworzyć bezpośrednio na telefonie w sieci 4G/5G!

### Opcja B: Wdrożenie na Render.com (Stały publiczny serwer w chmurze)
1. Wrzuć projekt na GitHub do własnego repozytorium.
2. Zaloguj się na [Render.com](https://render.com) i kliknij **New Web Service**.
3. Połącz repozytorium i ustaw parametry:
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
4. Gotowe! Otrzymujesz bezpłatny adres w domenie `.onrender.com` z automatycznym certyfikatem SSL.

---

## 🧪 Tryb Symulatora GPS (Testowanie bez wychodzenia z domu)

W prawym górnym rogu ekranu znajduje się przełącznik **`🧪 Symulator GPS`**:
* Pozwala na testowanie gry z poziomu przeglądarki na komputerze.
* Po włączeniu wystarczy **kliknąć w dowolne miejsce na mapie**, aby natychmiast "przejechać" tam samochodem z symulowaną prędkością.
* Możesz otworzyć jedno okno jako Uciekinier, drugie w trybie incognito jako Łowca i przetestować mechaniki radaru, stref i skanowania QR.

---

## 🏗️ Struktura Projektu

```text
carhunt-gps/
├── client/                     # Frontend aplikacji (Vite + React 19)
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameOverModal.jsx       # Ekran triumfu, konfetti i odsłonięcia kryjówek
│   │   │   ├── GameView.jsx            # Główny panel gry, radaru i telemetrii
│   │   │   ├── HiderQrModal.jsx        # Karta QR uciekiniera do powieszenia za szybą
│   │   │   ├── HudModeOverlay.jsx      # Tryb taktyczny HUD z odbiciem na szybę
│   │   │   ├── LicensePlate.jsx        # Renderowanie polskich tablic rejestracyjnych
│   │   │   ├── LobbyView.jsx           # Poczekalnia, garaż, dobór ról i parametry pokoju
│   │   │   ├── MapComponent.jsx        # Interaktywna mapa Leaflet z warstwami i autami
│   │   │   ├── SeekerScannerModal.jsx  # Crash-proof skaner kodów QR i manualny PIN
│   │   │   └── ZoneConfigModal.jsx     # Konfiguracja strefy stałej oraz dynamicznej
│   │   ├── hooks/
│   │   │   └── useGeolocation.js       # Hook GPS ze stabilizacją pozycji
│   │   ├── utils/
│   │   │   ├── audio.js                # Syntezator dźwięków (Web Audio API)
│   │   │   ├── carColors.js            # Palety barw pojazdów
│   │   │   ├── gpsFilter.js            # Cyfrowy filtr szumów i wektora ruchu
│   │   │   ├── proximity.js            # Algorytmy dystansu Haversine i namiaru kompasu
│   │   │   └── session.js              # Magazyn sesji i ochrona przed odświeżeniem
│   │   └── App.jsx                     # Główny stan aplikacji i routing widoków
├── server/                     # Backend aplikacji (Node.js + Express + Socket.io)
│   └── src/
│       ├── utils/
│       │   └── geo.js                  # Matematyka geodezyjna i rozmywanie pingu radaru
│       ├── gameManager.js              # Silnik reguł gry, stref, timerów i ról
│       └── index.js                    # Serwer HTTP/HTTPS i obsługa socketów
├── .github/
│   └── workflows/
│       └── ci.yml                      # Automatyczny pipeline CI (Oxlint + Build)
└── README.md                   # Główna dokumentacja projektu
```

---

## 📜 Licencja

Projekt udostępniony na licencji **MIT**. Zezwala się na wykorzystanie, modyfikowanie oraz rozpowszechnianie kodu z zachowaniem informacji o autorze.

<div align="center">
  <sub>Stworzone z pasją do motoryzacji i technologii przez <strong>Wiktor "Kehoyooon" Augustyniak</strong> © 2026</sub>
</div>
