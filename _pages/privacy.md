---
layout: page
title: privacy policy
permalink: /privacy/
description: Privacy Policy for the n-brace app
nav: false
---

_Last updated: 17 November 2026_

This policy applies to the **n-brace** application for Android, Windows, macOS and Linux, and to this website. n-brace is developed by Rafał Hazan ("I", "me").

## The short version

n-brace stores everything on your device. I do not run any servers for the app, there are no accounts, and I do not collect, receive, sell or share your personal data. There are no ads, analytics, tracking or crash-reporting services in the app.

## Data you create in the app

Your notes, links, tags, images, reminders, settings, and "life spaces" are stored only in local storage on your device, in the app's private data folder. This data never leaves your device unless you decide to export it yourself.

- **Backups.** When you export a backup, the file is saved where you choose. Where it goes after that (cloud drive, e-mail, another device) is up to you and governed by that service's policy.
- **Life space password.** An optional password locks the app's interface for a life space. It is stored only on your device as a salted hash (argon2id) and is never transmitted. I cannot recover it for you.
- **Local-only features.** Search, recap (spaced repetition), reminders and graph layout all run entirely on your device.

## Network access

The Android app declares the `INTERNET` permission. n-brace uses the network only as follows:

- **Update check (desktop only).** On launch, the Windows, macOS and Linux apps request a small version file from GitHub (`github.com/nn-ninja/nbrace-releases`) to see whether a newer version exists. If you accept an update, it is downloaded from GitHub. GitHub receives the usual technical information of any web request (such as your IP address), under [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). The Android app does not check for updates itself.
- **Content you choose to load.** If you add an image from a web address, the app downloads that image from the address you gave. The owner of that site sees the request.
- **Optional AI assistant integration (MCP, desktop).** The desktop app ships with a local helper that lets an AI assistant you configure yourself (for example Claude Desktop) read and add notes in your local database. This is off unless you set it up. The helper runs on your computer; any note content you let the assistant read is sent to that assistant under the assistant provider's own terms and privacy policy. The helper can also fetch web pages you ask it to import.

No personal data is sent to me in any of these cases.

## Permissions

n-brace asks for no access to your contacts, location, camera, microphone, SMS, or accounts. Files are accessed only through the system file picker when you choose to import or export something. Reminder notifications, where used, are generated locally on your device.

## Children

n-brace is not directed to children under 13 and collects no data from anyone.

## Data retention and deletion

Because all data is local, you control it. Deleting a note, a life space, or uninstalling the app removes the corresponding data from your device. Exported backups you made are separate files that you must delete yourself.

## This website

This website is hosted on GitHub Pages. I do not run analytics or set tracking cookies on it. GitHub, as host, may log visits as described in its privacy statement. Download links lead to GitHub Releases.

## Changes

If the app's data handling changes, I will update this page and the date above.

## Contact

Questions or requests: <rafal.hazan@gmail.com>, or see the [contact]({{ '/contact/' | relative_url }}) page.
