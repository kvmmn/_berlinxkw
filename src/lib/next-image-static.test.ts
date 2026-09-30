import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertStaticOptimizerWidthsAllowed,
  buildStaticOptimizedImageProps,
  GRID_OPTIMIZED_WIDTHS,
  nextImageOptimizerSrcSet,
  nextImageOptimizerUrl,
} from "./next-image-static";

describe("next-image-static", () => {
  const sample = "/api/shop/media?pathname=berlinxkw/tablos/x.jpg";

  it("uses only Next-default allowed optimizer widths in grid and detail srcsets", () => {
    assertStaticOptimizerWidthsAllowed();
    assert.deepEqual([...GRID_OPTIMIZED_WIDTHS], [384, 640, 750, 828, 1080]);
  });

  it("builds stable optimizer URLs", () => {
    assert.equal(
      nextImageOptimizerUrl(sample, 1080),
      `/_next/image?url=${encodeURIComponent(sample)}&w=1080&q=75`,
    );
  });

  it("builds deterministic srcset", () => {
    const a = nextImageOptimizerSrcSet(sample);
    const b = nextImageOptimizerSrcSet(sample);
    assert.equal(a, b);
    assert.match(a, /640w/);
    assert.match(a, /1920w/);
  });

  it("builds identical props on repeated calls", () => {
    const a = buildStaticOptimizedImageProps(sample, { priority: true });
    const b = buildStaticOptimizedImageProps(sample, { priority: true });
    assert.deepEqual(a, b);
    assert.equal(a.fetchPriority, "high");
    assert.equal(a.loading, "eager");
  });
});
