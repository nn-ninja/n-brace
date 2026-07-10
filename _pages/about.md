---
layout: about
title: about
permalink: /
subtitle: Embrace your brain.

#selected_papers: true # includes a list of papers marked as "selected={true}"
#social: true # includes social icons at the bottom of the page

announcements:
  enabled: true # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 3 # leave blank to include all the news in the `_news` folder

#latest_posts:
#  enabled: true
#  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
#  limit: 3 # leave blank to include all the blog posts
---

**n-brace** is a standalone, offline-first app for visualizing and navigating your notes as a graph mind map.  
It’s designed around the *Pocket Brain* (some call it Second Brain) technique and helps you move smoothly through your knowledge network.

<div id="nbraceCarousel" class="carousel slide mb-3" data-ride="carousel" data-interval="false">
  <div class="carousel-inner">
    <div class="carousel-item active">
      <img class="d-block" src="{{ '/assets/img/nbrace-app-screenshot.png' | relative_url }}" alt="n-brace app screenshot">
    </div>
    <div class="carousel-item">
      <img class="d-block" src="{{ '/assets/img/nbrace-plugin-approved.png' | relative_url }}" alt="n-brace plugin approved screenshot">
    </div>
  </div>
  <a class="carousel-control-prev" href="#nbraceCarousel" role="button" data-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="carousel-control-next" href="#nbraceCarousel" role="button" data-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="sr-only">Next</span>
  </a>
</div>

---

<!-- NEWS_ANCHOR -->

---

N-brace is available now as a **free standalone app** for Windows, macOS and Linux, and is under **active development**.   
If you find it useful, you can [sponsor this project](https://buymeacoffee.com/nbrace) — free hugs for all supporters ☕🤗

If you're an Obsidian user, the [Obsidian plugin]({{ '/projects/obsidian_plugin/' | relative_url }}) is still around and supported, but the standalone app is where new features land first.

---

## Features

- **Seamless navigation** – show only the local part of the graph you're currently exploring, move through linked notes, jump between nodes with keyboard shortcuts, and let automatic layout keep everything readable.
- **Quick graph manipulation** – a radial pie menu puts create, link, group and move actions one click away, right where your cursor is, so reshaping the map never breaks your flow.
- **Tag area view layer** – tags render as colored regions overlaid directly on the canvas, so you can see at a glance which cluster or topic a note belongs to, and filter the view down to just the layers you care about.
- **Deep structure** – A note can have many flavors, contextual contents, letting deep, cross-cutting structures emerge from a flat graph.
- **Reminders** – set reminders on any note to resurface repeating tasks, refresh knowledge you don't want to forget, or manage household chores, right from your graph.
- **MCP server for AI integration** – a built-in [MCP](https://modelcontextprotocol.io) server exposes your note graph to AI assistants like Claude Desktop and Claude Code, so they can search your notes and import web articles as structured, tagged nodes directly into your map.
- **Interactive and mobile-friendly** – works smoothly on desktop and mobile devices <<not yet>>.

