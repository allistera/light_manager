# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Light Manager is a Home Assistant custom component (HACS-compatible) that provides a sidebar panel UI for managing smart lights, creating light groups, and defining/activating lighting scenes with color-cycling animations.

## Commands

### Python Linting
```bash
ruff check .
```

### Local Development
```bash
python3 -m venv ~/.ha-venv
source ~/.ha-venv/bin/activate
pip install homeassistant
hass -c config          # Start HA at localhost:8123
```

See `docs/local-development.md` for symlink-based hot reload setup and demo light configuration.

## Architecture

### Stack
- **Backend:** Python 3.12+ (`custom_components/light_manager/__init__.py`) — HA integration lifecycle, WebSocket command handlers, service registration, animation tasks
- **Frontend:** Lit Element 3.x (`custom_components/light_manager/light-manager-panel.js`) — single 2400+ line web component with three tabs: Groups, Scenes, Scene Library
- **Communication:** Home Assistant WebSocket API
- **Persistence:** Home Assistant Storage API (keyed by `STORAGE_KEY`)

### Key Data Structures

**Group:** `{ id, name, lightIds[] }`

**Scene:** `{ id, name, groupIds[], lightStates{}, lightOverrides{}, lightAnimations{} }`
- `lightStates`: per-light config (on/off, brightness, color_temp, hs_color)
- `lightOverrides`: per-light overrides
- `lightAnimations`: color-cycling config (color sequences, intervals, repeat flag)

### Backend (`__init__.py`)
- `async_setup()` — registers frontend panel/resources, WebSocket handlers, services
- WebSocket handlers: `ws_get_groups`, `ws_save_groups`, `ws_get_scenes`, `ws_save_scenes`, `ws_get_scene_services`
- Services: `activate_scene`, `stop_scene`, `export_scenes`
- Animation: `_run_cycle()` async task manages per-light color cycling; active tasks stored in `hass.data[DOMAIN]["animation_tasks"]`

### Frontend (`light-manager-panel.js`)
- Single `LightManagerPanel` Lit Element class with ~20 reactive state properties
- `_lights` synced from `hass.states` (all `light.*` entities)
- Groups/scenes loaded via WebSocket on connect, saved back on every change
- Scene activation calls `light_manager/activate_scene` WebSocket command
- `_captureSceneState()` reads current HA light states to record a scene snapshot

### WebSocket Command Pattern
Frontend sends `{ type: "light_manager/<command>", ...payload }` → backend handler returns result object.

## Code Style

- Python: 100-char line length, target Python 3.12, Ruff rules E/F/I/W/UP
- JS: Lit 3.x reactive properties, HA CSS variables for theming (no external CSS framework)

## CI

GitHub Actions (`.github/workflows/lint.yml`) runs Ruff, Hassfest (HA metadata validation), and HACS validation on every PR and push to main.
