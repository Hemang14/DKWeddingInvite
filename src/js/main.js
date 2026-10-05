const envelope = document.getElementById('envelope');
const card = document.getElementById('card');
const seal = document.getElementById('seal');
const audio = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');

const petals = document.getElementById('petals');
if (petals && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    const size = 4 + Math.random() * 4;
    p.style.left = Math.random() * 100 + '%';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.animationDuration = (7 + Math.random() * 7) + 's';
    p.style.animationDelay = -Math.random() * 12 + 's';
    p.style.opacity = 0.3 + Math.random() * 0.4;
    petals.appendChild(p);
  }
}

if (location.hash === '#open') {
  envelope.remove();
  card.setAttribute('aria-hidden', 'false');
  musicBtn.hidden = false;
}

let musicWanted = false;
let opened = false;

function openInvite() {
  if (opened) return;
  opened = true;
  musicWanted = true;
  envelope.classList.add('open');
  card.setAttribute('aria-hidden', 'false');
  musicBtn.hidden = false;
  audio.play().catch(() => {});
  setTimeout(() => envelope.remove(), 1200);
}

// the seal and the "Tap to open" text both open the invitation
seal.addEventListener('click', openInvite);
document.getElementById('env-hint').addEventListener('click', openInvite);

musicBtn.addEventListener('click', () => {
  if (audio.paused) {
    musicWanted = true;
    audio.play();
    musicBtn.classList.remove('paused');
  } else {
    musicWanted = false;
    audio.pause();
    musicBtn.classList.add('paused');
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    audio.pause();
  } else if (musicWanted) {
    audio.play().catch(() => {});
  }
});

const target = new Date('2026-12-12T11:00:00+05:30').getTime();
const cd = {
  d: document.getElementById('cd-d'),
  h: document.getElementById('cd-h'),
  m: document.getElementById('cd-m'),
  s: document.getElementById('cd-s')
};

function tick() {
  const diff = target - Date.now();
  if (diff <= 0) {
    cd.d.textContent = '00';
    cd.h.textContent = '00';
    cd.m.textContent = '00';
    cd.s.textContent = '00';
    return;
  }
  cd.d.textContent = String(Math.floor(diff / 864e5)).padStart(2, '0');
  cd.h.textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, '0');
  cd.m.textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, '0');
  cd.s.textContent = String(Math.floor(diff / 1e3) % 60).padStart(2, '0');
}
tick();
setInterval(tick, 1000);

document.querySelectorAll('section, footer').forEach(sec => {
  sec.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.setProperty('--reveal-delay', Math.min(i * 0.11, 0.66) + 's');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px 10% 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.getElementById('rsvp-form');
const thankyou = document.getElementById('thankyou');
const tyMsg = document.getElementById('ty-msg');

form.addEventListener('submit', () => {
  const attending = form.querySelector('input[name^="entry"][value^="Yes"]');
  const saidYes = attending && attending.checked;
  tyMsg.textContent = saidYes
    ? "From the bottom of our hearts, thank you for being part of our special day. Your love and warm wishes mean more than words can say. We can't wait to see you!"
    : "We'll miss having you with us, but we're so grateful for your love and blessings. You'll be in our hearts on our special day.";
  setTimeout(() => { thankyou.classList.add('show'); petalBurst(); }, 400);
});

document.getElementById('ty-close').addEventListener('click', () => {
  thankyou.classList.remove('show');
});

function petalBurst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let layer = thankyou.querySelector('.ty-burst');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ty-burst';
    thankyou.insertBefore(layer, thankyou.firstChild);
  }
  layer.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    const size = 6 + Math.random() * 9;
    p.style.left = Math.random() * 100 + '%';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    p.style.animationDuration = (2.6 + Math.random() * 2.6) + 's';
    p.style.animationDelay = Math.random() * 0.8 + 's';
    p.style.opacity = 0.5 + Math.random() * 0.5;
    layer.appendChild(p);
  }
}

const CAL = {
  haldi: ['Haldi — Dishakkshi & Kartikay', '20261211T043000Z', '20261211T070000Z'],
  sangeet: ['Sangeet — Dishakkshi & Kartikay', '20261211T133000Z', '20261211T173000Z'],
  wedding: ['Wedding — Dishakkshi & Kartikay', '20261212T053000Z', '20261212T083000Z'],
  reception: ['Reception — Dishakkshi & Kartikay', '20261212T133000Z', '20261212T173000Z']
};

function pad(n) { return String(n).padStart(2, '0'); }

