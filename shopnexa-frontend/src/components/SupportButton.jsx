import { useState, useCallback, useRef, useEffect } from "react";
import api from "../api/axios";

export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("support"); // 'support' | 'feedback'
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");
  const modalRef = useRef(null);
  const triggerButtonRef = useRef(null);
  const initialFocusRef = useRef(null); // subject input
  const prevActiveElementRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    // restore focus to the trigger for keyboard users
    const restoreTarget = triggerButtonRef.current || prevActiveElementRef.current;
    if (restoreTarget) {
      setTimeout(() => {
        try { restoreTarget.focus(); } catch(_) {}
      }, 0);
    }
    setTimeout(() => { setDone(""); }, 500);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    setLoading(true);
    setDone("");
    try {
      try {
        await api.post('/support/feedback', { subject, message, contact, type: mode });
        setDone(mode === 'feedback'
          ? 'sent feedback successfully!'
          : "sorry for the inconvenience! We'll reply shortly to your email");
      } catch (err) {
        const saved = JSON.parse(localStorage.getItem('quickSupport') || '[]');
        saved.push({ subject, message, contact, type: mode, created: new Date().toISOString() });
        localStorage.setItem('quickSupport', JSON.stringify(saved));
        setDone(mode === 'feedback'
          ? 'sent feedback successfully!'
          : "sorry for the inconvenience! We'll reply shortly to your email");
      }
      setSubject(''); setMessage(''); setContact('');
    } finally {
      setLoading(false);
      setTimeout(() => setDone(''), 2500);
    }
  };

  // Accessibility: focus trap + ESC handling
  useEffect(() => {
    if (!open) return;
    prevActiveElementRef.current = document.activeElement;
    // Focus the first input (subject) after opening
    if (initialFocusRef.current) {
      initialFocusRef.current.focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'Tab') {
        // Trap focus
        const container = modalRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="group w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-500 shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 10h8M8 14h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">Support & Feedback</span>
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay background */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          {/* modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="supportModalTitle"
            aria-describedby="supportModalDesc"
            tabIndex="-1"
            className="relative w-full max-w-md mx-auto rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 ring-1 ring-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.35)] p-6 text-white"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 id="supportModalTitle" className="text-lg font-semibold">{mode === 'support' ? 'Customer Support' : 'Feedback'}</h3>
              <button onClick={close} className="text-white/70 hover:text-white px-2 py-1 rounded">
                ✕
              </button>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center mb-4">
              <button
                onClick={() => setMode('support')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${mode==='support' ? 'bg-pink-500/60 text-white shadow' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>Customer Support</button>
              <div className="mx-2 h-6 w-px bg-white/20" />
              <button
                onClick={() => setMode('feedback')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${mode==='feedback' ? 'bg-pink-500/60 text-white shadow' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>Feedback</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input
                ref={initialFocusRef}
                value={subject}
                onChange={(e)=>setSubject(e.target.value)}
                placeholder={mode==='support' ? 'Issue summary' : 'Feedback subject'}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
              />
              <textarea
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                rows={5}
                placeholder={mode==='support' ? 'Describe your problem...' : 'Share your thoughts...'}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
              />
              <input
                value={contact}
                onChange={(e)=>setContact(e.target.value)}
                placeholder="Email or phone (optional)"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
              />
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !subject || !message}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-500 text-sm font-semibold shadow disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition"
                >{loading ? 'Sending…' : 'Send'}</button>
                {done && <div className="text-xs text-emerald-300">{done}</div>}
              </div>
            </form>
            <div id="supportModalDesc" className="mt-4 text-[10px] text-white/40">Press ESC or click outside to close.</div>
          </div>
        </div>
      )}
    </>
  );
}
