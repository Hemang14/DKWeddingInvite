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
    const CHAR_MS = 55;
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

    const GAP = 1800;   // pause between each reveal step (matches the 1.8s fade duration, so every stage fades at the same slower, even pace)
    const START = 300;  // small delay before anything moves, so the page isn't mid-paint

    let t = START;
    steps.forEach((group) => {
      setTimeout(() => reveal(group), t);
      t += GAP;
    });

    // the venue step (index 5, the 6th group) finishes revealing at this point;
    // start typing right after it fades in, then reveal the closing line once typing ends
    const venueRevealAt = START + GAP * 5;
    setTimeout(() => {
      typeVenue(() => {
        setTimeout(() => reveal([formal]), 500);
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
      setTimeout(() => envelope.remove(), reduceMotion ? 0 : 1200);
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
})();