function icsEvent(uid, title, start, end, allday) {
  const dt = allday
    ? `DTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}`
    : `DTSTART:${start}\r\nDTEND:${end}`;
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@kdwedding`,
    dt,
    `SUMMARY:${title}`,
    'LOCATION:IIDM Resort\, Lucknow',
    'END:VEVENT'
  ].join('\r\n');
}

function downloadICS(filename, events) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KD Wedding//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// iOS hands a downloaded .ics straight to Apple Calendar, so keep that path there.
// Chrome on Android just drops .ics files into Downloads with no auto-import, so for a single
// event we send Android guests straight to Google Calendar's own "add event" link instead —
// no download, no extra tap to find the file afterwards.
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

function googleCalUrl(title, start, end) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    location: 'IIDM Resort, Lucknow'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

document.querySelectorAll('.ev-cal').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.cal;

    // "Add all our dates" bundles four events in one file — Google's link only takes one event,
    // so this one always uses the .ics download on every platform.
    if (key === 'all') {
      const events = Object.entries(CAL).map(([k, v]) =>
        icsEvent(k, v[0], v[1], v[2], false));
      downloadICS('KD-Wedding.ics', events);
      return;
    }

    const v = CAL[key];
    if (isAndroid && !isIOS) {
      window.open(googleCalUrl(v[0], v[1], v[2]), '_blank', 'noopener');
    } else {
      downloadICS(key + '.ics', [icsEvent(key, v[0], v[1], v[2], false)]);
    }
  });
});

/* ---- Photo carousel: endless auto-scroll that the guest can also swipe / drag ---- */
(function () {
  const marquee = document.querySelector('.marquee');
  const track = marquee && marquee.querySelector('.marquee-track');
  if (!track) return;

  // three copies of the set: we keep the view in the middle copy and jump by one set width to loop
  const originals = Array.from(track.children);
  for (let i = 0; i < 2; i++) {
    originals.forEach(el => {
      const clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach(img => img.setAttribute('alt', ''));
      track.appendChild(clone);
    });
  }

  const SPEED = 33;        // px per second (same pace as before)
  const RESUME_AFTER = 5;  // ms after the last swipe/momentum before the drift picks up again
  const RAMP = 0.6;          // seconds to ease back up to full speed, so it feels like a continuation
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let setW = 0, pos = 0, lastSet = 0, lastUser = 0, last = 0, visible = true, dragging = false, touching = false, ramp = 1;

  function measure() {
    const first = originals[0];
    const nextSet = track.children[originals.length];
    setW = nextSet.offsetLeft - first.offsetLeft;
    marquee.scrollLeft = pos = lastSet = setW;
  }

  function wrap() {
    const x = marquee.scrollLeft;
    if (x < setW * 0.5) { marquee.scrollLeft = pos = lastSet = x + setW; }
    else if (x > setW * 1.5) { marquee.scrollLeft = pos = lastSet = x - setW; }
  }

  marquee.addEventListener('scroll', () => {
    if (Math.abs(marquee.scrollLeft - lastSet) > 1.5) lastUser = performance.now(); // the guest moved it
    wrap();
  }, { passive: true });

  ['touchmove', 'wheel'].forEach(ev =>
    marquee.addEventListener(ev, () => { lastUser = performance.now(); }, { passive: true }));
  marquee.addEventListener('touchstart', () => { touching = true; lastUser = performance.now(); }, { passive: true });
  ['touchend', 'touchcancel'].forEach(ev =>
    marquee.addEventListener(ev, () => { touching = false; lastUser = performance.now(); }, { passive: true }));

  // mouse drag for desktop
  let startX = 0, startLeft = 0;
  marquee.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    dragging = true; startX = e.clientX; startLeft = marquee.scrollLeft;
    marquee.classList.add('dragging'); marquee.setPointerCapture(e.pointerId);
  });
  marquee.addEventListener('pointermove', e => {
    if (!dragging) return;
    marquee.scrollLeft = startLeft - (e.clientX - startX);
    lastUser = performance.now();
  });
  const endDrag = () => { dragging = false; marquee.classList.remove('dragging'); lastUser = performance.now(); };
  marquee.addEventListener('pointerup', endDrag);
  marquee.addEventListener('pointercancel', endDrag);

  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(marquee);

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    if (visible && !reduceMotion) {
      if (dragging || touching || now - lastUser < RESUME_AFTER) {
        pos = marquee.scrollLeft;
        ramp = 0;
      } else {
        ramp = Math.min(1, ramp + dt / RAMP);
        pos += SPEED * ramp * ramp * (3 - 2 * ramp) * dt;
        marquee.scrollLeft = pos;
        lastSet = marquee.scrollLeft;
        wrap();
      }
    }
    requestAnimationFrame(tick);
  }

  const start = () => { measure(); requestAnimationFrame(t => { last = t; tick(t); }); };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  window.addEventListener('resize', () => { const frac = (marquee.scrollLeft - setW) / (setW || 1); measure(); marquee.scrollLeft = pos = lastSet = setW + frac * setW; });
})();
