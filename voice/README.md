# Reese's Voice — Canonical Profile

**One voice. Every Reese Reviews video.**

## The voice

| Field | Value |
|---|---|
| Voice | **Sulafat** |
| Language | `en-US` |
| Gender | Female |
| Pitch | Medium |
| Timbre | Warm |
| Baseline style | `warm, friendly, conversational` |

Listen to the [10-second sample](reference/reese-voice-sample-10s.mp3) or the [full 43.8-second reference](reference/reese-reference-voiceover.wav).

## Why this voice

Reese is the face of Reese Reviews and Caresse is the reviewer persona. A single, recognizable voice makes the brand feel consistent across reviews, live ads, short-form clips, and product explainers. Do not substitute a different voice because a scene feels different; change the delivery style instead.

## Exact style strings

Use these strings in the `style` field so the delivery stays consistent:

| Moment | Style |
|---|---|
| Hook | `curious, conversational` |
| Deal / price | `warm, friendly, conversational` |
| Features | `confident, friendly` |
| Caveat / fine print | `honest, reassuring` |
| CTA | `warm, friendly` |

## How to generate a voiceover

Use the built-in speech tool with:

- `voice_name`: `Sulafat`
- `language_code`: `en-US`
- `turns`: one turn per delivery change, with the exact style strings above
- Add `brief` and an absolute `.wav` `path` when calling the tool

A ready-to-use payload is in [`payload-example.json`](payload-example.json). For longer scripts, keep each `turns[].text` as natural speech and split at paragraph or delivery boundaries. The total text per call must stay under 6,000 characters.

## Pronunciation guide

| Written | Spoken |
|---|---|
| Ring Battery Doorbell 2K | Ring Battery Doorbell two-K |
| 2.4 GHz | two-point-four gigahertz |
| $39.99 | thirty-nine ninety-nine |
| $99.99 | ninety-nine ninety-nine |
| Ring Protect | Ring Protect |
| USB-C | U-S-B-C |
| Alexa | uh-LEK-suh |

Write these out phonetically in the script when the model misreads them.

## App integration (ElevenLabs pipeline)

The Reese Reviews app currently synthesizes narration through ElevenLabs in `app/clients/elevenlabs.py`. That pipeline uses the `reese_voice_id` secret and its own voice settings. To keep one voice:

1. Set `reese_voice_id` once to the approved Reese voice.
2. Keep the settings in [`reese-voice-profile.json`](reese-voice-profile.json) aligned with `app/clients/elevenlabs.py`:
   - stability `0.50`
   - similarity_boost `0.80`
   - style `0.35`
   - use_speaker_boost `true`
3. Do not change the voice between jobs or avatars.

The built-in `Sulafat` voice is the canonical voice for content generated with the built-in speech tool. The ElevenLabs pipeline is a separate provider; do not clone `Sulafat` into ElevenLabs without confirming the voice owner's permission.

## Rules

- Use `Sulafat` for every Reese Reviews voiceover, live ad, and review.
- Do not switch voices between videos or between scenes in the same video.
- Reuse the exact style strings above.
- Regenerate the full passage instead of patching a few words with a different voice.
- Keep the reference audio in this folder for auditioning, QA, and future voice matching.

## Files

| File | Purpose |
|---|---|
| `reese-voice-profile.json` | Machine-readable voice profile, styles, pronunciation, and app settings |
| `payload-example.json` | Ready-to-use speech payload |
| `reference/reese-reference-voiceover.wav` | Full 43.8-second reference |
| `reference/reese-voice-sample-10s.mp3` | Short sample for quick audition |
| `reference/reese-voice-sample-10s.wav` | Lossless short sample |
