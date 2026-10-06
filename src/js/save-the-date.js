// Save the Date — single staged reveal, played once on load.
// Order: Ganesha motif -> "Save the Date" headline -> "for the wedding of" + rule ->
//        names -> date -> venue (typed out letter by letter) -> "Formal invitation to follow"

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  if (reduceMotion) {
    steps.forEach(reveal);
    reveal([formal]);
    if (typeTarget) typeTarget.textContent = venueText;
    return;
  }

  const GAP = 900;    // pause between each reveal step (matches the 0.9s fade duration, so every stage fades at the same even pace)
  const START = 300;  // small delay before anything moves, so the page isn't mid-paint

  let t = START;
  steps.forEach((group, idx) => {
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
})();
