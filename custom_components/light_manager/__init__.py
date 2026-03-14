"""Light Manager integration for Home Assistant."""
from __future__ import annotations

import asyncio
import logging
import os

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.util import slugify

_LOGGER = logging.getLogger(__name__)
DOMAIN = "light_manager"
STORAGE_KEY = f"{DOMAIN}_groups"
SCENES_STORAGE_KEY = f"{DOMAIN}_scenes"
STORAGE_VERSION = 1

SERVICE_ACTIVATE_SCENE = "activate_scene"
SERVICE_STOP_SCENE = "stop_scene"
SERVICE_EXPORT_SCENES = "export_scenes"

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Light Manager component."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["store"] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    hass.data[DOMAIN]["scenes_store"] = Store(hass, STORAGE_VERSION, SCENES_STORAGE_KEY)
    hass.data[DOMAIN]["scene_service_map"] = {}
    hass.data[DOMAIN]["animation_tasks"] = {}
    await async_register_frontend_resources(hass)
    await async_register_frontend_panel(hass)
    _register_websocket_handlers(hass)
    _register_services(hass)
    await _async_sync_scene_services(hass)
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
                "module_url": "/light_manager_static/light-manager-panel.js?v=12",
            }
        },
        require_admin=False,
    )


def _register_websocket_handlers(hass: HomeAssistant) -> None:
    """Register WebSocket command handlers."""
    websocket_api.async_register_command(hass, ws_get_groups)
    websocket_api.async_register_command(hass, ws_save_groups)
    websocket_api.async_register_command(hass, ws_get_scenes)
    websocket_api.async_register_command(hass, ws_get_scene_services)
    websocket_api.async_register_command(hass, ws_save_scenes)


def _register_services(hass: HomeAssistant) -> None:
    """Register Light Manager services."""
    if not hass.services.has_service(DOMAIN, SERVICE_ACTIVATE_SCENE):
        async def _handle_activate_scene(call: ServiceCall) -> None:
            await _async_activate_scene_service(hass, call)

        hass.services.async_register(
            DOMAIN,
            SERVICE_ACTIVATE_SCENE,
            _handle_activate_scene,
            schema=vol.Schema(
                {
                    vol.Optional("scene_id"): str,
                    vol.Optional("scene_name"): str,
                }
            ),
        )

    if not hass.services.has_service(DOMAIN, SERVICE_EXPORT_SCENES):
        async def _handle_export_scenes(call: ServiceCall) -> None:
            await _async_export_scenes_service(hass, call)

        hass.services.async_register(
            DOMAIN,
            SERVICE_EXPORT_SCENES,
            _handle_export_scenes,
        )

    if not hass.services.has_service(DOMAIN, SERVICE_STOP_SCENE):
        async def _handle_stop_scene(call: ServiceCall) -> None:
            await _async_stop_scene_service(hass, call)

        hass.services.async_register(
            DOMAIN,
            SERVICE_STOP_SCENE,
            _handle_stop_scene,
            schema=vol.Schema(
                {
                    vol.Optional("scene_id"): str,
                    vol.Optional("scene_name"): str,
                }
            ),
        )


async def _async_load_scenes(hass: HomeAssistant) -> list[dict]:
    store: Store = hass.data[DOMAIN]["scenes_store"]
    scenes = await store.async_load()
    return scenes if isinstance(scenes, list) else []


def _get_scene_mapping(scene: dict, camel_key: str, snake_key: str) -> dict:
    """Read a scene mapping, supporting camelCase and snake_case keys."""
    value = scene.get(camel_key)
    if isinstance(value, dict):
        return value
    value = scene.get(snake_key)
    return value if isinstance(value, dict) else {}


def _build_scene_service_map(scenes: list[dict]) -> dict[str, str]:
    """Build unique, deterministic service names for each scene."""
    service_map: dict[str, str] = {}
    used_services: set[str] = set()

    for index, scene in enumerate(scenes, start=1):
        if not isinstance(scene, dict):
            continue
        scene_id_raw = scene.get("id")
        scene_id = str(scene_id_raw).strip() if scene_id_raw is not None else ""
        if not scene_id:
            continue

        base = slugify(str(scene.get("name") or "")) or slugify(scene_id) or f"scene_{index}"
        base = base.replace("-", "_")
        if not base or not base[0].isalpha():
            base = f"scene_{base}" if base else f"scene_{index}"

        candidate = f"scene_{base[:52].rstrip('_')}"
        dedupe = 2
        while candidate in used_services or candidate in {
            SERVICE_ACTIVATE_SCENE,
            SERVICE_EXPORT_SCENES,
        }:
            candidate = f"scene_{base[:44].rstrip('_')}_{dedupe}"
            dedupe += 1

        service_map[scene_id] = candidate
        used_services.add(candidate)

    return service_map


