---
layout: page
title: the App
description: standalone application
img: assets/img/n-brace-logo.svg
importance: 1
category: app
---

Great news!

![n-brace app installed]({{ '/assets/img/nbrace-app-installed.png' | relative_url }})


Finally after three major idea iterations which took me long years...
n-brace application has been released.

## Installation steps
Choose proper installation file for your Operating System from [n-brace releases](https://github.com/nn-ninja/nbrace-releases/releases), or grab it directly from the table below — links always resolve to the current latest release.

<div class="installer-table-wrap">
  <table id="nbrace-install-table" class="table table-bordered text-center align-middle mb-2">
    <thead>
      <tr><th>Operating System</th><th>Installer</th></tr>
    </thead>
    <tbody>
      <tr><td>Windows</td><td><a id="dl-windows" class="btn" href="https://github.com/nn-ninja/nbrace-releases/releases/latest">loading…</a></td></tr>
      <tr><td>macOS (Apple Silicon)</td><td><a id="dl-macos-arm" class="btn" href="https://github.com/nn-ninja/nbrace-releases/releases/latest">loading…</a></td></tr>
      <tr><td>macOS (Intel)</td><td><a id="dl-macos-intel" class="btn" href="https://github.com/nn-ninja/nbrace-releases/releases/latest">loading…</a></td></tr>
      <tr><td>Linux (.deb)</td><td><a id="dl-linux-deb" class="btn" href="https://github.com/nn-ninja/nbrace-releases/releases/latest">loading…</a></td></tr>
      <tr><td>Linux (.rpm)</td><td><a id="dl-linux-rpm" class="btn" href="https://github.com/nn-ninja/nbrace-releases/releases/latest">loading…</a></td></tr>
      <tr><td>macOS (manual app bundle)</td><td><a id="dl-macos-tar" class="btn" href="https://github.com/nn-ninja/nbrace-releases/releases/latest">loading…</a></td></tr>
    </tbody>
  </table>
  <p id="nbrace-latest-version" class="text-center" style="font-size: 0.875rem;"></p>
</div>

<script>
(function () {
  var patterns = {
    "dl-windows": /_x64-setup\.exe$/,
    "dl-macos-arm": /_aarch64\.dmg$/,
    "dl-macos-intel": /_x64\.dmg$/,
    "dl-macos-tar": /\.app\.tar\.gz$/,
    "dl-linux-deb": /_amd64\.deb$/,
    "dl-linux-rpm": /\.x86_64\.rpm$/
  };

  fetch("https://api.github.com/repos/nn-ninja/nbrace-releases/releases/latest")
    .then(function (res) { return res.json(); })
    .then(function (release) {
      var assets = release.assets || [];
      Object.keys(patterns).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var asset = assets.find(function (a) { return patterns[id].test(a.name); });
        if (asset) {
          el.href = asset.browser_download_url;
          el.textContent = asset.name;
        } else {
          el.textContent = "not available";
        }
      });
      var versionEl = document.getElementById("nbrace-latest-version");
      if (versionEl && release.tag_name) {
        versionEl.textContent = "Latest version: " + release.tag_name;
      }
    })
    .catch(function () {
      Object.keys(patterns).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = "see releases page";
      });
    });
})();
</script>

Then install.

Application should autoupdate when new version arrives.

For now Mobile versions are not available (I have not enough funds for that).