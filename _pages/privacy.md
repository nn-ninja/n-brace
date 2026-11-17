---
layout: page
title: privacy policy
permalink: /privacy/
description: Privacy Policy for the n-brace app
nav: false
---

_Last updated: 17 November 2026_

This policy applies to the **n-brace** application for Windows, macOS, Linux and Android, and to this website. n-brace is developed by Rafał Hazan ("I", "me").

## The short version

n-brace stores everything on your device. I do not run any servers for the app, there are no accounts, and I do not collect, receive, sell or share your personal data. There are no ads, analytics, tracking, telemetry or crash-reporting services in the app.

## Data you create in the app

Your notes, links, tags, images, reminders, settings, and "life spaces" are stored only in local storage on your device, in the app's private data folder. This data never leaves your device unless you decide to export it yourself.

- **Backups.** When you export a backup, the file is saved where you choose. Where it goes after that (cloud drive, e-mail, another device) is up to you and governed by that service's policy.
- **Life space password.** An optional password locks the app's interface for a life space. It is stored only on your device as a salted hash (argon2id) and is never transmitted. I cannot recover it for you.
- **Local-only features.** Search, recap (spaced repetition), reminders and graph layout all run entirely on your device.

## Security of your data

Your data is stored unencrypted in the app's private storage and protected by your device's own security (screen lock, disk encryption, OS user accounts). The optional life space password only locks the app's interface; it does not encrypt your data, and the desktop MCP helper described below does not check it. Backup files you export are likewise not encrypted by the app. Keep them somewhere you trust.

## Desktop application (Windows, macOS, Linux)

The desktop app uses the network only as follows:

- **Update check.** On launch, the app requests a small version file from GitHub (`github.com/nn-ninja/nbrace-releases`) to see whether a newer version exists. If you accept an update, it is downloaded from GitHub. GitHub receives the usual technical information of any web request (such as your IP address), under [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- **Optional AI assistant integration (MCP).** The desktop app ships with a local helper that lets an AI assistant you configure yourself (for example Claude Desktop) read and add notes in your local database. This is off unless you set it up. The helper runs on your computer; any note content you let the assistant read is sent to that assistant under the assistant provider's own terms and privacy policy. The helper can also fetch web pages and images from addresses you or the assistant ask it to import; the owners of those sites see the request.

n-brace asks for no access to your contacts, location, camera, microphone or accounts. Files are accessed only through the system file dialog when you import or export something. Reminders are shown inside the app; the app does not use system notifications. No personal data is sent to me in any of these cases.

## Android application

- **Permissions.** The app requests only the `INTERNET` permission. It asks for no access to your contacts, location, camera, microphone, SMS, phone, accounts, or shared storage. Backups are saved and imported only through Android's system file picker, in the place you choose.
- **Network use.** The app does not connect to the internet by itself: it has no update check, no analytics and no other background requests. The `INTERNET` permission is declared but unused for your data. Updates come through Google Play or a manual install.
- **No AI assistant helper.** The MCP helper described above is not part of the Android app.
- **Local data.** Everything else, including notes, tags, reminders, search and recap, stays in the app's private storage on your device. Reminders are shown inside the app; the app does not use system notifications. No personal data is sent to me.

## This website

This is a static site hosted on GitHub Pages. It has no accounts, forms, analytics or tracking cookies, and I collect nothing from visitors. GitHub, as host, may log visits as described in its privacy statement. Your browser also loads some scripts and images from content delivery services (jsDelivr, cdnjs/Cloudflare, Amazon CloudFront and badge.dimensions.ai), which receive your IP address and browser details under their own policies. Fonts are served from this site. Download links lead to GitHub Releases.

## Children

n-brace is intended for users aged 13 and over and is not directed to children under 13. The app collects no personal data from anyone, including children. If you are a parent or guardian and believe a child under 13 has sent me personal information (for example by e-mail), contact me and I will delete it.

## Data retention and deletion

Because all data is local, you control it. Deleting a note, a life space, or uninstalling the app removes the corresponding data from your device. Exported backups you made are separate files that you must delete yourself.

## Your rights

I do not hold any of your personal data: it lives on your device, under your control. There is therefore nothing for me to access, correct, export or delete. If you e-mail me, I use your message only to reply and delete it when no longer needed. Depending on where you live you may have rights under laws such as the GDPR or CCPA; for anything I might hold, contact me and I will honor them.

## Third-party links

This page and the app link to services I don't control, such as GitHub, Buy Me a Coffee and any AI assistant you connect. Their privacy practices are theirs.

## Changes

If the app's data handling changes, I will update this page and the date above. I will not change how I handle data already collected in a way that makes it less protected.

## Contact

Questions or requests: <rafal.hazan@gmail.com>, or see the [contact]({{ '/contact/' | relative_url }}) page.
