import React, { useState, useEffect } from 'react';
import { Camera, PenTool, Sliders, Play, Copy, Check, Wifi, QrCode, Smartphone, Sparkles, Monitor } from 'lucide-react';

export const HubPage: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [wifiIp, setWifiIp] = useState<string>('192.168.1.116');

  const overlayUrl = `${window.location.origin}/overlay`;

  useEffect(() => {
    fetch('http://localhost:3001/api/network')
      .then(res => res.json())
      .then(data => {
        if (data.ips && data.ips.length > 0) {
          setWifiIp(data.ips[0]);
        }
      })
      .catch(() => {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          setWifiIp(window.location.hostname);
        }
      });
  }, []);

  const directorWifiUrl = `http://${wifiIp}:3000/director`;
  const presenterWifiUrl = `http://${wifiIp}:3000/presenter`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-between p-6 select-none">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full pt-6 pb-2 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>BROADCAST WEB ENGINE DLA YOUTUBE & OBS STUDIO</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          Studio Matematyczne{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-yellow-400">
            Huion & OBS
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
          System działa zarówno lokalnie na tym komputerze, jak i bezprzewodowo w Twojej sieci Wi-Fi na telefonie lub tablecie!
        </p>
      </div>

      {/* NEW: Wi-Fi Quick Connect Box with QR Code */}
      <div className="max-w-5xl mx-auto w-full glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/40 shadow-2xl my-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>DOSTĘP W SIECI WI-FI (TELEFON / TABLET)</span>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>Steruj nagraniem z telefonu lub pisz na tablecie</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Upewnij się, że telefon lub tablet jest połączony z <strong>tą samą siecią Wi-Fi</strong>. Wpisz ten adres w przeglądarce mobilnej (Safari / Chrome) lub zeskanuj kod QR obok:
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex items-center gap-2 bg-black/50 p-2 rounded-xl border border-white/10 max-w-md">
                <span className="text-amber-300 font-bold w-20">Reżyser:</span>
                <span className="text-white select-all flex-1">{directorWifiUrl}</span>
                <button
                  onClick={() => copyToClipboard(directorWifiUrl, 'director')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  {copiedUrl === 'director' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl === 'director' ? 'Skopiowano' : 'Kopiuj'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-black/50 p-2 rounded-xl border border-white/10 max-w-md">
                <span className="text-cyan-300 font-bold w-20">Rysik:</span>
                <span className="text-white select-all flex-1">{presenterWifiUrl}</span>
                <button
                  onClick={() => copyToClipboard(presenterWifiUrl, 'presenter')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  {copiedUrl === 'presenter' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl === 'presenter' ? 'Skopiowano' : 'Kopiuj'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center gap-2 bg-black/60 p-4 rounded-2xl border border-white/15 shadow-inner">
            <div className="w-[120px] h-[120px] bg-white p-1.5 rounded-xl flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(directorWifiUrl)}&bgcolor=ffffff&color=000000`}
                alt="Kod QR Panelu Reżysera"
                className="w-full h-full object-contain block"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zeskanuj aparatem</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main View Cards */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
        {/* Card 1: OBS Overlay */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                1920x1080 • OBS BROWSER
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Nakładka OBS</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Widok do dodania w OBS jako <strong>Browser Source</strong>. Posiada przezroczyste wycięcie na kamerkę i wielki arkusz do pisania.
              </p>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <a
              href="/overlay"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-glow-cyan"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Otwórz Nakładkę OBS</span>
            </a>

            <button
              onClick={() => copyToClipboard(overlayUrl, 'overlay')}
              className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-mono flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
            >
              {copiedUrl === 'overlay' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl === 'overlay' ? 'Skopiowano URL!' : 'Kopiuj URL do OBS'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Huion Tablet Presenter */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                TABLET HUION / IPAD
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Arkusz Rysika</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Widok z obsługą siły nacisku rysika Huion, kaligrafią Beziera i natychmiastową synchronizacją kresek z OBS.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <a
              href="/presenter"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-glow-gold"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Otwórz Arkusz Rysika</span>
            </a>
          </div>
        </div>

        {/* Card 3: Director Control Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                STEROWANIE NA ŻYWO
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Panel Reżysera</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Zdalne przełączanie zadań, wklejanie zdjęć zadań ze schowka (Ctrl+V) i czyszczenie tablicy bez dotykania OBS.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <a
              href="/director"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Otwórz Panel Reżysera</span>
            </a>
          </div>
        </div>
      </div>

      {/* OBS Studio Step-by-Step Instructions */}
      <div className="max-w-5xl mx-auto w-full glass-panel rounded-2xl p-5 border border-white/10 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Konfiguracja w OBS Studio:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-cyan-300">1. Dodaj Browser Source</div>
            <p className="text-slate-400">
              W OBS kliknij <strong>+</strong> &rarr; <strong>Przeglądarka (Browser)</strong> i wklej URL nakładki:
            </p>
            <div className="font-mono text-[10px] text-amber-300 bg-black/40 p-1 rounded mt-1 truncate">
              {overlayUrl}
            </div>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-cyan-300">2. Rozmiar i FPS</div>
            <p className="text-slate-400">
              Szerokość: <strong>1920</strong>, Wysokość: <strong>1080</strong>, FPS: <strong>60</strong>.
            </p>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-cyan-300">3. Warstwa kamerki</div>
            <p className="text-slate-400">
              Swoją fizyczną kamerę umieść w OBS <strong>jedną warstwę niżej pod nakładką</strong> – będzie idealnie widoczna przez przezroczyste wycięcie!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 pt-4">
        <span>Math Studio • Działa na Wi-Fi ({wifiIp}) i localhost</span>
      </footer>
    </div>
  );
};
