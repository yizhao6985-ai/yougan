import type {
  SpotlightPlacementPreference,
  StudioOnboardingStep,
} from "@/lib/studio-onboarding";

export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type CardPlacement = {
  top: number;
  left: number;
};

const VIEWPORT_MARGIN = 16;
const SPOTLIGHT_GAP = 16;

function getViewportSize() {
  const visualViewport = window.visualViewport;
  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
    offsetTop: visualViewport?.offsetTop ?? 0,
    offsetLeft: visualViewport?.offsetLeft ?? 0,
  };
}

export function clampSpotlightRect(
  rect: Rect,
  margin = VIEWPORT_MARGIN,
): Rect | null {
  const viewport = getViewportSize();
  const viewportTop = viewport.offsetTop + margin;
  const viewportLeft = viewport.offsetLeft + margin;
  const viewportRight = viewport.offsetLeft + viewport.width - margin;
  const viewportBottom = viewport.offsetTop + viewport.height - margin;

  const top = Math.max(rect.top, viewportTop);
  const left = Math.max(rect.left, viewportLeft);
  const right = Math.min(rect.left + rect.width, viewportRight);
  const bottom = Math.min(rect.top + rect.height, viewportBottom);

  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) return null;

  return { top, left, width, height };
}

function rectsOverlap(a: Rect, b: Rect, gap = 0) {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  );
}

function clampPlacement(
  placement: CardPlacement,
  cardWidth: number,
  cardHeight: number,
) {
  const viewport = getViewportSize();
  const minTop = viewport.offsetTop + VIEWPORT_MARGIN;
  const minLeft = viewport.offsetLeft + VIEWPORT_MARGIN;
  const maxTop =
    viewport.offsetTop + viewport.height - cardHeight - VIEWPORT_MARGIN;
  const maxLeft =
    viewport.offsetLeft + viewport.width - cardWidth - VIEWPORT_MARGIN;

  return {
    top: Math.min(Math.max(minTop, placement.top), maxTop),
    left: Math.min(Math.max(minLeft, placement.left), maxLeft),
  };
}

function fitsViewport(
  placement: CardPlacement,
  cardWidth: number,
  cardHeight: number,
) {
  const viewport = getViewportSize();
  const minTop = viewport.offsetTop + VIEWPORT_MARGIN;
  const minLeft = viewport.offsetLeft + VIEWPORT_MARGIN;
  const maxTop = viewport.offsetTop + viewport.height - VIEWPORT_MARGIN;
  const maxLeft = viewport.offsetLeft + viewport.width - VIEWPORT_MARGIN;

  return (
    placement.top >= minTop &&
    placement.left >= minLeft &&
    placement.top + cardHeight <= maxTop &&
    placement.left + cardWidth <= maxLeft
  );
}

function buildCandidates(
  spotlight: Rect,
  cardWidth: number,
  cardHeight: number,
): CardPlacement[] {
  const alignLeft = spotlight.left;
  const alignRight = spotlight.left + spotlight.width - cardWidth;
  const alignCenter =
    spotlight.left + spotlight.width / 2 - cardWidth / 2;

  return [
    { top: spotlight.top + spotlight.height + SPOTLIGHT_GAP, left: alignLeft },
    {
      top: spotlight.top + spotlight.height + SPOTLIGHT_GAP,
      left: alignCenter,
    },
    {
      top: spotlight.top + spotlight.height + SPOTLIGHT_GAP,
      left: alignRight,
    },
    {
      top: spotlight.top - cardHeight - SPOTLIGHT_GAP,
      left: alignLeft,
    },
    {
      top: spotlight.top - cardHeight - SPOTLIGHT_GAP,
      left: alignCenter,
    },
    {
      top: spotlight.top - cardHeight - SPOTLIGHT_GAP,
      left: alignRight,
    },
    {
      top: spotlight.top,
      left: spotlight.left + spotlight.width + SPOTLIGHT_GAP,
    },
    {
      top: spotlight.top + spotlight.height / 2 - cardHeight / 2,
      left: spotlight.left + spotlight.width + SPOTLIGHT_GAP,
    },
    {
      top: spotlight.top,
      left: spotlight.left - cardWidth - SPOTLIGHT_GAP,
    },
    {
      top: spotlight.top + spotlight.height / 2 - cardHeight / 2,
      left: spotlight.left - cardWidth - SPOTLIGHT_GAP,
    },
  ];
}

