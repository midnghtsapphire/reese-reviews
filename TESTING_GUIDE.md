# Reese Reviews - Testing Guide

This guide explains how to test the core features of the Reese Reviews platform, specifically focusing on the new Vine Review Auto-Generator and the Music Video Creator.

## 1. Testing the Vine Review Auto-Generator

The Vine Review Auto-Generator is designed to streamline the process of reviewing Amazon Vine products. It automatically generates review text, finds product photos, creates a video, and prepares a submission package.

### Prerequisites
- An active OpenRouter API key configured in the `.env` file (`VITE_OPENROUTER_API_KEY`).
- A modern web browser (Chrome, Firefox, Safari, or Edge).

### End-to-End Testing Steps

1. **Navigate to the Vine Dashboard:**
   - Go to the `/vine` route in the application.

2. **Add a Vine Item:**
   - Click the "Add Item Manually" button.
   - Enter a product name (e.g., "Wireless Bluetooth Earbuds").
   - Enter a realistic ASIN (e.g., "B0852T22XY").
   - Set the order date and review deadline.
   - Click "Save".

3. **Generate the Review Text:**
   - Find the newly added item in the "Pending" tab.
   - Click "Generate Review".
   - Select a video length preset (e.g., "1 minute").
   - Click "Generate".
   - **Expected Output:** The system should call the OpenRouter API and return a generated review with a star rating, headline, body text, pros/cons, and an FTC disclosure.

4. **Find Product Photos:**
   - On the item card, click the "Photos" button (camera icon).
   - In the Photo Finder modal, ensure some sources (Amazon, Web) are checked.
   - Click "Find Product Photos".
   - **Expected Output:** The system should display several images related to the product name/ASIN.
   - Select 2-3 photos by clicking on them.
   - Click "Use X Selected Photos".

5. **Generate a Video Review:**
   - On the item card, click the "Video" button (play icon).
   - Select an avatar (or use the silhouette).
   - Click "Generate Video".
   - **Expected Output:** A progress bar should appear, and after a few moments, a video player should display the generated video with the avatar and text captions.

6. **Submit the Review:**
   - On the item card, click the "Submit" button (clipboard icon).
   - The Review Submission Form modal will appear.
   - **Expected Output:** The form should be pre-filled with the generated star rating, headline, body text, selected photos, and video status.
   - Test the "Copy" buttons next to each field to ensure they copy the text to your clipboard.
   - Click "Export Review Package" to download a text file containing all the review details.
   - (Optional) Click "Open Amazon Review Form" to verify it opens the correct Amazon URL.

---

## 2. Testing the Music Video Creator

The Music Video Creator allows artists to generate stylized music videos with avatars, themes, and synced lyrics.

### Prerequisites
- An audio file (MP3, WAV, M4A, or OGG) to use for testing.

### End-to-End Testing Steps

1. **Navigate to the Music Video Creator:**
   - Go to the `/music-video` route in the application.

2. **Step 1: Upload Song**
   - Click the upload area and select your audio file.
   - Fill in the "Song Name" and "Artist Name".
   - (Optional) Paste some lyrics into the text area.
   - Click "Next: Avatar".

3. **Step 2: Choose Avatar**
   - Either upload a photo of yourself/an avatar OR click "Use Silhouette Avatar".
   - Click "Next: Theme".

4. **Step 3: Pick a Theme**
   - Select one of the available themes (e.g., "Neon City" or "Sunset Rooftop").
   - Click "Next: Attire".

5. **Step 4: Select Attire**
   - Choose an outfit style for the avatar (e.g., "Streetwear").
   - Review the Video Summary to ensure all details are correct.
   - Click "Generate Music Video".

6. **Step 5: Review the Result**
   - **Expected Output:** A progress bar will show the rendering stages. Once complete, a video player will appear.
   - Play the video. Verify that:
     - The audio plays correctly.
     - The background matches the selected theme.
     - The avatar (or silhouette) is present and gently sways.
     - The lyrics (if provided) appear as captions synced roughly to the audio duration.
     - The visualizer bars react to the simulated audio intensity.
   - Click "Download Video" to verify the WebM file downloads correctly.
   - Verify the video appears in the "Previous Videos" sidebar.

### Known Limitations
- **Video Generation Speed:** Generating long videos (e.g., full 3-minute songs) entirely in the browser using HTML5 Canvas and MediaRecorder can be resource-intensive and may take some time depending on the device's processing power.
- **Audio Sync:** The visualizer and lyrics are currently simulated/timed based on the overall duration, not precise beat detection or timestamped lyric files (LRC).
- **Photo Search:** The product photo search relies on predictable URL patterns (for Amazon/Reddit/YouTube) rather than a direct search API, so it may occasionally return placeholder or incorrect images if the product is obscure.
