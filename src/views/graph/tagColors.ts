const TAG_PALETTE = [
  "#471e8f",
  "#035b82",
  "#7a298f",
  "#e91e90", // Magenta
  "#7b8a8e", // Metallic
  "#2d8659", // Rainforest
  "#d4900a", // Amber
  "#2563eb", // Sapphire
];

const TAG_COLOR_FALLBACK = "#9e9e9e";

/**
 * Builds the display color map. `stableAssignment` is mutated in place to
 * preserve palette colors for tags that remain in the top-N across renders.
 * Tags that drop out of the top-N lose their slot; new entrants get the next
 * available palette color.
 */
export function buildTagColorMap(
  sortedTags: [string, number][],
  stableAssignment: Map<string, string>,
): Map<string, string> {
  const N = TAG_PALETTE.length;
  const topNSet = new Set(sortedTags.slice(0, N).map(([tag]) => tag));

  // Evict tags no longer in top-N
  for (const tag of [...stableAssignment.keys()]) {
    if (!topNSet.has(tag)) stableAssignment.delete(tag);
  }

  // Assign palette colors to new top-N entrants
  const usedColors = new Set(stableAssignment.values());
  let pi = 0;
  for (const tag of topNSet) {
    if (!stableAssignment.has(tag)) {
      while (pi < TAG_PALETTE.length && usedColors.has(TAG_PALETTE[pi]!)) pi++;
      if (pi < TAG_PALETTE.length) {
        stableAssignment.set(tag, TAG_PALETTE[pi]!);
        usedColors.add(TAG_PALETTE[pi]!);
        pi++;
      }
    }
  }

  // Build display map: top-N get stable color, rest get fallback
  const map = new Map<string, string>();
  for (const [tag] of sortedTags) {
    map.set(tag, stableAssignment.get(tag) ?? TAG_COLOR_FALLBACK);
  }
  return map;
}
