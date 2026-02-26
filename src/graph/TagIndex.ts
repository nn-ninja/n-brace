export class TagIndex {
  private nodeToTags = new Map<string, Set<string>>();
  private tagToNodes = new Map<string, Set<string>>();

  addTags(nodePath: string, tags: string[]) {
    if (tags.length === 0) return;

    let nodeSet = this.nodeToTags.get(nodePath);
    if (!nodeSet) {
      nodeSet = new Set();
      this.nodeToTags.set(nodePath, nodeSet);
    }

    for (const tag of tags) {
      nodeSet.add(tag);

      let tagSet = this.tagToNodes.get(tag);
      if (!tagSet) {
        tagSet = new Set();
        this.tagToNodes.set(tag, tagSet);
      }
      tagSet.add(nodePath);
    }
  }

  getTagsForNode(nodePath: string): Set<string> {
    return this.nodeToTags.get(nodePath) ?? new Set();
  }

  getNodesForTag(tag: string): Set<string> {
    return this.tagToNodes.get(tag) ?? new Set();
  }

  has(nodePath: string): boolean {
    return this.nodeToTags.has(nodePath);
  }

  /**
   * Update a single tag for an already-indexed node.
   * No-op if the node hasn't been indexed yet (avoids storing partial data).
   */
  updateTag(nodePath: string, tag: string, add: boolean) {
    if (!this.nodeToTags.has(nodePath)) return;
    const nodeSet = this.nodeToTags.get(nodePath)!;
    if (add) {
      nodeSet.add(tag);
      let tagSet = this.tagToNodes.get(tag);
      if (!tagSet) {
        tagSet = new Set();
        this.tagToNodes.set(tag, tagSet);
      }
      tagSet.add(nodePath);
    } else {
      nodeSet.delete(tag);
      const tagSet = this.tagToNodes.get(tag);
      if (tagSet) {
        tagSet.delete(nodePath);
        if (tagSet.size === 0) this.tagToNodes.delete(tag);
      }
    }
  }

  clear() {
    this.nodeToTags.clear();
    this.tagToNodes.clear();
  }
}

export const tagIndex = new TagIndex();
