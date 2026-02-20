"""Light Manager integration for Home Assistant."""
from __future__ import annotations

import logging
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import async_register_built_in_panel

_LOGGER = logging.getLogger(__name__)
DOMAIN = "light_manager"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Light Manager component."""
    await async_register_frontend_panel(hass)
    _LOGGER.info("Light Manager integration initialized")
    return True


async def async_register_frontend_panel(hass: HomeAssistant) -> None:
    """Register the Light Manager frontend panel."""
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title="Light Manager",
        sidebar_icon="mdi:lightbulb-multiple",
        frontend_url_path="light-manager",
        config={
            "_panel_custom": {
                "name": "light-manager-panel",
                "module_url": f"/hacsfiles/{DOMAIN}/light-manager-panel.js",
            }
        },
        require_admin=False,
    )
