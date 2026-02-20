"""Light Manager integration for Home Assistant."""
from __future__ import annotations

import logging
import os
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import async_register_built_in_panel

_LOGGER = logging.getLogger(__name__)
DOMAIN = "light_manager"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Light Manager component."""
    await async_register_frontend_resources(hass)
    await async_register_frontend_panel(hass)
    _LOGGER.info("Light Manager integration initialized")
    return True


async def async_register_frontend_resources(hass: HomeAssistant) -> None:
    """Register frontend resources."""
    # Register static path for the JavaScript file
    integration_dir = os.path.dirname(__file__)
    hass.http.register_static_path(
        f"/light_manager_static",
        integration_dir,
        cache_headers=False,
    )
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
                "module_url": "/light_manager_static/light-manager-panel.js",
            }
        },
        require_admin=False,
    )
