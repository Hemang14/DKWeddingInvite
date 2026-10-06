// Save the Date — envelope opens first, then a single staged reveal plays once.
// Reveal order: Ganesha motif -> "Circle the Day" headline -> "for the wedding of" + rule ->
//               names -> date (typed out letter by letter) -> venue (typed out letter by letter) ->
//               "Formal invitation to follow"

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
  const dateEl = document.getElementById('std-date-cal');
  const dateTypeTarget = dateEl ? dateEl.querySelector('.std-type-text') : null;
  const dateText = dateEl ? (dateEl.dataset.text || '') : '';
  const venue = document.getElementById('std-venue');
  const typeTarget = venue ? venue.querySelector('.std-type-text') : null;
  const venueText = venue ? (venue.dataset.text || '') : '';

  function reveal(nodes) {
    nodes.forEach(el => el.classList.add('std-in'));
  }

  // generic letter-by-letter typewriter, used for both the date and the venue line
  function typeInto(el, target, text, onDone) {
    if (!el || !target) { if (onDone) onDone(); return; }
    el.classList.add('std-typing');
    let i = 0;
    const CHAR_MS = 45;
    (function tick() {
      if (i <= text.length) {
        target.textContent = text.slice(0, i);
        i++;
        setTimeout(tick, CHAR_MS);
      } else {
        el.classList.remove('std-typing');
        if (onDone) onDone();
      }
    })();
  }

  // runs a list of (next) => {...} steps one after another, each calling next() when it's done
  function chain(fns) {
    let i = 0;
    (function step() {
      if (i < fns.length) fns[i++](step);
    })();
  }

  function startReveal() {
    if (reduceMotion) {
      steps.forEach(reveal);
      reveal([formal]);
      if (dateTypeTarget) dateTypeTarget.textContent = dateText;
      if (typeTarget) typeTarget.textContent = venueText;
      return;
    }

    const START = 150;      // small delay before anything moves, so the page isn't mid-paint
    const HEADLINE_GAP = 450; // motif -> headline is quick, so "Circle the Day" lands fast
    const STEP_GAP = 1500;    // the rest keep the slower, even pace
    const TYPE_PAUSE = 150;   // pause between a line's container fading in and it starting to type
    const POST_TYPE_PAUSE = 400; // pause after a line finishes typing before the next thing appears

    // steps[0..3] = motif, headline, "for the wedding of" + rule, names
    // steps[4] = small rule + date shell, steps[5] = small rule + venue shell
    chain([
      next => setTimeout(() => { reveal(steps[0]); next(); }, START),
      next => setTimeout(() => { reveal(steps[1]); next(); }, HEADLINE_GAP),
      next => setTimeout(() => { reveal(steps[2]); next(); }, STEP_GAP),
      next => setTimeout(() => { reveal(steps[3]); next(); }, STEP_GAP),
      next => setTimeout(() => { reveal(steps[4]); next(); }, STEP_GAP),
      next => setTimeout(() => typeInto(dateEl, dateTypeTarget, dateText, next), TYPE_PAUSE),
      next => setTimeout(() => { reveal(steps[5]); next(); }, POST_TYPE_PAUSE),
      next => setTimeout(() => typeInto(venue, typeTarget, venueText, next), TYPE_PAUSE),
      () => setTimeout(() => reveal([formal]), POST_TYPE_PAUSE)
    ]);
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
