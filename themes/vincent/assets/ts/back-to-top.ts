/**
 * Back to top reveal, for browsers without scroll-driven animations
 *
 * Where animation-timeline is supported, the stylesheet fades the button in
 * from the scroll position and none of this runs. Elsewhere, this flags the
 * button once the first screenful has scrolled out of view, the same point
 * the stylesheet uses, and the stylesheet transitions it in.
 */

const backToTop = document.querySelector<HTMLElement>(".back-to-top");

if (backToTop !== null && !CSS.supports("animation-timeline: scroll()")) {
  track(backToTop);
}

function track(button: HTMLElement): void {
  let frame = 0;

  const check = () => {
    frame = 0;
    button.toggleAttribute("data-scrolled", window.scrollY >= window.innerHeight);
  };

  const schedule = () => {
    if (frame === 0) {
      frame = requestAnimationFrame(check);
    }
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  check();
}
