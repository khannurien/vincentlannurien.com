/**
 * ListenBrainz Now Playing Widget with cover art
 * Inspired by true events
 * https://jasoncrevier.com/listenbrainz-widget/
 * https://community.metabrainz.org/t/mbid-mapper-version-2-0-preview-has-finally-arrived/813908
 * https://www.srchetwynd.co.uk/en/posts/011-typescript-hugo/
 * 
 */

const username = "khannurien";

const labels = {
  nowPlaying: "🎧 Now Playing",
  lastPlayed: "🎧 Last Played",
  noListens: "🎧 This user has no listens yet",
  error: "🎧 Error loading track info",
};

const displayElement = document.getElementById("now-playing");
const statusElement = document.getElementById("now-playing-status");
const metadataElement = document.getElementById("now-playing-metadata");
const coverElement = document.getElementById("now-playing-cover");

if (
  displayElement instanceof HTMLAnchorElement
  && statusElement instanceof HTMLDivElement
  && metadataElement instanceof HTMLDivElement
  && coverElement instanceof HTMLImageElement
) {
  updateNowPlayingWidget(displayElement, statusElement, metadataElement, coverElement, username);
  setInterval(() => updateNowPlayingWidget(displayElement, statusElement, metadataElement, coverElement, username), 60000);
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error, status: ${res.status}`);
  return res.json();
}

async function fetchReleaseInfo(track: Record<string, any>): Promise<string | null> {
  const artistName = track.artist_name;
  const trackName = track.track_name;
  const releaseName = track.release_name;

  const params = new URLSearchParams({
    artist_credit_name: artistName,
    recording_name: trackName,
    release_name: releaseName
  });

  const mapperRequest = `https://mapper.listenbrainz.org/mapping/lookup?${params.toString()}`;

  // console.log("mapperRequest = ", mapperRequest);

  // const corsRequest = `https://api.allorigins.win/get?url=${encodeURIComponent(mapperRequest)}`;
  const corsRequest = `https://proxy.sqrt.fr/?${mapperRequest}`;

  // console.log("corsRequest = ", corsRequest);

  try {
    const corsResponse = await fetchJson(corsRequest);
    const releaseInfo = JSON.parse(corsResponse.contents);

    // console.log(releaseInfo);

    const releaseMbid = releaseInfo.release_mbid;
    if (!releaseMbid) return null;

    return releaseMbid;
  } catch {
    return null;
  }
}

async function getCoverArtUrl(track: Record<string, any>): Promise<string | null> {
  // Check if release exists
  const releaseMbid = await fetchReleaseInfo(track);

  if (!releaseMbid) return null;

  // Check if cover exists
  try {
    const coverUrl = `https://coverartarchive.org/release/${releaseMbid}/front-250`;

    // console.log(coverUrl);

    const coverRes = await fetch(coverUrl, { method: "HEAD" });
    if (!coverRes.ok) return null;

    return coverRes.url;
  } catch {
    return null;
  }
}

async function updateNowPlayingWidget(
  displayElement: HTMLAnchorElement,
  statusElement: HTMLDivElement,
  metadataElement: HTMLDivElement,
  coverElement: HTMLImageElement,
  username: string
) {
  displayElement.href = `https://listenbrainz.org/user/${username}/`;
  displayElement.dataset.username = username;

  const endpoints = {
    nowPlaying: `https://api.listenbrainz.org/1/user/${username}/playing-now`,
    recentTrack: `https://api.listenbrainz.org/1/user/${username}/listens?count=1`,
  };

  try {
    const nowPlayingData = await fetchJson(endpoints.nowPlaying);
    const currentTrack = nowPlayingData?.payload?.listens?.[0]?.track_metadata;
    const playingNow = nowPlayingData?.payload?.playing_now;

    if (playingNow && currentTrack) {
      statusElement.textContent = labels.nowPlaying;
      await renderTrack(currentTrack, displayElement, metadataElement, coverElement);
      return;
    }

    const recentData = await fetchJson(endpoints.recentTrack);
    const recentTrack = recentData?.payload?.listens?.[0]?.track_metadata;

    if (recentTrack) {
      statusElement.textContent = labels.lastPlayed;
      await renderTrack(recentTrack, displayElement, metadataElement, coverElement);
    } else {
      statusElement.textContent = labels.noListens;
      metadataElement.style.display = "none";
      coverElement.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to update Now Playing widget:", err);
    statusElement.textContent = labels.error;
    metadataElement.style.display = "none";
    coverElement.style.display = "none";
  }
}

async function renderTrack(
  track: Record<string, any>,
  displayElement: HTMLAnchorElement,
  metadataElement: HTMLDivElement,
  coverElement: HTMLImageElement
) {
  const metadata: Record<string, string> = {
    artist: track.artist_name || "Unknown Artist",
    title: track.track_name || "Unknown Track",
    release: track.release_name || "Unknown Release"
  };

  const ul = document.createElement("ul");

  Object.entries(metadata).forEach(([key, value]) => {
    const li = document.createElement("li");
    li.classList.add(`now-playing-metadata-${key}`);
    li.textContent = value;
    ul.appendChild(li);
  });

  metadataElement.innerHTML = "";
  metadataElement.style.display = "block";
  metadataElement.appendChild(ul);

  const coverUrl = await getCoverArtUrl(track);
  if (coverUrl) {
    coverElement.src = coverUrl;
    coverElement.style.display = "block";
    displayElement.classList.remove("no-cover");
  } else {
    coverElement.style.display = "none";
    displayElement.classList.add("no-cover");
  }
}
