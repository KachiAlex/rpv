"use client";
import { Monitor, Smartphone, Download, ShieldCheck, WifiOff, MonitorPlay } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

const apps = [
  {
    title: 'Windows Desktop',
    description:
      'The full RPV Bible experience on your PC — built for projection. Works offline after the first launch, with projector display, remote control, and second-monitor support.',
    href: () => getApiUrl('/api/download/desktop'),
    filename: 'RPV-Bible-Setup.exe',
    meta: 'Windows 10/11 · ~157 MB',
    icon: Monitor,
    bullets: ['Offline after first launch', 'Projector + remote built in', 'External display support'],
  },
  {
    title: 'Android App',
    description:
      'Read, study, highlight, and control the projector from your phone. Install the APK directly — allow "install from unknown sources" when prompted.',
    href: () => getApiUrl('/api/download/android'),
    filename: 'rpvbible.apk',
    meta: 'Android 8+ · ~70 MB',
    icon: Smartphone,
    bullets: ['Offline reading', 'Verse highlights & notes', 'Projector remote'],
  },
];

export default function DownloadPage() {
  return (
    <div className="rpv-page-padding">
      <div className="rpv-hero">
        <div className="rpv-pill-row">
          <span className="rpv-pill rpv-pill-red">FREE</span>
          <span className="rpv-pill rpv-pill-navy">Get the Apps</span>
        </div>
        <h1 className="rpv-serif">Take RPV Bible everywhere.</h1>
        <p>
          Download the desktop app for projection-ready reading on Windows, or the Android app for
          study on the go. Both are free.
        </p>
      </div>

      <div className="rpv-strip">
        The desktop app works fully offline after one online launch — ideal for venues with
        unreliable internet.
      </div>

      <div className="rpv-grid2" style={{ alignItems: 'stretch' }}>
        {apps.map((app) => (
          <div key={app.title} className="rpv-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="rpv-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <app.icon size={16} /> {app.title.toUpperCase()}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 8px' }}>{app.title}</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--rpv-ink-soft)', flex: 1 }}>
              {app.description}
            </p>
            <ul style={{ margin: '12px 0', padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
              {app.bullets.map((b) => (
                <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <ShieldCheck size={14} style={{ color: 'var(--rpv-red, #b91c1c)', flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={app.href()}
              className="rpv-btn-red"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
              download={app.filename}
            >
              <Download size={15} />
              Download for {app.title.split(' ')[0]}
            </a>
            <p style={{ fontSize: '0.75rem', color: 'var(--rpv-ink-faint)', marginTop: 8, textAlign: 'center' }}>
              {app.filename} · {app.meta}
            </p>
          </div>
        ))}
      </div>

      <div className="rpv-card" style={{ marginTop: 20 }}>
        <div className="rpv-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MonitorPlay size={16} /> USING THE DESKTOP APP
        </div>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginTop: 8 }}>
          Install, then open it once while connected to the internet — the app downloads the Bible
          text it needs for offline use. After that it runs with no connection at all: read, project
          to a second screen (File → Open Projector Display), and drive it from the remote window.
          A phone on the same channel can remote-control the projector whenever internet is
          available.
        </p>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginTop: 8 }}>
          <WifiOff size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Offline tip: same-machine projection syncs instantly with no network. Phone-remote control
          and translation downloads need connectivity.
        </p>
      </div>
    </div>
  );
}
