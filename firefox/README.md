# Crunchy Filler - Firefox Extension

Firefox-compatible version of the Crunchy Filler extension for marking anime filler episodes on Crunchyroll.

## Features

- **Filler Episode Detection**: Automatically marks filler episodes with visual indicators
- **Episode Categories**: 
  - Yellow circle: Regular filler episodes (safe to skip)
  - Blue star: Mixed canon/filler episodes (contains both story and filler content)
  - Red heart: Fan favorite episodes (community-recommended filler worth watching)
- **Badge Counter**: Shows the number of filler episodes on the extension icon
- **Real-time Updates**: Works with dynamically loaded content on Crunchyroll

## Installation

### For Development/Testing:

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" on the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `firefox` folder and select the `manifest.json` file
5. The extension will be loaded temporarily (until Firefox restart)

### For Permanent Installation:

1. Package the extension as a .xpi file or submit to Firefox Add-ons store
2. Install through Firefox Add-ons manager

## Changes from Chrome Version

This Firefox extension has been adapted from the Chrome version with the following key changes:

### Manifest Changes:
- Updated to Manifest V2 (Firefox standard)
- Changed `action` to `browser_action`
- Removed `offscreen` permission (not needed in Firefox)
- Simplified `web_accessible_resources` format

### API Changes:
- Replaced `chrome.*` APIs with `browser.*` APIs throughout
- Updated background script to use persistent: false for better performance
- Removed offscreen document usage (integrated HTML parsing into background script)
- Updated badge management to use `browser.browserAction` instead of `chrome.action`

### Background Script:
- Integrated HTML parsing directly into background script
- Removed dependency on offscreen documents
- Maintained all functionality while simplifying architecture

## Supported Sites

- Crunchyroll (https://www.crunchyroll.com/series/*)

## Data Sources

- Anime filler data from AnimeFillerList.com
- Fan favorite episode recommendations from community curation

## Privacy

This extension:
- Only runs on Crunchyroll pages
- Fetches filler data from AnimeFillerList.com
- Does not collect or transmit user data
- Stores minimal data locally for performance

## Support

For issues or questions, contact: tejtipabari99@gmail.com

## License

This project maintains the same license as the original Chrome extension.
