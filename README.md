# Light Manager for Home Assistant

A HACS-compatible custom component that displays all currently "on" lights in a sidebar panel.

## Features

- Real-time table of active lights
- Automatic updates when lights change state
- Clean integration with Home Assistant UI
- Dark and light theme support
- No configuration required
- Alphabetically sorted light names

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click "Integrations"
3. Click the three dots menu and select "Custom repositories"
4. Add this repository URL: `https://github.com/YOUR_USERNAME/light-manager`
5. Select category "Integration"
6. Click "Install"
7. Restart Home Assistant

### Manual Installation

1. Download the `custom_components/light_manager` directory from this repository
2. Copy it to your Home Assistant `custom_components` directory
3. Restart Home Assistant

## Usage

After installation and restart, "Light Manager" will appear in the sidebar with a lightbulb icon. Click it to view all lights that are currently on.

### What You'll See

- **Table View**: All lights with state "on" displayed in a clean table
- **Live Updates**: The table updates automatically when you turn lights on or off
- **Empty State**: When no lights are on, you'll see a friendly empty state message
- **Sorted**: Lights are sorted alphabetically by their friendly names

## Screenshots

*Screenshots will be added after initial release*

## Development

This component uses:

- **Backend**: Python for Home Assistant integration
- **Frontend**: Lit Element 3.x web components
- **Updates**: Event-based real-time updates via Home Assistant WebSocket API
- **Styling**: Home Assistant CSS variables for automatic theme compatibility

### Project Structure

```
light-manager/
├── custom_components/
│   └── light_manager/
│       ├── __init__.py                 # Component initialization
│       ├── manifest.json               # Component metadata
│       ├── frontend/
│       │   └── light-manager-panel.js  # Lit Element panel
│       └── translations/
│           └── en.json                 # English translations
├── hacs.json                           # HACS metadata
├── info.md                             # HACS info panel
└── README.md                           # This file
```

## Requirements

- Home Assistant 2024.1.0 or newer
- Modern web browser with JavaScript enabled

## Known Limitations

- **Read-only**: Version 1.0.0 displays lights only (no controls)
- **Basic columns**: Shows only name and state (no brightness, color, etc.)
- **All lights**: Shows all lights regardless of room/area (no grouping)

These are planned for future releases. See the roadmap below.

## Roadmap

### Version 1.1.0
- Click to toggle lights on/off
- Brightness indicator
- Color preview for RGB lights

### Version 1.2.0
- Room/area grouping
- Search and filter functionality
- Sortable table columns

### Version 2.0.0
- Configurable columns
- Historical data (how long lights have been on)
- Export functionality

## Contributing

Issues and pull requests are welcome! Please:

1. Check existing issues before creating a new one
2. Follow the existing code style
3. Test your changes with Home Assistant
4. Update documentation as needed

## Support

- **Issues**: Report bugs at the [issue tracker](https://github.com/YOUR_USERNAME/light-manager/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/YOUR_USERNAME/light-manager/discussions)
- **Home Assistant Community**: [Community forum thread](https://community.home-assistant.io/) (link TBD)

## License

MIT License - See LICENSE file for details

## Credits

Created with the Home Assistant custom component framework and Lit Element.

---

**Note**: Replace `YOUR_USERNAME` in the URLs above with your actual GitHub username before publishing.