async def _async_sync_scene_services(
    hass: HomeAssistant,
    scenes: list[dict] | None = None,
) -> dict[str, str]:
    """Keep per-scene service registrations aligned with stored scenes."""
    if scenes is None:
        scenes = await _async_load_scenes(hass)

    current_map = hass.data[DOMAIN].get("scene_service_map")
    if not isinstance(current_map, dict):
        current_map = {}

    next_map = _build_scene_service_map(scenes)
    current_services = set(current_map.values())
    next_services = set(next_map.values())

    for service_name in current_services - next_services:
        if hass.services.has_service(DOMAIN, service_name):
            hass.services.async_remove(DOMAIN, service_name)

    for scene_id, service_name in next_map.items():
        already_registered = (
            current_map.get(scene_id) == service_name
            and hass.services.has_service(DOMAIN, service_name)
        )
        if already_registered:
            continue

        if hass.services.has_service(DOMAIN, service_name):
            hass.services.async_remove(DOMAIN, service_name)

        async def _handle_scene_service(
            call: ServiceCall,
            target_scene_id: str = scene_id,
        ) -> None:
            await _async_activate_scene_by_id(hass, target_scene_id)

        hass.services.async_register(
            DOMAIN,
            service_name,
            _handle_scene_service,
        )

    hass.data[DOMAIN]["scene_service_map"] = next_map
    return next_map


async def _async_activate_scene_by_id(hass: HomeAssistant, scene_id: str) -> bool:
    """Activate a scene by scene ID."""
    scenes = await _async_load_scenes(hass)
    scene = next(
        (
            s
            for s in scenes
            if isinstance(s, dict) and str(s.get("id")) == str(scene_id)
        ),
        None,
    )
    if not scene:
        _LOGGER.warning("Requested scene not found for activation: id=%s", scene_id)
        return False

    await _async_apply_scene(hass, scene)
    return True


async def _async_apply_scene(hass: HomeAssistant, scene: dict) -> None:
    """Apply a scene payload to all referenced lights."""
    light_states = _get_scene_mapping(scene, "lightStates", "light_states")
    light_overrides = _get_scene_mapping(scene, "lightOverrides", "light_overrides")
    light_animations = _get_scene_mapping(scene, "lightAnimations", "light_animations")

    all_light_ids = {
        entity_id
        for entity_id in (
            set(light_states.keys())
            | set(light_overrides.keys())
            | set(light_animations.keys())
        )
        if entity_id
    }
    if not all_light_ids:
        _LOGGER.warning("Scene '%s' has no lights to activate", scene.get("name", scene.get("id")))
        return

    for entity_id in all_light_ids:
        _cancel_animation_task(hass, entity_id)
        state = light_states.get(entity_id, {})
        if not isinstance(state, dict):
            state = {}

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
        if isinstance(override, dict) and override.get("brightness") is not None:
            service_data["brightness"] = override["brightness"]

        animation = light_animations.get(entity_id, {})
        if isinstance(animation, dict):
            if animation.get("effect"):
                service_data["effect"] = animation["effect"]
            if animation.get("transition") is not None:
                service_data["transition"] = animation["transition"]

        await hass.services.async_call("light", "turn_on", service_data, blocking=True)

        if isinstance(animation, dict):
            await _async_start_color_cycle_if_configured(hass, entity_id, animation)


def _cancel_animation_task(hass: HomeAssistant, entity_id: str) -> None:
    """Stop any existing color-cycle task for a light."""
    tasks: dict[str, asyncio.Task] = hass.data[DOMAIN].setdefault("animation_tasks", {})
    task = tasks.pop(entity_id, None)
    if task:
        task.cancel()


def _normalize_color_step(step: dict) -> dict | None:
    """Normalize a color-step payload to service-ready values."""
    if not isinstance(step, dict):
        return None

    hs_color = step.get("hs_color")
    if not (
        isinstance(hs_color, list)
        and len(hs_color) == 2
        and all(isinstance(value, (int, float)) for value in hs_color)
    ):
        return None

    normalized: dict[str, object] = {
        "hs_color": [float(hs_color[0]), float(hs_color[1])],
    }
    brightness = step.get("brightness")
    if isinstance(brightness, (int, float)):
        normalized["brightness"] = max(1, min(255, int(brightness)))
    return normalized


