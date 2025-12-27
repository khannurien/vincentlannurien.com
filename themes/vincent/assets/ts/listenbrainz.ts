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
const coverElement = document.getElementById("now-playing-cover");

if (displayElement instanceof HTMLAnchorElement && coverElement instanceof HTMLImageElement) {
  updateNowPlayingWidget(displayElement, coverElement, username);
  setInterval(() => updateNowPlayingWidget(displayElement, coverElement, username), 60000);
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

async function getCoverArtUrl(track: Record<string, any>): Promise<string | null> {
  try {
    const artistName = encodeURIComponent(track.artist_name);
    const trackName = encodeURIComponent(track.track_name);
    const releaseName = encodeURIComponent(track.release_name);

    const mapperRequest = `https://mapper.listenbrainz.org/mapping/lookup?artist_credit_name=${artistName}&recording_name=${trackName}&release_name=${releaseName}`;
    const releaseInfo = await fetchJson(mapperRequest);

    const releaseMbid = releaseInfo.release_mbid;
    if (!releaseMbid) return null;

    // Check if cover exists
    const coverUrl = `https://coverartarchive.org/release/${releaseMbid}/front-250`;
    const coverRes = await fetch(coverUrl, { method: "HEAD" });
    if (!coverRes.ok) return null;

    return coverUrl;
  } catch {
    return null;
  }
}

function getTrackInfo(track: Record<string, any>): { artist: string; title: string } {
  return {
    artist: track?.artist_name || "Unknown Artist",
    title: track?.track_name || "Unknown Track",
  };
}

async function updateNowPlayingWidget(
  displayElement: HTMLAnchorElement,
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
    const playingNow = nowPlayingData?.payload?.playing_now;
    const currentTrack = nowPlayingData?.payload?.listens?.[0]?.track_metadata;

    if (playingNow && currentTrack) {
      await renderTrack(currentTrack, labels.nowPlaying, displayElement, coverElement);
      return;
    }

    const recentData = await fetchJson(endpoints.recentTrack);
    const recentTrack = recentData?.payload?.listens?.[0]?.track_metadata;

    if (recentTrack) {
      await renderTrack(recentTrack, labels.lastPlayed, displayElement, coverElement);
    } else {
      displayElement.textContent = labels.noListens;
      coverElement.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to update Now Playing widget:", err);
    displayElement.textContent = labels.error;
    coverElement.style.display = "none";
  }
}

async function renderTrack(
  track: Record<string, any>,
  label: string,
  displayEl: HTMLAnchorElement,
  coverEl: HTMLImageElement
) {
  const { artist, title } = getTrackInfo(track);
  displayEl.textContent = `${label}: ${artist} – ${title}`;

  const coverUrl = await getCoverArtUrl(track);
  if (coverUrl) {
    coverEl.src = coverUrl;
    coverEl.style.display = "block";
  } else {
    coverEl.style.display = "none";
  }
}
