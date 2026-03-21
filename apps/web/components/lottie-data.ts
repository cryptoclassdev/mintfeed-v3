/**
 * Inline Lottie animation data — avoids external file dependencies.
 * Mint color in 0-1 range: #00D4AA = [0, 0.831, 0.667]
 */

export const pulseRingAnimation = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 60,
  w: 24,
  h: 24,
  nm: "pulse-ring",
  ddd: 0,
  assets: [] as const,
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "ring",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [70], e: [0] },
            { t: 59, s: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [12, 12, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100], e: [280, 280, 100] },
            { t: 59, s: [280, 280, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "el" as const,
          d: 1,
          s: { a: 0, k: [8, 8] },
          p: { a: 0, k: [0, 0] },
          nm: "ellipse",
        },
        {
          ty: "st" as const,
          c: { a: 0, k: [0, 0.831, 0.667, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 1 },
          lc: 1,
          lj: 1,
          nm: "stroke",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "dot",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [12, 12, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "el" as const,
          d: 1,
          s: { a: 0, k: [5, 5] },
          p: { a: 0, k: [0, 0] },
          nm: "ellipse",
        },
        {
          ty: "fl" as const,
          c: { a: 0, k: [0, 0.831, 0.667, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: "fill",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

export const swipeHintAnimation = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 50,
  w: 40,
  h: 60,
  nm: "swipe-hint",
  ddd: 0,
  assets: [] as const,
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "chevron-1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 8, s: [55] },
            { t: 28, s: [55] },
            { t: 42, s: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [20, 44, 0], e: [20, 18, 0] },
            { t: 42, s: [20, 18, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr" as const,
          it: [
            {
              ind: 0,
              ty: "sh" as const,
              ks: {
                a: 0,
                k: {
                  c: false,
                  v: [
                    [-6, 4],
                    [0, -2],
                    [6, 4],
                  ],
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                },
              },
              nm: "path",
            },
            {
              ty: "st" as const,
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 1.5 },
              lc: 2,
              lj: 2,
              nm: "stroke",
            },
            {
              ty: "tr" as const,
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "transform",
            },
          ],
          nm: "group",
          bm: 0,
        },
      ],
      ip: 0,
      op: 50,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "chevron-2",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 5, s: [0] },
            { t: 13, s: [30] },
            { t: 33, s: [30] },
            { t: 47, s: [0] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 5, s: [20, 52, 0], e: [20, 28, 0] },
            { t: 47, s: [20, 28, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr" as const,
          it: [
            {
              ind: 0,
              ty: "sh" as const,
              ks: {
                a: 0,
                k: {
                  c: false,
                  v: [
                    [-6, 4],
                    [0, -2],
                    [6, 4],
                  ],
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                },
              },
              nm: "path",
            },
            {
              ty: "st" as const,
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 1.5 },
              lc: 2,
              lj: 2,
              nm: "stroke",
            },
            {
              ty: "tr" as const,
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "transform",
            },
          ],
          nm: "group",
          bm: 0,
        },
      ],
      ip: 0,
      op: 50,
      st: 0,
      bm: 0,
    },
  ],
};