function orderCandidates(
  candidates: CardPlacement[],
  preference?: SpotlightPlacementPreference,
) {
  if (!preference) return candidates;

  const score = (placement: CardPlacement) => {
    switch (preference) {
      case "top":
        return placement.top;
      case "bottom":
        return -placement.top;
      case "left":
        return placement.left;
      case "right":
        return -placement.left;
      default:
        return 0;
    }
  };

  return [...candidates].sort((a, b) => score(a) - score(b));
}

function farthestCornerPlacement(
  spotlight: Rect,
  cardWidth: number,
  cardHeight: number,
): CardPlacement {
  const viewport = getViewportSize();
  const minTop = viewport.offsetTop + VIEWPORT_MARGIN;
  const minLeft = viewport.offsetLeft + VIEWPORT_MARGIN;
  const spotlightCenter = {
    x: spotlight.left + spotlight.width / 2,
    y: spotlight.top + spotlight.height / 2,
  };

  const corners: CardPlacement[] = [
    { top: minTop, left: minLeft },
    {
      top: minTop,
      left: viewport.offsetLeft + viewport.width - cardWidth - VIEWPORT_MARGIN,
    },
    {
      top: viewport.offsetTop + viewport.height - cardHeight - VIEWPORT_MARGIN,
      left: minLeft,
    },
    {
      top: viewport.offsetTop + viewport.height - cardHeight - VIEWPORT_MARGIN,
      left: viewport.offsetLeft + viewport.width - cardWidth - VIEWPORT_MARGIN,
    },
  ];

  let best = corners[0]!;
  let bestDistance = -1;

  for (const corner of corners) {
    const cardCenter = {
      x: corner.left + cardWidth / 2,
      y: corner.top + cardHeight / 2,
    };
    const distance = Math.hypot(
      cardCenter.x - spotlightCenter.x,
      cardCenter.y - spotlightCenter.y,
    );

    const cardRect: Rect = {
      ...corner,
      width: cardWidth,
      height: cardHeight,
    };

    if (
      distance > bestDistance &&
      !rectsOverlap(cardRect, spotlight, SPOTLIGHT_GAP)
    ) {
      bestDistance = distance;
      best = corner;
    }
  }

  return best;
}

export function computeOnboardingCardPlacement(
  spotlight: Rect,
  cardWidth: number,
  cardHeight: number,
  step: Extract<StudioOnboardingStep, { kind: "spotlight" }>,
): CardPlacement {
  const candidates = orderCandidates(
    buildCandidates(spotlight, cardWidth, cardHeight),
    step.placementPreference,
  );

  for (const candidate of candidates) {
    const clamped = clampPlacement(candidate, cardWidth, cardHeight);
    const cardRect: Rect = {
      ...clamped,
      width: cardWidth,
      height: cardHeight,
    };

    if (
      !rectsOverlap(cardRect, spotlight, SPOTLIGHT_GAP) &&
      fitsViewport(clamped, cardWidth, cardHeight)
    ) {
      return clamped;
    }
  }

  for (const candidate of candidates) {
    const clamped = clampPlacement(candidate, cardWidth, cardHeight);
    const cardRect: Rect = {
      ...clamped,
      width: cardWidth,
      height: cardHeight,
    };

    if (!rectsOverlap(cardRect, spotlight, SPOTLIGHT_GAP)) {
      return clamped;
    }
  }

  return clampPlacement(
    farthestCornerPlacement(spotlight, cardWidth, cardHeight),
    cardWidth,
    cardHeight,
  );
}
