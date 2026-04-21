import {
  mapScrollPosition,
  findEnclosingAnchor,
  findLineAtOffset,
  buildAlignmentAnchors,
  type AlignmentAnchor,
} from "@/lib/scroll-sync";

describe("findLineAtOffset", () => {
  it("returns 0 for scrollTop=0", () => {
    const offsets = [0, 24, 48, 72];
    expect(findLineAtOffset(offsets, 0)).toBe(0);
  });

  it("returns last line for scrollTop beyond content", () => {
    const offsets = [0, 24, 48, 72];
    expect(findLineAtOffset(offsets, 1000)).toBe(3);
  });

  it("returns correct line for mid-content scroll", () => {
    const offsets = [0, 24, 48, 72];
    expect(findLineAtOffset(offsets, 30)).toBe(1);
  });

  it("returns 0 for empty offsets", () => {
    expect(findLineAtOffset([], 50)).toBe(0);
  });

  it("handles exact offset boundary", () => {
    const offsets = [0, 24, 48, 72];
    expect(findLineAtOffset(offsets, 48)).toBe(2);
  });
});

describe("findEnclosingAnchor", () => {
  const anchors: AlignmentAnchor[] = [
    { leftLine: 0, rightLine: 0 },
    { leftLine: 5, rightLine: 5 },
    { leftLine: 10, rightLine: 12 },
  ];

  it("finds correct anchor for left side", () => {
    const anchor = findEnclosingAnchor(anchors, "left", 7);
    expect(anchor.leftLine).toBe(5);
  });

  it("finds correct anchor for right side", () => {
    const anchor = findEnclosingAnchor(anchors, "right", 6);
    expect(anchor.rightLine).toBe(5);
  });

  it("returns first anchor for line 0", () => {
    const anchor = findEnclosingAnchor(anchors, "left", 0);
    expect(anchor.leftLine).toBe(0);
  });

  it("returns default for empty anchor list", () => {
    const anchor = findEnclosingAnchor([], "left", 5);
    expect(anchor).toEqual({ leftLine: 0, rightLine: 0 });
  });

  it("handles exact anchor boundary without off-by-one", () => {
    const anchor = findEnclosingAnchor(anchors, "left", 10);
    expect(anchor.leftLine).toBe(10);
    expect(anchor.rightLine).toBe(12);
  });
});

describe("mapScrollPosition", () => {
  it("returns same scrollTop when no diff (1:1 mapping)", () => {
    const anchors: AlignmentAnchor[] = [{ leftLine: 0, rightLine: 0 }];
    const offsets = [0, 24, 48, 72, 96];

    const result = mapScrollPosition(48, "left", anchors, offsets, offsets);
    expect(result).toBe(48);
  });

  it("maps left scroll to correct right position with insertion", () => {
    const anchors: AlignmentAnchor[] = [
      { leftLine: 0, rightLine: 0 },
      { leftLine: 3, rightLine: 5 },
    ];
    const leftOffsets = [0, 24, 48, 72, 96];
    const rightOffsets = [0, 24, 48, 72, 96, 120, 144];

    const result = mapScrollPosition(72, "left", anchors, leftOffsets, rightOffsets);
    expect(result).toBe(120);
  });

  it("returns input scrollTop for empty offset arrays", () => {
    const anchors: AlignmentAnchor[] = [{ leftLine: 0, rightLine: 0 }];
    const result = mapScrollPosition(50, "left", anchors, [], []);
    expect(result).toBe(50);
  });

  it("handles variable line heights (non-uniform spacing)", () => {
    const anchors: AlignmentAnchor[] = [{ leftLine: 0, rightLine: 0 }];
    const leftOffsets = [0, 30, 80, 100];
    const rightOffsets = [0, 20, 50, 90];

    const result = mapScrollPosition(80, "left", anchors, leftOffsets, rightOffsets);
    expect(result).toBe(50);
  });

  it("handles empty anchor list by returning input unchanged", () => {
    const offsets = [0, 24, 48];
    const result = mapScrollPosition(24, "left", [], offsets, offsets);
    expect(result).toBe(24);
  });
});

describe("buildAlignmentAnchors", () => {
  it("returns initial anchor for empty chunks", () => {
    const anchors = buildAlignmentAnchors([]);
    expect(anchors).toEqual([{ leftLine: 0, rightLine: 0 }]);
  });

  it("produces anchors from chunks", () => {
    const chunks = [
      {
        leftLineStart: 2,
        leftLineCount: 1,
        rightLineStart: 2,
        rightLineCount: 2,
        segments: [],
      },
    ];
    const anchors = buildAlignmentAnchors(chunks);
    expect(anchors.length).toBeGreaterThan(1);
  });
});
