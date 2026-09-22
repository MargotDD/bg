import React, { useState } from 'react';
import { 
  X, Smartphone, Monitor, Download, Check, Copy, 
  ExternalLink, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isWindows, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'windows' | 'export'>(
    isAndroid ? 'android' : isWindows ? 'windows' : 'android'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-linear-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif">Download & Install</h2>
              <p className="text-xs text-rose-100 mt-0.5">
                Install Business Girls on your Android device or Windows desktop
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner if already installable or installed */}
        {isInstalled ? (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Application is currently running in standalone installed app mode!</span>
          </div>
        ) : isInstallable ? (
          <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-900 text-xs">
              <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Ready for 1-click installation on your system!</span>
            </div>
            <button
              onClick={install}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install Now
            </button>
          </div>
        ) : null}

        {/* Tab Navigation */}
        <div className="flex border-b border-rose-100 bg-rose-50/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'android'
                ? 'bg-white text-rose-700 shadow-xs border border-rose-200/60'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'windows'
                ? 'bg-white text-rose-700 shadow-xs border border-rose-200/60'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Monitor className="w-4 h-4 text-sky-600" />
            <span>Windows PC</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'export'
                ? 'bg-white text-rose-700 shadow-xs border border-rose-200/60'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Source / APK / EXE</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-stone-700">
          {activeTab === 'android' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Direct Android Installation (PWA / WebAPK)</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Installs like a native app directly to your home screen and app drawer with no Play Store required.
                  </p>
                </div>
              </div>

              {isInstallable && (
                <button
                  onClick={install}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install App on this Android Device
                </button>
              )}

              <div className="space-y-2.5 text-xs text-stone-600">
                <p className="font-bold text-stone-900">How to install on your Android phone or tablet:</p>
                <ol className="space-y-2 list-decimal list-inside pl-1 text-stone-700 leading-relaxed">
                  <li>
                    Open this URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.
                  </li>
                  <li>
                    Tap the <strong>three dots (⋮)</strong> at the top right of your browser.
                  </li>
                  <li>
                    Select <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
                  </li>
                  <li>
                    Confirm by tapping <strong>Install</strong>. Android will create an app launcher icon that runs fullscreen with offline support.
                  </li>
                </ol>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  App URL to open on Android:
                </label>
                <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-xs font-mono">
                  <span className="truncate flex-1">{currentUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 font-sans font-bold text-xs border border-stone-200 transition-colors shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-950">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Windows Desktop Application</h4>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    Pins to your Windows Taskbar and Start Menu. Runs in a clean, dedicated native window.
                  </p>
                </div>
              </div>

              {isInstallable && (
                <button
                  onClick={install}
                  className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install App on Windows
                </button>
              )}

              <div className="space-y-2.5 text-xs text-stone-600">
                <p className="font-bold text-stone-900">How to install on Windows 10 & 11:</p>
                <ol className="space-y-2 list-decimal list-inside pl-1 text-stone-700 leading-relaxed">
                  <li>
                    Open this app link in <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Brave</strong>.
                  </li>
                  <li>
                    Look at the right side of the address bar at the top: click the <strong>Install App icon (computer with down arrow)</strong>.
                  </li>
                  <li>
                    Or click the browser menu <strong>(⋯ or ⋮)</strong> → <strong>Apps</strong> → <strong>"Install Business Girls"</strong>.
                  </li>
                  <li>
                    Check <strong>"Pin to taskbar"</strong> and <strong>"Pin to Start"</strong> for instant desktop access.
                  </li>
                </ol>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  App URL to open on Windows PC:
                </label>
                <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 text-xs font-mono">
                  <span className="truncate flex-1">{currentUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 font-sans font-bold text-xs border border-stone-200 transition-colors shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  No Coding or Compiling Needed!
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  You do <strong>not</strong> need to compile any code. You have two easy ways to get a ready-made app:
                </p>
              </div>

              {/* Method A: Free Cloud Packaging (PWABuilder) */}
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-xs text-purple-950">
                      Method 1: Ready-Made APK & Windows App (Online)
                    </h5>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      Use Microsoft's free official <strong>PWABuilder</strong> to generate a ready Android APK or Windows package with zero coding:
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900 text-[10px] font-bold">
                    Automatic
                  </span>
                </div>

                <ol className="text-xs text-purple-900 space-y-1.5 list-decimal list-inside pl-1">
                  <li>Copy your app URL: <code className="bg-purple-100 px-1 py-0.5 rounded text-[11px] select-all font-mono font-bold">{currentUrl}</code></li>
                  <li>Go to <strong>PWABuilder.com</strong> (by Microsoft).</li>
                  <li>Paste the URL and click <strong>"Start"</strong>.</li>
                  <li>Click <strong>"Package for Android"</strong> to download a ready APK, or <strong>"Package for Windows"</strong>!</li>
                </ol>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open PWABuilder to Generate Ready File
                </a>
              </div>

              {/* Method B: Direct Browser Install (Fastest) */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2">
                <h5 className="font-bold text-xs text-emerald-950">
                  Method 2: Direct 1-Click Install (Even Easier!)
                </h5>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  You don't even need to download any APK or EXE file. On Android, simply open the URL in Chrome and tap <strong>"Install app"</strong>. On Windows, open in Chrome or Edge and click <strong>"Install"</strong> in the address bar. It creates the exact same native app on your home screen or desktop!
                </p>
              </div>

              {/* Method C: Project ZIP export */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 space-y-1.5">
                <h5 className="font-bold text-xs text-stone-900">
                  Method 3: Download Complete Source Code ZIP
                </h5>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  To download all files directly from Google AI Studio, click the three dots menu (top-right of this window) and choose <strong>"Download ZIP"</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-rose-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Powered by PWA & Google AI Studio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