async def _async_start_color_cycle_if_configured(
    hass: HomeAssistant,
    entity_id: str,
    animation: dict,
) -> None:
    """Start a per-light color-cycle animation task if defined."""
    sequence = animation.get("color_sequence")
    if not isinstance(sequence, list) or len(sequence) < 2:
        return

    steps = [step for item in sequence if (step := _normalize_color_step(item)) is not None]
    if len(steps) < 2:
        return

    interval = animation.get("interval_seconds", 2)
    try:
        interval_value = float(interval)
    except (TypeError, ValueError):
        interval_value = 2.0
    interval_value = max(0.2, interval_value)
    repeat = bool(animation.get("repeat", False))

    async def _run_cycle() -> None:
        try:
            while True:
                for step in steps[1:]:
                    service_data = {
                        "entity_id": entity_id,
                        "hs_color": step["hs_color"],
                        "transition": interval_value,
                    }
                    if step.get("brightness") is not None:
                        service_data["brightness"] = step["brightness"]
                    await hass.services.async_call("light", "turn_on", service_data, blocking=True)
                    await asyncio.sleep(interval_value)
                if not repeat:
                    break
                restart_step = steps[0]
                restart_data = {
                    "entity_id": entity_id,
                    "hs_color": restart_step["hs_color"],
                    "transition": interval_value,
                }
                if restart_step.get("brightness") is not None:
                    restart_data["brightness"] = restart_step["brightness"]
                await hass.services.async_call("light", "turn_on", restart_data, blocking=True)
                await asyncio.sleep(interval_value)
        except asyncio.CancelledError:
            raise
        except Exception:  # pragma: no cover - defensive logging for runtime failures
            _LOGGER.exception("Failed running color cycle for %s", entity_id)
        finally:
            tasks: dict[str, asyncio.Task] = hass.data[DOMAIN].setdefault("animation_tasks", {})
            tasks.pop(entity_id, None)

    task = hass.async_create_task(_run_cycle())
    tasks: dict[str, asyncio.Task] = hass.data[DOMAIN].setdefault("animation_tasks", {})
    tasks[entity_id] = task


async def _async_activate_scene_service(hass: HomeAssistant, call: ServiceCall) -> None:
    """Activate a scene by ID or name via service call."""
    scene_id = call.data.get("scene_id")
    scene_name = call.data.get("scene_name")

    if scene_id:
        await _async_activate_scene_by_id(hass, scene_id)
        return

    scenes = await _async_load_scenes(hass)
    if not scene_name:
        _LOGGER.warning("Scene activation called without scene_id or scene_name")
        return

    scene = next(
        (
            s
            for s in scenes
            if isinstance(s, dict) and str(s.get("name")) == str(scene_name)
        ),
        None,
    )
    if not scene:
        _LOGGER.warning(
            "Requested scene not found for activation: id=%s name=%s",
            scene_id,
            scene_name,
        )
        return

    await _async_apply_scene(hass, scene)


def _resolve_scene_by_reference(
    scenes: list[dict],
    scene_id: str | None,
    scene_name: str | None,
) -> dict | None:
    """Return the first scene matching an ID or name reference."""
    if scene_id:
        return next(
            (
                scene
                for scene in scenes
                if isinstance(scene, dict) and str(scene.get("id")) == str(scene_id)
            ),
            None,
        )

    if scene_name:
        return next(
            (
                scene
                for scene in scenes
                if isinstance(scene, dict) and str(scene.get("name")) == str(scene_name)
            ),
            None,
        )

    return None


async def _async_stop_scene_service(hass: HomeAssistant, call: ServiceCall) -> None:
    """Stop running light animations for a scene (or all managed lights)."""
    scene_id = call.data.get("scene_id")
    scene_name = call.data.get("scene_name")

    if scene_id or scene_name:
        scenes = await _async_load_scenes(hass)
        scene = _resolve_scene_by_reference(scenes, scene_id, scene_name)
        if not scene:
            _LOGGER.warning(
                "Requested scene not found for stop: id=%s name=%s",
                scene_id,
                scene_name,
            )
            return

        light_states = _get_scene_mapping(scene, "lightStates", "light_states")
        light_overrides = _get_scene_mapping(scene, "lightOverrides", "light_overrides")
        light_animations = _get_scene_mapping(scene, "lightAnimations", "light_animations")
        scene_light_ids = {
            entity_id
            for entity_id in (
                set(light_states.keys())
                | set(light_overrides.keys())
                | set(light_animations.keys())
            )
            if entity_id
        }
    else:
        tasks: dict[str, asyncio.Task] = hass.data[DOMAIN].setdefault("animation_tasks", {})
        scene_light_ids = set(tasks.keys())

    for entity_id in scene_light_ids:
        _cancel_animation_task(hass, entity_id)


async def _async_export_scenes_service(hass: HomeAssistant, call: ServiceCall) -> None:
    """Log export payload for automation/dashboard usage."""
    scenes = await _async_load_scenes(hass)
    scene_service_map = await _async_sync_scene_services(hass, scenes=scenes)
    export_payload = [
        {
            "name": scene.get("name"),
            "scene_id": scene.get("id"),
            "service": (
                f"{DOMAIN}.{scene_service_map.get(str(scene.get('id')), SERVICE_ACTIVATE_SCENE)}"
            ),
            "service_data": (
                {}
                if scene_service_map.get(str(scene.get("id")))
                else {"scene_id": scene.get("id")}
            ),
            "fallback_service": f"{DOMAIN}.{SERVICE_ACTIVATE_SCENE}",
            "fallback_service_data": {"scene_id": scene.get("id")},
        }
        for scene in scenes
        if isinstance(scene, dict) and scene.get("id")
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
    vol.Required("type"): "light_manager/get_scene_services",
})
@websocket_api.async_response
async def ws_get_scene_services(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return the generated per-scene service names."""
    scene_services = await _async_sync_scene_services(hass)
    connection.send_result(msg["id"], scene_services)


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
    await _async_sync_scene_services(hass, scenes=msg["scenes"])
    connection.send_result(msg["id"], {"success": True})
