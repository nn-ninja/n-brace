import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { TFile } from "obsidian";
import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Link } from "@/graph/Link";
import type { Node } from "@/graph/Node";

import { AppContext } from "@/context";
import { tagIndex } from "@/graph/TagIndex";

export const UNTAGGED = "\0untagged";

interface TagListProps {
  nodes: Node[];
  links: Link[];
  selectedNodePath?: string;
  uncheckedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  onSetUncheckedTags: (tags: Set<string>) => void;
  tagColorMap: Map<string, string>;
  tagColorMode: "edges" | "nodes";
  onSetTagColorMode: (mode: "edges" | "nodes") => void;
  search: string;
  onSearchChange: (s: string) => void;
  onNodeTagUpdate: (nodePath: string, tag: string, add: boolean) => void;
}

const MAX_VISIBLE_TAGS = 5;


export const TagList: React.FC<TagListProps> = ({ nodes, links, selectedNodePath, uncheckedTags, onToggleTag, onSetUncheckedTags, tagColorMap, tagColorMode, onSetTagColorMode, search, onSearchChange, onNodeTagUpdate }) => {
  const app = useContext(AppContext);

  // Pending toggles: tag → intended checked state (overrides selectedNodeTags until cache refreshes)
  const [pendingToggled, setPendingToggled] = useState<Map<string, boolean>>(new Map());

  // Reset pending overrides when the selected node changes
  useEffect(() => {
    setPendingToggled(new Map());
  }, [selectedNodePath]);

  const sortedTags = useMemo(() => {
    const counts = new Map<string, number>();
    let untaggedCount = 0;
    for (const node of nodes) {
      if (node.tags.length === 0) {
        untaggedCount++;
      } else {
        for (const tag of node.tags) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (untaggedCount > 0) {
      sorted.push([UNTAGGED, untaggedCount]);
    }
    return sorted;
  }, [nodes]);

  const filteredTags = useMemo(() => {
    const terms = search
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (terms.length === 0) return sortedTags;
    return sortedTags.filter(([tag]) => {
      const label = tag === UNTAGGED ? "unspecified" : tag.toLowerCase();
      return terms.some((t) => label.includes(t));
    });
  }, [sortedTags, search]);

  const selectedNodeTags = useMemo(() => {
    if (!selectedNodePath) return new Set<string>();
    const node = nodes.find((n) => n.path === selectedNodePath);
    if (!node) return new Set<string>();
    if (node.tags.length === 0) return new Set([UNTAGGED]);
    return new Set(node.tags);
  }, [nodes, selectedNodePath]);

  // Tags that neighbors have but the selected node doesn't
  const neighborOnlyTags = useMemo(() => {
    if (!selectedNodePath) return [] as [string, number][];
    const neighborPaths = new Set<string>();
    for (const link of links) {
      if (link.source.path === selectedNodePath) neighborPaths.add(link.target.path);
      if (link.target.path === selectedNodePath) neighborPaths.add(link.source.path);
    }
    const tagCounts = new Map<string, number>();
    for (const node of nodes) {
      if (!neighborPaths.has(node.path)) continue;
      for (const tag of node.tags) {
        if (tag === UNTAGGED) continue;
        if (!selectedNodeTags.has(tag)) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
    }
    return [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  }, [links, nodes, selectedNodePath, selectedNodeTags]);

  // Count how many of the current node's tags are still checked
  const checkedCurrentTagCount = useMemo(() => {
    let count = 0;
    for (const tag of selectedNodeTags) {
      if (!uncheckedTags.has(tag)) count++;
    }
    return count;
  }, [selectedNodeTags, uncheckedTags]);

  const filteredUncheckedCount = useMemo(
    () => filteredTags.filter(([tag]) => uncheckedTags.has(tag)).length,
    [filteredTags, uncheckedTags],
  );
  const allChecked = filteredUncheckedCount === 0;
  const someUnchecked = filteredUncheckedCount > 0 && filteredUncheckedCount < filteredTags.length;

  const firstItemRef = useRef<HTMLLabelElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [itemsMaxHeight, setItemsMaxHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!firstItemRef.current || !itemsRef.current) return;
    if (sortedTags.length <= MAX_VISIBLE_TAGS) {
      setItemsMaxHeight(undefined);
      return;
    }
    const itemH = firstItemRef.current.offsetHeight;
    const gap = parseFloat(getComputedStyle(itemsRef.current).gap) || 0;
    setItemsMaxHeight(MAX_VISIBLE_TAGS * itemH + (MAX_VISIBLE_TAGS - 1) * gap);
  }, [sortedTags.length]);

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someUnchecked;
    }
  }, [someUnchecked]);

  const handleSelectAll = () => {
    const filteredTagKeys = new Set(filteredTags.map(([tag]) => tag));
    if (allChecked) {
      onSetUncheckedTags(new Set([...uncheckedTags, ...filteredTagKeys]));
    } else {
      onSetUncheckedTags(new Set([...uncheckedTags].filter((t) => !filteredTagKeys.has(t))));
    }
  };

  const handleFileTagToggle = useCallback(async (tag: string) => {
    if (!app || !selectedNodePath || tag === UNTAGGED) return;

    // Effective checked state: pending override wins over graph data
    const currentlyChecked = pendingToggled.has(tag)
      ? pendingToggled.get(tag)!
      : selectedNodeTags.has(tag);

    // Optimistic update so the checkbox responds immediately
    setPendingToggled((prev) => {
      const next = new Map(prev);
      next.set(tag, !currentlyChecked);
      return next;
    });

    const file = app.vault.getAbstractFileByPath(selectedNodePath);
    if (!(file instanceof TFile)) return;

    const tagWithHash = tag.startsWith("#") ? tag : `#${tag}`;
    const content = await app.vault.read(file);

    if (currentlyChecked) {
      // Remove: strip the tag and collapse any resulting double-space
      const escaped = tagWithHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const newContent = content
        .replace(new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`), (match) =>
          match.startsWith(" ") && match.length > tagWithHash.length ? " " : ""
        )
        .trimStart();
      if (newContent !== content) {
        await app.vault.modify(file, newContent);
        tagIndex.updateTag(selectedNodePath, tagWithHash, false);
        onNodeTagUpdate(selectedNodePath, tagWithHash, false);
      }
    } else {
      // Add: insert with a space separator after frontmatter (or at beginning of file)
      const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
      let newContent: string;
      if (frontmatterMatch) {
        const offset = frontmatterMatch[0].length;
        newContent = content.slice(0, offset) + tagWithHash + " " + content.slice(offset);
      } else {
        newContent = tagWithHash + " " + content;
      }
      await app.vault.modify(file, newContent);
      tagIndex.updateTag(selectedNodePath, tagWithHash, true);
      onNodeTagUpdate(selectedNodePath, tagWithHash, true);
    }
  }, [app, selectedNodePath, pendingToggled, selectedNodeTags, onNodeTagUpdate]);

  const [isMinimized, setIsMinimized] = useState(false);

  if (sortedTags.length === 0) return null;

  const ownTags = [...selectedNodeTags].filter((t) => t !== UNTAGGED);
  const showNodePanel = selectedNodePath && (ownTags.length > 0 || neighborOnlyTags.length > 0);

  return (
    <div className="nbrace-tag-list">
      <div className="nbrace-tag-left">
        <div className="nbrace-tag-color-toggle">
          <button
            className="nbrace-tag-minimize-btn"
            onClick={() => setIsMinimized((v) => !v)}
            title={isMinimized ? "Expand tag list" : "Minimize tag list"}
          >
            {isMinimized ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
          <button
            className={`nbrace-tag-color-btn${tagColorMode === "nodes" ? " active" : ""}`}
            onClick={() => onSetTagColorMode("nodes")}
            title="Color nodes by tag"
          >Cloudy tags</button>
          <button
            className={`nbrace-tag-color-btn${tagColorMode === "edges" ? " active" : ""}`}
            onClick={() => onSetTagColorMode("edges")}
            title="Color edges by tag"
          >Edgy tags</button>
        </div>
        {!isMinimized && (
        <div className="nbrace-tag-filter-panel">
        <div className="nbrace-tag-search-wrap">
          <input
            className="nbrace-tag-search"
            type="text"
            placeholder="Filter tags…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSelectAll(); }}
          />
          {search && (
            <button className="nbrace-tag-search-clear" onClick={() => onSearchChange("")} title="Clear">×</button>
          )}
        </div>
        <label className="nbrace-tag-item nbrace-tag-select-all">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allChecked}
            onChange={handleSelectAll}
          />
          <span className="nbrace-tag-select-all-label">All</span>
        </label>
        <div
          ref={itemsRef}
          className="nbrace-tag-items"
          style={itemsMaxHeight !== undefined ? { maxHeight: itemsMaxHeight } : undefined}
        >
          {filteredTags.map(([tag, count], i) => {
            const isOnSelected = selectedNodeTags.has(tag);
            const isChecked = !uncheckedTags.has(tag);
            const isDisabled = isOnSelected && isChecked && checkedCurrentTagCount <= 1;
            return (
              <label key={tag} ref={i === 0 ? firstItemRef : undefined} className="nbrace-tag-item">
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onToggleTag(tag)}
                />
                <span
                  className="nbrace-tag-pill"
                  style={{ backgroundColor: tagColorMap.get(tag) ?? "#9e9e9e" }}
                >
                  {tag === UNTAGGED ? "UNSPECIFIED" : tag}
                </span>
                <span className="nbrace-tag-count">{count}</span>
              </label>
            );
          })}
        </div>
        </div>
        )}
      </div>

      {!isMinimized && showNodePanel && (
        <div className="nbrace-tag-node-panel">
          <div className="nbrace-tag-node-panel-header">Node tags</div>
          <div className="nbrace-tag-node-items" style={itemsMaxHeight !== undefined ? { maxHeight: itemsMaxHeight } : undefined}>
            {ownTags.map((tag) => (
              <label key={tag} className="nbrace-tag-item">
                <input
                  type="checkbox"
                  checked={pendingToggled.has(tag) ? pendingToggled.get(tag)! : selectedNodeTags.has(tag)}
                  onChange={() => handleFileTagToggle(tag)}
                />
                <span
                  className="nbrace-tag-pill"
                  style={{ backgroundColor: tagColorMap.get(tag) ?? "#9e9e9e" }}
                >
                  {tag}
                </span>
              </label>
            ))}
            {neighborOnlyTags.map(([tag, count]) => (
              <label key={tag} className="nbrace-tag-item">
                <input
                  type="checkbox"
                  checked={pendingToggled.has(tag) ? pendingToggled.get(tag)! : selectedNodeTags.has(tag)}
                  onChange={() => handleFileTagToggle(tag)}
                />
                <span
                  className="nbrace-tag-pill nbrace-tag-pill--neighbor"
                  style={{ backgroundColor: tagColorMap.get(tag) ?? "#9e9e9e" }}
                >
                  {tag}
                </span>
                <span className="nbrace-tag-count">{count}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
