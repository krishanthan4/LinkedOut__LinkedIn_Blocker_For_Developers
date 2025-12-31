# LinkedOut

**Turn your LinkedIn distraction into coding progression.**

LinkedOut is a browser extension for developers who find themselves doomscrolling "I'm humbled to announce" posts instead of shipping code. It puts a gatekeeper on your professional networking: if you want to access LinkedIn, you have to solve a LeetCode problem first.

## The Problem
We all tell ourselves we're just going to "check notifications for 5 minutes." Fast forward 45 minutes, and you're reading a thought leadership essay about how making coffee is like scaling a Kubernetes cluster. 

## The Solution
This extension enforces a "Code to Browse" policy.
1.  **Strict Blocking**: By default, LinkedIn is inaccessible.
2.  **Earn Your Time**: Solving a LeetCode problem (any problem) unlocks LinkedIn for 1 hour.
3.  **Focus Mode**: Optionally hide just the Feed and distractions, keeping Messages and Jobs accessible.

## Features

*   **Algo-Lock**: The core feature. Detected success on LeetCode triggers an unlock.
*   **Time Windows**: Set a specific daily window where access is allowed (e.g., 6 PM - 7 PM).
*   **Settings Lock**: Once you set your goals, the settings lock themselves. To change them, you have to solve a problem. No easy way out.
*   **Grammar Helper**: A lightweight grammar checker integration for your messages and posts.

## Installation

This is an open-source extension, currently designed to be loaded in "Developer Mode" on Chromium browsers (Chrome, Brave, Edge).

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/krishanthan4/LinkedOut__LinkedIn_Blocker_For_Developers.git
    ```
2.  **Open Extensions Management**:
    *   **Chrome**: Go to `chrome://extensions`
    *   **Brave**: Go to `brave://extensions`
3.  **Enable Developer Mode**: Toggle the switch in the top right corner.
4.  **Load Unpacked**: Click the button and select the folder where you cloned this repository.

## Configuration

Click the extension icon or go to the Options page to configure:
*   **Daily Start Time**: When your optional 1-hour window begins.
*   **Timeout Action**: Choose between a full block or "Focus Mode" (only hiding the feed).
*   **Grammar API**: Optional endpoint for the grammar checker (defaults to LanguageTool's public API).

## Contributing

We welcome contributions! If you have an idea to make this tool even more rigorous (or helpful), feel free to open a PR.

### Tech Stack
*   Vanilla JavaScript (No framework bloat)
*   Chrome Extension Manifest V3

### Development
1.  Make your changes in `src/`.
2.  Reload the extension in the browser extensions page to test.

## License

[MIT](LICENSE) © 2025 R. Krishanthan
