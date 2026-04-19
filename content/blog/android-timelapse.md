---
draft: true
hide_title: false

title: "Android Timelapse"
date: 2026-03-26T18:45:00Z

tags:
  - "video"
  - "android"
---

## Stream

```powershell
winget install --exact Genymobile.scrcpy
```

```powershell
scrcpy --video-source=camera --video-codec=h265 --video-bit-rate=2M --camera-size=1280x720 --camera-fps=10 --no-audio --record=timelapse.mp4
```