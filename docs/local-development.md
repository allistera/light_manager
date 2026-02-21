# Local Home Assistant Development Setup

This guide walks you through running Home Assistant locally so you can develop and test the Light Manager component without deploying to a production server.

## Prerequisites

- Python 3.12+
- `pip` and `venv`
- Git

Verify your Python version:

```bash
python3 --version
```

---

## 1. Create a Python Virtual Environment

Keep Home Assistant isolated from your system Python:

```bash
python3 -m venv ~/.ha-venv
source ~/.ha-venv/bin/activate
```

---

## 2. Install Home Assistant Core

```bash
pip install homeassistant
```

> This installs the `hass` command-line tool and all HA dependencies.

---

## 3. Create a Development Config Directory

Home Assistant needs a configuration directory. Create one inside the repo so everything stays together:

```bash
mkdir -p config
```

Create a minimal `config/configuration.yaml`:

```yaml
# config/configuration.yaml
default_config:

light_manager:
```

> The `default_config:` line loads a sensible set of HA defaults. The `light_manager:` entry loads this component.

---

## 4. Symlink the Component into the Config Directory

Instead of copying files, symlink the repo's `custom_components` directory. This means edits to source files are reflected immediately without any copy step:

```bash
ln -s "$(pwd)/custom_components" config/custom_components
```

Verify the link:

```bash
ls -la config/custom_components/light_manager/
```

---

## 5. Start Home Assistant

```bash
hass -c config
```

First boot downloads dependencies and generates default config files. Wait for the line:

```
Home Assistant initialized in Xs
```

Then open [http://localhost:8123](http://localhost:8123) in your browser and complete the onboarding wizard (create a user account).

---

## 6. Reload the Component Without Restarting

Full HA restarts are slow. For most changes to `__init__.py`, use **Developer Tools → YAML → Reload Custom Integrations** in the UI, or call the service directly:

```bash
curl -X POST http://localhost:8123/api/services/homeassistant/reload_custom_templates \
  -H "Authorization: Bearer <YOUR_LONG_LIVED_TOKEN>" \
  -H "Content-Type: application/json"
```

For **frontend JavaScript changes** (`light-manager-panel.js`):

1. Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`) to bypass the cache.
2. No HA restart needed — the JS file is served as a static resource.

For changes that alter component registration (e.g. adding a new platform), a full restart is required:

```bash
# Stop with Ctrl+C, then:
hass -c config
```

---

## 7. Enable Debug Logging

Add this to `config/configuration.yaml` to get verbose output from the component:

```yaml
logger:
  default: warning
  logs:
    custom_components.light_manager: debug
```

Reload the logger without a restart:

**Developer Tools → YAML → Reload Logger Settings**

Logs appear in the terminal where `hass` is running.

---

## 8. Add Fake Light Entities for Testing

Without real smart-home hardware you need simulated lights. Add these to `config/configuration.yaml`:

```yaml
light:
  - platform: demo
```

The `demo` platform creates several pre-configured light entities that you can toggle from the HA UI to exercise the Light Manager panel.

---

## 9. Typical Development Workflow

```
Edit source file
      │
      ▼
JS change?──Yes──► Hard-refresh browser
      │
      No
      ▼
Python change?──Yes──► Reload Custom Integrations (UI or curl)
      │
      No (registration change)
      ▼
Restart: hass -c config
```

1. Edit a file in `custom_components/light_manager/`.
2. Follow the reload path above.
3. Open [http://localhost:8123/light-manager](http://localhost:8123/light-manager) to see the result.

---

## 10. Running with Docker (Alternative)

If you prefer Docker over a Python venv:

```bash
docker run -d \
  --name ha-dev \
  -p 8123:8123 \
  -v "$(pwd)/config:/config" \
  -v "$(pwd)/custom_components:/config/custom_components" \
  ghcr.io/home-assistant/home-assistant:stable
```

Logs:

```bash
docker logs -f ha-dev
```

Restart after Python changes:

```bash
docker restart ha-dev
```

---

## 11. Useful Developer Tools

| Tool | Where |
|------|-------|
| Developer Tools → States | Inspect entity states live |
| Developer Tools → Services | Call HA services manually |
| Developer Tools → Template | Test Jinja2 templates |
| Developer Tools → YAML | Reload config sections |
| Settings → Logs | View recent log output |

---

## 12. Deactivating the Environment

When you are done:

```bash
deactivate
```

To resume later:

```bash
source ~/.ha-venv/bin/activate
hass -c config
```

---

## Troubleshooting

**Component does not appear after reload**
- Check the terminal for tracebacks.
- Confirm the symlink points to the right directory: `ls -la config/custom_components/`.
- Ensure `light_manager:` is present in `configuration.yaml`.

**Port 8123 already in use**
```bash
hass -c config --port 8124
```

**Dependency errors on first run**
- Make sure the venv is activated (`source ~/.ha-venv/bin/activate`).
- Upgrade pip: `pip install --upgrade pip`.
- Retry: `pip install homeassistant`.
