"""Light Manager integration for Home Assistant."""
from __future__ import annotations

import logging
import os
import voluptuous as vol
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import websocket_api
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)
DOMAIN = "light_manager"
STORAGE_KEY = f"{DOMAIN}_groups"
STORAGE_VERSION = 1


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Light Manager component."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    await async_register_frontend_resources(hass)
    await async_register_frontend_panel(hass)
    _register_websocket_handlers(hass)
    _LOGGER.info("Light Manager integration initialized")
    return True


async def async_register_frontend_resources(hass: HomeAssistant) -> None:
    """Register frontend resources."""
    # Register static path for the JavaScript file
    integration_dir = os.path.dirname(__file__)
    await hass.http.async_register_static_paths([
        StaticPathConfig("/light_manager_static", integration_dir, cache_headers=False),
    ])
    _LOGGER.info("Registered static path for Light Manager frontend resources")


async def async_register_frontend_panel(hass: HomeAssistant) -> None:
    """Register the Light Manager frontend panel."""
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Light Manager",
        sidebar_icon="mdi:lightbulb-multiple",
        frontend_url_path="light-manager",
        config={
            "_panel_custom": {
                "name": "light-manager-panel",
                "module_url": "/light_manager_static/light-manager-panel.js?v=3",
            }
        },
        require_admin=False,
    )


def _register_websocket_handlers(hass: HomeAssistant) -> None:
    """Register WebSocket command handlers."""
    websocket_api.async_register_command(hass, ws_get_groups)
    websocket_api.async_register_command(hass, ws_save_groups)


@websocket_api.websocket_command({
    vol.Required("type"): "light_manager/get_groups",
})
@websocket_api.async_response
async def ws_get_groups(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return the stored groups."""
    store: Store = hass.data[DOMAIN]["store"]
    data = await store.async_load()
    connection.send_result(msg["id"], data if isinstance(data, list) else [])


@websocket_api.websocket_command({
    vol.Required("type"): "light_manager/save_groups",
    vol.Required("groups"): list,
})
@websocket_api.async_response
async def ws_save_groups(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Persist the groups to HA storage."""
    store: Store = hass.data[DOMAIN]["store"]
    await store.async_save(msg["groups"])
    connection.send_result(msg["id"], {"success": True})
