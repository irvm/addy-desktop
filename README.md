# Addy Desktop

A lightweight Linux desktop client for [addy.io](https://addy.io) (formerly AnonAddy), built with Tauri and React.

## About addy.io

addy.io is an open-source email forwarding service that allows you to protect your real email address. It enables you to create unlimited email aliases, which forward messages to your real inbox. This protects you from spam, prevents cross-site tracking, and gives you total control over who can reach your inbox. If an alias starts receiving spam, you can simply turn it off.

## Features

This application brings addy.io functionality directly to your Linux desktop:

- **Dashboard Statistics:** View your account usage at a glance, including total aliases and email forwarding/blocking stats.
- **Alias Listing:** See your most recently created aliases and manage them directly.
- **Instant Alias Creation:** Generate new aliases with custom descriptions. Supports standard addy.io domains (anonaddy.me, anonaddy.com) and user-specific subdomains.
- **Active Status Toggle:** Easily activate or deactivate aliases with a single click.
- **Alias Management:** Move aliases to the deleted bin or use the "Forget" feature to permanently remove them.
- **Secure Local Storage:** Your API key is saved locally using a secure configuration store.
- **System Tray Integration:** A convenient tray icon allows you to show the app or quit quickly from your system panel.
- **Clean Interface:** A modern UI designed for efficiency and clarity.

## How to Get Your API Key

To connect this app to your account, you will need an API token:

1. Log in to your account at [app.addy.io](https://app.addy.io).
2. Navigate to **Settings** in the main menu.
3. Go to the **API Keys** section (or visit [app.addy.io/settings/keys](https://app.addy.io/settings/keys) directly).
4. Click on **Create New Token**.
5. Give your token a descriptive name (e.g., "Linux Desktop Client").
6. **Copy the generated token.** You will only see it once for security reasons.
7. Paste the token into the login screen when you launch the application.

## Development and Building

### Prerequisites

You will need the following installed on your system:
- **Rust** (stable)
- **Node.js** and **npm**
- **Webkit2GTK** (standard dependency for Tauri on Linux)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run tauri dev
   ```

3. Build for production:
   ```bash
   npm run tauri build
   ```

## License

This project is open-source.
