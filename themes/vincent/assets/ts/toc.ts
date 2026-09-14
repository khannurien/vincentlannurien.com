/**
 * Table of contents scrollspy
 *
 * The table of contents is generated, styled and collapsible without any
 * of this. All this adds is telling the reader where they are: the entry
 * for the section being read is marked, the entries it sits under with it,
 * and the panel's scroll area is nudged to keep that entry in view. It
 * also keeps the back to top button from ever sitting over the panel.
 *
 * Nothing here scrolls the page, and nothing here touches the URL.
 */

/** An entry in the list, and the heading it points at. */
interface Entry {
  link: HTMLAnchorElement;
  heading: HTMLElement;
  /** The entries this one is nested under, innermost first. */
  ancestors: HTMLAnchorElement[];
}

/**
 * How far down the viewport a heading has to travel before its section
 * counts as the one being read, as a fraction of the viewport height.
 */
const activeLine = 0.25;

/** Context kept around the active entry when scrolling it into view. */
const revealMargin = 24;

/**
 * Scroll offset past which the panel counts as scrolled, in pixels. Smooth
 * scrolling leaves fractional offsets behind, which a test against zero
 * would read as scrolled.
 */
const scrolledThreshold = 1;

/**
 * How close the back to top button may come to the panel, in pixels,
 * before it counts as being over it.
 */
const clearance = 8;

const toc = document.getElementById("toc");
const details = toc?.querySelector<HTMLDetailsElement>("details.toc") ?? null;
const scroll = toc?.querySelector<HTMLElement>(".toc-scroll") ?? null;
const body = toc?.querySelector<HTMLElement>(".toc-body") ?? null;
const backToTop = document.querySelector<HTMLElement>(".page-return");

if (toc !== null && details !== null && scroll !== null && body !== null) {
  start(toc, details, scroll, body);
}

if (toc !== null && details !== null && backToTop !== null) {
  keepClear(toc, details, backToTop);
}

/**
 * Hides the back to top button for as long as it would sit over the panel.
 *
 * The button is pinned to the viewport and the panel is not. Above the
 * article, the panel scrolls through the corner the button lives in. Out
 * in the gutter, it starts level with the article and hangs past the fold
 * until it has scrolled up to where it sticks. Neither is anything the
 * stylesheet can see, so the boxes are compared directly.
 *
 * The stylesheet keeps the button off pages with a panel until this has
 * run, so with scripting off it never covers the panel either.
 */
