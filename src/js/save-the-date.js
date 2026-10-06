// Save the Date — envelope opens first, then a single staged reveal plays once.
// Reveal order: Ganesha motif -> "Save the Date" headline -> "for the wedding of" + rule ->
//               names -> date -> venue (typed out letter by letter) -> "Formal invitation to follow"

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const envelope = document.getElementById('envelope');
  const card = document.getElementById('card');
  const seal = document.getElementById('seal');
  const envHint = document.getElementById('env-hint');

  const steps = [1, 2, 3, 4, 5, 6].map(n =>
    Array.from(document.querySelectorAll('.std-seq-' + n))
  );
  const formal = document.querySelector('.std-formal');
  const venue = document.getElementById('std-venue');
  const typeTarget = venue ? venue.querySelector('.std-type-text') : null;
  const venueText = venue ? (venue.dataset.text || '') : '';

  function reveal(nodes) {
    nodes.forEach(el => el.classList.add('std-in'));
  }

  function typeVenue(onDone) {
    if (!venue || !typeTarget) { onDone(); return; }
    venue.classList.add('std-typing');
    let i = 0;
    const CHAR_MS = 45;
    (function tick() {
      if (i <= venueText.length) {
        typeTarget.textContent = venueText.slice(0, i);
        i++;
        setTimeout(tick, CHAR_MS);
      } else {
        venue.classList.remove('std-typing');
        onDone();
      }
    })();
  }

  function startReveal() {
    if (reduceMotion) {
      steps.forEach(reveal);
      reveal([formal]);
      if (typeTarget) typeTarget.textContent = venueText;
      return;
    }

    const START = 150;  // small delay before anything moves, so the page isn't mid-paint
    // gap AFTER each step (motif -> headline is quick, so "Circle the Day" lands fast;
    // the rest keep the slower, even pace)
    const GAPS = [450, 1500, 1500, 1500, 1500];

    let t = START;
    steps.forEach((group, i) => {
      setTimeout(() => reveal(group), t);
      if (i < GAPS.length) t += GAPS[i];
    });

    // t now equals the time the venue step (the last group) reveals;
    // start typing right after it fades in, then reveal the closing line once typing ends
    const venueRevealAt = t;
    setTimeout(() => {
      typeVenue(() => {
        setTimeout(() => reveal([formal]), 400);
      });
    }, venueRevealAt + 150);
  }

  // skipping straight to the card (e.g. a shared #open link) bypasses the envelope entirely
  if (location.hash === '#open' && envelope) {
    envelope.remove();
    if (card) card.setAttribute('aria-hidden', 'false');
    startReveal();
    return;
  }

  let opened = false;
  function openEnvelope() {
    if (opened) return;
    opened = true;
    if (card) card.setAttribute('aria-hidden', 'false');
    startReveal();
    if (envelope) {
      envelope.classList.add('open');
      setTimeout(() => envelope.remove(), reduceMotion ? 0 : 900);
    }
  }

  if (seal) seal.addEventListener('click', openEnvelope);
  if (envHint) envHint.addEventListener('click', openEnvelope);

  // no envelope markup on the page (e.g. an older cached copy) — just play the reveal
  if (!envelope) startReveal();

  // ---------- RSVP ----------

  const form = document.getElementById('rsvp-form');
  const thankyou = document.getElementById('std-thankyou');
  const tyMsg = document.getElementById('std-ty-msg');
  const tyClose = document.getElementById('std-ty-close');

  if (form && thankyou) {
    form.addEventListener('submit', () => {
      const attending = form.querySelector('input[name^="entry"][value^="Yes"]');
      const saidYes = attending && attending.checked;
      if (tyMsg) {
        tyMsg.textContent = saidYes
          ? "We are grateful to have our family and loved ones by our side as we celebrate this beautiful occasion. Your presence, blessings and warm wishes mean the world to us."
          : "We'll miss having you with us, but we're so grateful for your love and blessings. You'll be in our hearts on our special day.";
      }
      setTimeout(() => {
        form.classList.add('std-hidden');
        thankyou.classList.add('show');
      }, 400);
    });
  }

  if (tyClose && form && thankyou) {
    tyClose.addEventListener('click', () => {
      thankyou.classList.remove('show');
      form.classList.remove('std-hidden');
      form.reset();
    });
  }

  // ---------- Add to calendar ----------
  // Only the date and venue are confirmed at this stage (times follow with the formal
  // invitation), so this is a single all-day event spanning both wedding dates.

  const tyCal = document.getElementById('std-ty-cal');

  function icsEvent(uid, title, startDate, endDate) {
    return [
      'BEGIN:VEVENT',
      `UID:${uid}@dkwedding`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${title}`,
      'LOCATION:IIDM Resort\\, Lucknow',
      'END:VEVENT'
    ].join('\r\n');
  }

  function downloadICS(filename, events) {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DK Wedding//EN',
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

  function googleCalUrl(title, startDate, endDate) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startDate}/${endDate}`,
      location: 'IIDM Resort, Lucknow'
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // iOS hands a downloaded .ics straight to Apple Calendar, so keep that path there.
  // Chrome on Android just drops .ics files into Downloads with no auto-import, so send
  // Android guests straight to Google Calendar's own "add event" link instead.
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const calTitle = "Dishakkshi & Kartikay's Wedding";
  const calStart = '20261211';
  const calEnd = '20261213'; // exclusive end date, so the event spans the 11th and 12th

  function addToCalendar() {
    if (isAndroid && !isIOS) {
      window.open(googleCalUrl(calTitle, calStart, calEnd), '_blank', 'noopener');
    } else {
      downloadICS('DK-Save-the-Date.ics', [icsEvent('savethedate', calTitle, calStart, calEnd)]);
    }
  }

  if (tyCal) tyCal.addEventListener('click', addToCalendar);

  // tapping the date on the main card adds it to the calendar the same way
  const dateCal = document.getElementById('std-date-cal');
  if (dateCal) dateCal.addEventListener('click', addToCalendar);

  // ---------- Countdown (on the thank-you page) ----------

  const cdTarget = new Date('2026-12-12T11:00:00+05:30').getTime();
  const cd = {
    d: document.getElementById('std-cd-d'),
    h: document.getElementById('std-cd-h'),
    m: document.getElementById('std-cd-m'),
    s: document.getElementById('std-cd-s')
  };

  if (cd.d && cd.h && cd.m && cd.s) {
    const tickCountdown = () => {
      const diff = cdTarget - Date.now();
      if (diff <= 0) {
        cd.d.textContent = '00'; cd.h.textContent = '00';
        cd.m.textContent = '00'; cd.s.textContent = '00';
        return;
      }
      cd.d.textContent = String(Math.floor(diff / 864e5)).padStart(2, '0');
      cd.h.textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, '0');
      cd.m.textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, '0');
      cd.s.textContent = String(Math.floor(diff / 1e3) % 60).padStart(2, '0');
    };
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  // ---------- Guest count: 0 allowed only when declining ----------

  const countInput = document.getElementById('f-count');
  const attendRadios = form ? form.querySelectorAll('input[name="entry.707843021"]') : [];

  attendRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (!countInput || !radio.checked) return;
      const declining = radio.value.startsWith("Sadly");
      if (declining) {
        countInput.min = '0';
        countInput.value = '0';
      } else {
        countInput.min = '1';
        if (Number(countInput.value) < 1) countInput.value = '1';
      }
    });
  });
})();
