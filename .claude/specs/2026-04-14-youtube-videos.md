# YouTube Videos + yt-dlp Subtitle Migration

**Status:** Proposed  
**Date:** 2026-04-14

## Problem Statement

The app supports songs as the only YouTube-backed content type, using lrclib.net for synced lyrics. Two problems: (1) there's no way to add non-song Spanish YouTube content, and (2) lrclib.net timing is keyed to audio recordings, not specific YouTube uploads — music videos have intros/outros that shift the timing relative to the LRC data. Using yt-dlp as the single subtitle source for both songs and videos fixes the timing problem and enables a generic video content type with minimal additional complexity.

## Goals

1. Songs use yt-dlp Spanish auto-captions instead of lrclib.net, giving accurate per-video timing.
2. Teachers can add any Spanish YouTube video (not just music) and get the same time-synced experience.
3. Students see subtitle lines scroll and highlight in sync with playback for both songs and videos.
4. Students can click words in subtitles to save vocabulary for both content types.
5. Videos appear in a `/videos` listing page parallel to `/music`.

## Non-Goals

- Uploading custom subtitle files (yt-dlp auto-captions sufficient for v1).
- Supporting non-Spanish source videos.
- In-app subtitle editing or correction UI.
- A unified "all content" feed combining songs and videos.
- Backfilling existing songs with yt-dlp subtitles automatically (teacher-initiated reload only).

## User Stories

- As a teacher, I want new songs to use YouTube subtitle timing so that lyrics are always in sync with the video.
- As a teacher, I want to reload a song's lyrics via yt-dlp so that I can fix timing on songs added before this change.
- As a teacher, I want to add any Spanish YouTube video by URL so that students have access to content beyond music.
- As a student, I want subtitles to scroll and highlight in sync with playback so that I can follow along.
- As a student, I want to click a word and save it to my vocabulary from any content type.

## Requirements

### Must-Have (P0)

**Songs migration:**
- Replace `fetchLrc()` + lrclib.net with `fetchSubtitles(youtubeId)` via yt-dlp in `music.ts`.
- New songs fetch subtitles via yt-dlp at creation time.
- "Reload" on existing songs re-fetches via yt-dlp (replaces old lines).
- The `lrcText` column in `songs` is retained but no longer written (non-destructive schema change).

**New video content type:**
- Form at `/videos/new` accepts a YouTube URL, fetches title via oEmbed, fetches subtitles via yt-dlp, translates via DeepL, stores in DB.
- `/videos` listing page shows all saved videos.
- `/videos/[id]` detail page: YouTube embed + time-synced subtitles + saved words — identical layout to `/music/[id]`.
- Word tracking: clicking a word opens save popover; saved words use the existing `words` table with a new nullable `videoId` FK.
- Reload subtitles button on detail page.

### Nice-to-Have (P1)

- Teacher notes on video detail page.
- Subtitle language fallback: try native Spanish captions, then auto-generated Spanish captions.

### Future Considerations (P2)

- Support non-Spanish source languages.
- Unified content feed / search across songs + videos.
- Student progress tracking (watched %, last position).

## Data Model

**Schema changes:**
```
videos      id, title, channel, youtube_id, teacher_notes, created_at
video_lines id, video_id (FK cascade), line_number, start_ms, spanish, english
words       + nullable video_id FK (alongside existing song_id)
```

`songs.lrc_text` column retained, not removed.

## Technical Approach

**Shared subtitle utility** (`src/lib/server/subtitles.ts`):
- `fetchSubtitles(youtubeId: string): Promise<VttLine[] | null>` — shells out to yt-dlp, reads `/tmp/<youtubeId>.es.vtt`, parses VTT, cleans up temp file.
- `parseVtt(text: string): { startMs: number; text: string }[]` — parses `HH:MM:SS.mmm --> HH:MM:SS.mmm\ntext` blocks; joins multi-line cues with space; skips music-symbol-only lines.
- "No subtitles" detection: yt-dlp exits 0 but writes no file → return null.

**VTT format (verified):**
```
WEBVTT
Kind: captions
Language: es

00:00:27.726 --> 00:00:29.129
♪ AAAAY ♪

00:00:41.207 --> 00:00:45.678
♪ SI... SABES QUE YA LLEVO
UN RATO MIRÁNDOTE ♪
```
- Timestamp → ms: `HH*3600000 + MM*60000 + SS*1000 + mmm`
- Multi-line cues joined with space
- Output file path: `<stem>.es.vtt` (yt-dlp appends lang + extension)

**Songs updated** (`src/lib/server/music.ts`):
- `fetchLrc()` removed; `saveSongLines()` calls `fetchSubtitles()` instead.

**New videos module** (`src/lib/server/videos.ts`):
- `fetchVideoMetadata(youtubeId)` — oEmbed for title + channel.
- `saveVideoLines(videoId, lines)` — translate + insert.

**Routes:** `src/routes/videos/` mirrors `src/routes/music/` exactly.

**yt-dlp command (verified working):**
```
yt-dlp --write-auto-sub --sub-lang es --sub-format vtt --skip-download -o /tmp/<youtubeId> <url>
```

## Open Questions

- **[resolved]** yt-dlp to be installed on exe.dev VM as part of this work.
- **[engineering]** Subprocess call is synchronous — acceptable for teacher-only add flow.
- **[product]** Songs and videos share the `words` table — confirmed acceptable.

## Acceptance Criteria

- [ ] Adding a new song uses yt-dlp subtitles; lyrics are in sync with the video's actual timing.
- [ ] Reloading an existing song re-fetches via yt-dlp.
- [ ] Adding a YouTube video at `/videos/new` creates a record and redirects to `/videos/[id]`.
- [ ] `/videos/[id]` shows embed + time-synced subtitles that scroll and highlight during playback.
- [ ] Word click → save popover → word stored with `videoId` set.
- [ ] If yt-dlp finds no Spanish subtitles, the form shows a clear error.
- [ ] TypeScript strict: no `any`, no `!`, no `as` without comment.
- [ ] `subtitles.ts` has unit tests for `parseVtt` covering multi-line cues, timing conversion, empty input.