function keepClear(toc: HTMLElement, panel: HTMLElement, button: HTMLElement): void {
  let frame = 0;

  // Hiding the button leaves its box in place, so this never oscillates.
  const check = () => {
    frame = 0;
    button.toggleAttribute("data-over-toc", overlaps(panel, button, clearance));
  };

  const schedule = () => {
    if (frame === 0) {
      frame = requestAnimationFrame(check);
    }
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  panel.addEventListener("toggle", schedule);

  // Unhidden first: a button still set to display: none has no box to measure.
  toc.setAttribute("data-toc-clear", "");
  check();
}

/** Whether two boxes on screen overlap, or come within margin of it. */
function overlaps(a: Element, b: Element, margin: number): boolean {
  const first = a.getBoundingClientRect();
  const second = b.getBoundingClientRect();

  return (
    first.left < second.right + margin &&
    second.left < first.right + margin &&
    first.top < second.bottom + margin &&
    second.top < first.bottom + margin
  );
}

function start(
  toc: HTMLElement,
  details: HTMLDetailsElement,
  scroll: HTMLElement,
  body: HTMLElement,
): void {
  const entries = collect(toc);

  if (entries.length === 0) {
    return;
  }

  let frame = 0;
  let current = -1;

  const refresh = () => {
    const index = activeIndex(entries);

    if (index === current) {
      return;
    }

    current = index;
    mark(entries, index);

    // Scrolling a closed panel would be scrolling a box with no height.
    if (details.open) {
      reveal(body, entries[index].link);
    }
  };

  const schedule = () => {
    if (frame !== 0) {
      return;
    }

    frame = requestAnimationFrame(() => {
      frame = 0;
      refresh();
    });
  };

  /** For when the geometry moved but the active entry did not. */
  const rerun = () => {
    current = -1;
    schedule();
  };

  /*
   * The top fade has no padding to hide in, so it would dim the first
   * entry at rest. Flag the wrapper only once the list has been scrolled
   * and let the stylesheet fade it in; the nudge above scrolls the panel
   * itself, so its own scroll event covers that too.
   */
  const track = () => {
    if (body.scrollTop > scrolledThreshold) {
      scroll.setAttribute("data-toc-scrolled", "");
    } else {
      scroll.removeAttribute("data-toc-scrolled");
    }
  };

  body.addEventListener("scroll", track, { passive: true });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("resize", rerun);
  details.addEventListener("toggle", rerun);

  schedule();
  track();
}

/** Pairs every list entry with the heading it points at. */
function collect(toc: HTMLElement): Entry[] {
  const entries: Entry[] = [];

  for (const link of Array.from(toc.querySelectorAll<HTMLAnchorElement>("a.toc-link"))) {
    const heading = headingFor(link);

    if (heading === null) {
      continue;
    }

    entries.push({ link, heading, ancestors: ancestorsOf(link) });
  }

  return entries;
}

/** Resolves a list entry's fragment to the heading it names. */
function headingFor(link: HTMLAnchorElement): HTMLElement | null {
  const fragment = link.hash.slice(1);

  if (fragment === "") {
    return null;
  }

  // Hugo percent-encodes the fragment; the id attribute is not encoded.
  let id = fragment;

  try {
    id = decodeURIComponent(fragment);
  } catch {
    // A fragment that will not decode is still worth trying verbatim.
  }

  return document.getElementById(id) ?? document.getElementById(fragment);
}

/** Walks out through the enclosing list items, collecting their links. */
function ancestorsOf(link: HTMLAnchorElement): HTMLAnchorElement[] {
  const ancestors: HTMLAnchorElement[] = [];
  let item = link.closest("li");

  while (item !== null) {
    const parent: HTMLLIElement | null = item.parentElement?.closest("li") ?? null;

    if (parent !== null) {
      const parentLink = parent.querySelector<HTMLAnchorElement>(":scope > a.toc-link");

      if (parentLink !== null) {
        ancestors.push(parentLink);
      }
    }

    item = parent;
  }

  return ancestors;
}

/**
 * The last heading to have crossed the active line, which is the one whose
 * section the reader is in. A section longer than the viewport stays
 * current for as long as it is being scrolled through, which an
 * intersection test would not give.
 */
function activeIndex(entries: Entry[]): number {
  const root = document.documentElement;

  // The last section can be too short to ever reach the line.
  if (window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
    return entries.length - 1;
  }

  const line = window.innerHeight * activeLine;
  let index = 0;

  for (let position = 0; position < entries.length; position++) {
    if (entries[position].heading.getBoundingClientRect().top > line) {
      break;
    }

    index = position;
  }

  return index;
}

/** Marks one entry as current, and the entries it sits under as its path. */
function mark(entries: Entry[], index: number): void {
  for (const entry of entries) {
    entry.link.removeAttribute("aria-current");
    entry.link.classList.remove("toc-ancestor");
  }

  entries[index].link.setAttribute("aria-current", "location");

  for (const ancestor of entries[index].ancestors) {
    ancestor.classList.add("toc-ancestor");
  }
}

/**
 * Brings a link inside the scroll area, and only if it is outside it: the
 * panel is not dragged along on every scroll event.
 */
function reveal(body: HTMLElement, link: HTMLAnchorElement): void {
  const area = body.getBoundingClientRect();
  const entry = link.getBoundingClientRect();

  if (entry.top < area.top + revealMargin) {
    body.scrollTop -= area.top + revealMargin - entry.top;
  } else if (entry.bottom > area.bottom - revealMargin) {
    body.scrollTop += entry.bottom - (area.bottom - revealMargin);
  }
}
