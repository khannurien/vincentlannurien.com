---
draft: false
hide_title: false

title: "Android: timelapse video using camera feed"
date: 2026-03-26T18:45:00Z

tags:
  - "video"
  - "android"
  - "windows"
---

## Stream

Install `scrcpy`:

```powershell
winget install --exact Genymobile.scrcpy
```

> pronounced "**scr**een **c**o**py**"
>
> This application mirrors Android devices (video and audio) connected via USB or TCP/IP and allows control using the computer's keyboard and mouse. It does not require root access or an app installed on the device. It works on Linux, Windows, and macOS.

On your Android device:
- Enable Developer options and USB debugging ([see docs](https://developer.android.com/studio/debug/dev-options?hl=fr#enable));
- ...

```powershell
scrcpy --video-source=camera --video-codec=h265 --video-bit-rate=2M --camera-size=1280x720 --camera-fps=10 --no-audio --record=timelapse.mp4
```

```powershell
ffmpeg -i .\input.mp4 -vf "framestep=660,setpts=PTS/660,fps=10" -an -c:v hevc_nvenc -preset p1 .\timelapse.mp4
```

`-vf "framestep=660,setpts=PTS/660,fps=10"`
  - Keeps 1 frame out of every 660 and discards the rest
  - Rewrites timestamps so playback is 660x faster
  - Forces the output to a constant 10 frames per second
- `-an`: Removes audio entirely
- `-c:v hevc_nvenc`: Uses NVIDIA GPU hardware encoding (HEVC / H.265)
  - `-preset p1`: Lowest compression efficiency, highest speed

In our case:
- Input: 10 fps
- After framestep: ~0.015 fps equivalent (1 frame every 66 seconds)
- After setpts + fps=10: normalized playback at 10 fps (66 seconds become 0.1 second)
