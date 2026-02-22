"""Light Manager integration for Home Assistant."""
from __future__ import annotations

import logging
import os

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)
DOMAIN = "light_manager"
STORAGE_KEY = f"{DOMAIN}_groups"
SCENES_STORAGE_KEY = f"{DOMAIN}_scenes"
STORAGE_VERSION = 1

SERVICE_ACTIVATE_SCENE = "activate_scene"
SERVICE_EXPORT_SCENES = "export_scenes"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Light Manager component."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    hass.data[DOMAIN]["scenes_store"] = Store(hass, STORAGE_VERSION, SCENES_STORAGE_KEY)
    await async_register_frontend_resources(hass)
    await async_register_frontend_panel(hass)
    _register_websocket_handlers(hass)
    _register_services(hass)
    _LOGGER.info("Light Manager integration initialized")
    return True


async def async_register_frontend_resources(hass: HomeAssistant) -> None:
    """Register frontend resources."""
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
                "module_url": "/light_manager_static/light-manager-panel.js?v=8",
            }
        },
        require_admin=False,
    )


def _register_websocket_handlers(hass: HomeAssistant) -> None:
    """Register WebSocket command handlers."""
    websocket_api.async_register_command(hass, ws_get_groups)
    websocket_api.async_register_command(hass, ws_save_groups)
    websocket_api.async_register_command(hass, ws_get_scenes)
    websocket_api.async_register_command(hass, ws_save_scenes)


def _register_services(hass: HomeAssistant) -> None:
    """Register Light Manager services."""
    if not hass.services.has_service(DOMAIN, SERVICE_ACTIVATE_SCENE):
        hass.services.async_register(
            DOMAIN,
            SERVICE_ACTIVATE_SCENE,
            lambda call: hass.async_create_task(_async_activate_scene_service(hass, call)),
            schema=vol.Schema(
                {
                    vol.Optional("scene_id"): str,
                    vol.Optional("scene_name"): str,
                }
            ),
        )

    if not hass.services.has_service(DOMAIN, SERVICE_EXPORT_SCENES):
        hass.services.async_register(
            DOMAIN,
            SERVICE_EXPORT_SCENES,
            lambda call: hass.async_create_task(_async_export_scenes_service(hass, call)),
        )


async def _async_load_scenes(hass: HomeAssistant) -> list[dict]:
    store: Store = hass.data[DOMAIN]["scenes_store"]
    scenes = await store.async_load()
    return scenes if isinstance(scenes, list) else []


async def _async_activate_scene_service(hass: HomeAssistant, call: ServiceCall) -> None:
    """Activate a scene by ID or name via service call."""
    scenes = await _async_load_scenes(hass)
    scene_id = call.data.get("scene_id")
    scene_name = call.data.get("scene_name")

    scene = None
    if scene_id:
        scene = next((s for s in scenes if s.get("id") == scene_id), None)
    elif scene_name:
        scene = next((s for s in scenes if s.get("name") == scene_name), None)

    if not scene:
        _LOGGER.warning("Requested scene not found for activation: id=%s name=%s", scene_id, scene_name)
        return

    light_states = scene.get("lightStates", {})
    light_overrides = scene.get("lightOverrides", {})

    all_light_ids = set(light_states.keys()) | set(light_overrides.keys())
    if not all_light_ids:
        _LOGGER.warning("Scene '%s' has no lights to activate", scene.get("name", scene.get("id")))
        return

    for entity_id in all_light_ids:
        state = light_states.get(entity_id, {})
        if state.get("state") == "off":
            await hass.services.async_call(
                "light",
                "turn_off",
                {"entity_id": entity_id},
                blocking=True,
            )
            continue

        service_data = {"entity_id": entity_id}
        if state.get("brightness") is not None:
            service_data["brightness"] = state["brightness"]
        if state.get("color_temp") is not None:
            service_data["color_temp"] = state["color_temp"]
        if state.get("hs_color") is not None:
            service_data["hs_color"] = state["hs_color"]

        override = light_overrides.get(entity_id, {})
        if override.get("brightness") is not None:
            service_data["brightness"] = override["brightness"]

        animation = scene.get("lightAnimations", {}).get(entity_id, {})
        if animation.get("effect"):
            service_data["effect"] = animation["effect"]
        if animation.get("transition") is not None:
            service_data["transition"] = animation["transition"]

        await hass.services.async_call("light", "turn_on", service_data, blocking=True)


async def _async_export_scenes_service(hass: HomeAssistant, call: ServiceCall) -> None:
    """Log export payload for automation/dashboard usage."""
    scenes = await _async_load_scenes(hass)
    export_payload = [
        {
            "name": scene.get("name"),
            "scene_id": scene.get("id"),
            "service": f"{DOMAIN}.{SERVICE_ACTIVATE_SCENE}",
            "service_data": {"scene_id": scene.get("id")},
        }
        for scene in scenes
        if scene.get("id")
    ]
    _LOGGER.info("Light Manager scene export: %s", export_payload)


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


@websocket_api.websocket_command({
    vol.Required("type"): "light_manager/get_scenes",
})
@websocket_api.async_response
async def ws_get_scenes(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return the stored scenes."""
    data = await _async_load_scenes(hass)
    connection.send_result(msg["id"], data)


@websocket_api.websocket_command({
    vol.Required("type"): "light_manager/save_scenes",
    vol.Required("scenes"): list,
})
@websocket_api.async_response
async def ws_save_scenes(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Persist the scenes to HA storage."""
    store: Store = hass.data[DOMAIN]["scenes_store"]
    await store.async_save(msg["scenes"])
    connection.send_result(msg["id"], {"success": True})
