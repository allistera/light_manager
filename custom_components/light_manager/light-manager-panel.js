import { LitElement, html, css } from "https://unpkg.com/lit@3?module";

class LightManagerPanel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    route: { type: Object },
    panel: { type: Object },
    _lights: { state: true },
    _groups: { state: true },
    _scenes: { state: true },
    _activeTab: { state: true },
    _newGroupName: { state: true },
    _showCreateGroup: { state: true },
    _addingLightToGroup: { state: true },
    _editingGroupId: { state: true },
    _editingGroupName: { state: true },
    _pickerValue: { state: true },
    _newSceneName: { state: true },
    _showCreateScene: { state: true },
    _addingGroupToScene: { state: true },
    _editingSceneId: { state: true },
    _editingSceneName: { state: true },
    _activatingSceneId: { state: true },
    _editingAnimationSceneId: { state: true },
    _exportedSceneId: { state: true },
    _sceneServices: { state: true },
  };

  constructor() {
    super();
    this._lights = [];
    this._groups = [];
    this._scenes = [];
    this._groupsLoaded = false;
    this._scenesLoaded = false;
    this._activeTab = "groups";
    this._newGroupName = "";
    this._showCreateGroup = false;
    this._addingLightToGroup = null;
    this._editingGroupId = null;
    this._editingGroupName = "";
    this._pickerValue = "";
    this._newSceneName = "";
    this._showCreateScene = false;
    this._addingGroupToScene = null;
    this._editingSceneId = null;
    this._editingSceneName = "";
    this._activatingSceneId = null;
    this._editingAnimationSceneId = null;
    this._exportedSceneId = null;
    this._sceneServices = {};
    this._sceneServicesLoaded = false;
  }

  static styles = css`
    :host {
      display: block;
      padding: 12px;
      background: var(--primary-background-color);
      min-height: 100%;
      box-sizing: border-box;
    }

    .panel-shell {
      max-width: 1120px;
      width: 100%;
      margin: 0 auto;
    }

    .header {
      font-size: 1.55em;
      font-weight: 500;
      margin-bottom: 16px;
      color: var(--primary-text-color);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      border-bottom: 2px solid var(--divider-color);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .tab {
      padding: 9px 14px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      color: var(--secondary-text-color);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.2s, border-color 0.2s;
      white-space: nowrap;
    }

    .tab:hover {
      color: var(--primary-text-color);
    }

    .tab.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: var(--secondary-text-color);
      background: var(--card-background-color);
      border-radius: 8px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .empty-state-icon {
      font-size: 4em;
      margin-bottom: 16px;
      opacity: 0.3;
    }

    /* Groups/Scenes toolbar */
    .groups-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }

    /* Buttons */
    button {
      padding: 8px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: background 0.2s, opacity 0.2s;
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
    }

    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    .btn-secondary {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
    }

    .btn-secondary:hover {
      background: var(--divider-color);
    }

    .btn-danger {
      background: var(--error-color, #db4437);
      color: white;
    }

    .btn-icon {
      background: transparent;
      border: none;
      padding: 4px 8px;
      font-size: 1em;
      cursor: pointer;
      border-radius: 4px;
      line-height: 1;
      color: var(--secondary-text-color);
      min-width: 34px;
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
    }

    .btn-icon:hover {
      background: var(--secondary-background-color);
    }

    .btn-icon.danger:hover {
      background: var(--error-color, #db4437);
      color: white;
    }

    /* Create form */
    .create-group-form {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 12px;
      background: var(--card-background-color);
      border-radius: 8px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    input[type="text"],
    input[type="number"] {
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      flex: 1;
      min-width: 0;
    }

    input[type="text"]:focus,
    input[type="number"]:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    select {
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Group/Scene cards */
    .groups-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 100%;
    }

    .group-card {
      background: var(--card-background-color);
      border-radius: 10px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      overflow: hidden;
    }

    .group-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: var(--table-header-background-color, var(--secondary-background-color));
      border-bottom: 1px solid var(--divider-color);
      gap: 8px;
      flex-wrap: wrap;
    }

    .group-name {
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .group-actions {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .group-lights {
      padding: 0;
    }

    .group-light-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--divider-color);
    }

    .group-light-row:last-child {
      border-bottom: none;
    }

    .light-name {
      flex: 1;
      color: var(--primary-text-color);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .light-state {
      font-size: 0.9em;
      font-weight: 500;
      text-transform: capitalize;
      min-width: 32px;
      text-align: right;
    }

    .no-lights-msg {
      padding: 16px;
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 0.9em;
    }

    .group-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      flex-wrap: wrap;
    }

    .edit-input {
      flex: 1;
    }

    .remove-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1.2em;
      color: var(--secondary-text-color);
      padding: 0 4px;
      line-height: 1;
      border-radius: 3px;
      width: 30px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
    }

    .remove-btn:hover {
      background: var(--error-color, #db4437);
      color: white;
    }

    .add-light-select {
      flex: 1;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
    }

    .btn-activate {
      background: var(--success-color, #4caf50);
      color: white;
      padding: 8px 20px;
      font-weight: 600;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 0.9em;
      transition: filter 0.2s, opacity 0.2s;
    }

    .btn-activate:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    .btn-activate:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .state-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin: 0 1px;
      vertical-align: middle;
      border: 1px solid rgba(0, 0, 0, 0.15);
    }

    .state-dot-off {
      background: var(--divider-color, #e0e0e0);
    }

    .scene-lights-preview {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      flex-wrap: wrap;
      min-width: 0;
      flex: 1;
    }

    .capture-hint {
      font-size: 0.8em;
      color: var(--warning-color, #ff9800);
      font-style: italic;
    }

    .animation-editor {
      padding: 10px 12px;
      border-top: 1px solid var(--divider-color);
      background: var(--primary-background-color);
    }

    .animation-editor-title {
      font-size: 0.9em;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--primary-text-color);
    }

    .animation-row {
      display: grid;
      grid-template-columns: minmax(130px, 1fr) minmax(180px, 1.1fr) minmax(130px, 0.8fr) minmax(130px, 0.8fr);
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .animation-row:last-child {
      margin-bottom: 0;
    }

    .animation-light-name {
      font-size: 0.9em;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-bottom: 7px;
    }

    .animation-control {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .control-label {
      font-size: 0.75em;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .scene-summary {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-right: auto;
    }

    .scene-config-pill {
      font-size: 0.78em;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      opacity: 0.9;
    }

    .scene-service-hint {
      font-size: 0.78em;
      color: var(--secondary-text-color);
    }

    .scene-service-hint code {
      font-family: var(--code-font-family, monospace);
      font-size: 0.95em;
      background: var(--secondary-background-color);
      padding: 1px 4px;
      border-radius: 4px;
      color: var(--primary-text-color);
      word-break: break-all;
    }

    .animation-empty {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      font-style: italic;
    }

    .preview-meta {
      font-size: 0.8em;
      margin-right: 4px;
    }

    .preview-live {
      font-size: 0.78em;
      color: var(--secondary-text-color);
      opacity: 0.9;
      white-space: nowrap;
    }

    .export-hint {
      display: block;
      margin-top: 8px;
      font-size: 0.8em;
      color: var(--success-color, #4caf50);
    }

    @media (max-width: 900px) {
      :host {
        padding: 10px;
      }

      .header {
        font-size: 1.4em;
        margin-bottom: 12px;
      }

      .animation-row {
        grid-template-columns: 1fr;
        align-items: stretch;
      }

      .animation-light-name {
        padding-bottom: 0;
      }

      .group-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .group-footer .btn-activate {
        width: 100%;
      }

      .group-footer .scene-summary {
        width: 100%;
        margin-right: 0;
      }
    }

    @media (max-width: 640px) {
      :host {
        padding: 8px;
      }

      .header {
        font-size: 1.25em;
      }

      .tab {
        padding: 9px 10px;
        font-size: 0.85em;
      }

      .groups-toolbar {
        justify-content: stretch;
      }

      .groups-toolbar .btn-primary {
        width: 100%;
      }

      .create-group-form input,
      .create-group-form select,
      .create-group-form button {
        flex: 1 1 100%;
      }

      .group-card-header {
        padding: 8px 10px;
      }

      .group-light-row {
        padding: 8px 10px;
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .light-name {
        width: 100%;
      }

      .light-state {
        min-width: 0;
        text-align: left;
      }

      .scene-lights-preview {
        flex-basis: 100%;
      }

      .remove-btn {
        margin-left: auto;
      }

      .group-footer {
        padding: 8px 10px;
      }

      .group-footer > * {
        flex: 1 1 100%;
      }
    }
  `;

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("hass")) {
      this._updateLights();
      if (this.hass && !this._groupsLoaded) {
        this._loadGroupsFromHA();
      }
      if (this.hass && !this._scenesLoaded) {
        this._loadScenesFromHA();
      }
      if (this.hass && !this._sceneServicesLoaded) {
        this._loadSceneServicesFromHA();
      }
    }
  }

  _updateLights() {
    if (!this.hass) return;

    const lights = Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith("light."))
      .map(entityId => ({
        entityId,
        name: this.hass.states[entityId].attributes.friendly_name || entityId,
        state: this.hass.states[entityId].state,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    this._lights = lights;
  }

  // ── Groups ──────────────────────────────────────────────────────────────

  async _loadGroupsFromHA() {
    if (!this.hass || this._groupsLoaded) return;
    try {
      let groups = await this.hass.connection.sendMessagePromise({
        type: "light_manager/get_groups",
      });
      this._groups = Array.isArray(groups) ? groups : [];
      this._groupsLoaded = true;
    } catch (err) {
      console.error("Light Manager: failed to load groups from HA", err);
      this._groups = [];
      this._groupsLoaded = true;
    }
  }

  _saveGroupsToHA() {
    if (!this.hass) return;
    this.hass.connection.sendMessagePromise({
      type: "light_manager/save_groups",
      groups: this._groups,
    }).catch(err => {
      console.error("Light Manager: failed to save groups to HA", err);
    });
  }

  _createGroup() {
    const name = this._newGroupName.trim();
    if (!name) return;
    const newGroup = {
      id: Date.now().toString(),
      name,
      lightIds: [],
    };
    this._groups = [...this._groups, newGroup];
    this._saveGroupsToHA();
    this._newGroupName = "";
    this._showCreateGroup = false;
  }

  _deleteGroup(groupId) {
    this._groups = this._groups.filter(g => g.id !== groupId);
    this._saveGroupsToHA();
  }

  _addLightToGroup(groupId, entityId) {
    if (!entityId) return;
    this._groups = this._groups.map(g =>
      g.id === groupId && !g.lightIds.includes(entityId)
        ? { ...g, lightIds: [...g.lightIds, entityId] }
        : g
    );
    this._saveGroupsToHA();
    this._pickerValue = "";
  }

  _removeLightFromGroup(groupId, entityId) {
    this._groups = this._groups.map(g =>
      g.id === groupId
        ? { ...g, lightIds: g.lightIds.filter(id => id !== entityId) }
        : g
    );
    this._saveGroupsToHA();
  }

  _startEditGroup(group) {
    this._editingGroupId = group.id;
    this._editingGroupName = group.name;
  }

  _saveEditGroup(groupId) {
    const name = this._editingGroupName.trim();
    if (!name) return;
    this._groups = this._groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    );
    this._saveGroupsToHA();
    this._editingGroupId = null;
  }

  _cancelEdit() {
    this._editingGroupId = null;
    this._editingGroupName = "";
  }

  // ── Scenes ──────────────────────────────────────────────────────────────

  async _loadScenesFromHA() {
    if (!this.hass || this._scenesLoaded) return;
    try {
      let scenes = await this.hass.connection.sendMessagePromise({
        type: "light_manager/get_scenes",
      });
      this._scenes = Array.isArray(scenes) ? scenes.map(scene => this._normalizeScene(scene)) : [];
      this._scenesLoaded = true;
      this._loadSceneServicesFromHA();
    } catch (err) {
      console.error("Light Manager: failed to load scenes from HA", err);
      this._scenes = [];
      this._scenesLoaded = true;
    }
  }

  async _loadSceneServicesFromHA() {
    if (!this.hass) return;
    try {
      const services = await this.hass.connection.sendMessagePromise({
        type: "light_manager/get_scene_services",
      });
      this._sceneServices = services && typeof services === "object" ? services : {};
      this._sceneServicesLoaded = true;
    } catch (err) {
      console.error("Light Manager: failed to load scene services from HA", err);
      this._sceneServices = {};
      this._sceneServicesLoaded = true;
    }
  }

  _saveScenesToHA() {
    if (!this.hass) return;
    this.hass.connection.sendMessagePromise({
      type: "light_manager/save_scenes",
      scenes: this._scenes,
    }).then(() => {
      this._loadSceneServicesFromHA();
    }).catch(err => {
      console.error("Light Manager: failed to save scenes to HA", err);
    });
  }

  _createScene() {
    const name = this._newSceneName.trim();
    if (!name) return;
    const newScene = {
      id: Date.now().toString(),
      name,
      groupIds: [],
      lightStates: {},
      lightAnimations: {},
      lightOverrides: {},
    };
    this._scenes = [...this._scenes, newScene];
    this._saveScenesToHA();
    this._newSceneName = "";
    this._showCreateScene = false;
  }

  _deleteScene(sceneId) {
    this._scenes = this._scenes.filter(s => s.id !== sceneId);
    this._saveScenesToHA();
  }

  _addGroupToScene(sceneId, groupId) {
    if (!groupId) return;
    this._scenes = this._scenes.map(s =>
      s.id === sceneId && !s.groupIds.includes(groupId)
        ? { ...s, groupIds: [...s.groupIds, groupId] }
        : s
    );
    this._saveScenesToHA();
  }

  _removeGroupFromScene(sceneId, groupId) {
    this._scenes = this._scenes.map(s =>
      s.id === sceneId
        ? { ...s, groupIds: s.groupIds.filter(id => id !== groupId) }
        : s
    );
    this._saveScenesToHA();
  }

  _startEditScene(scene) {
    this._editingSceneId = scene.id;
    this._editingSceneName = scene.name;
  }

  _saveEditScene(sceneId) {
    const name = this._editingSceneName.trim();
    if (!name) return;
    this._scenes = this._scenes.map(s =>
      s.id === sceneId ? { ...s, name } : s
    );
    this._saveScenesToHA();
    this._editingSceneId = null;
  }

  _cancelEditScene() {
    this._editingSceneId = null;
    this._editingSceneName = "";
  }

  // Capture current HA light states for every light across all groups in the scene
  _captureSceneState(sceneId) {
    const scene = this._scenes.find(s => s.id === sceneId);
    if (!scene || !this.hass) return;

    const lightIds = new Set();
    scene.groupIds.forEach(groupId => {
      const group = this._groups.find(g => g.id === groupId);
      if (group) group.lightIds.forEach(id => lightIds.add(id));
    });

    const lightStates = {};
    lightIds.forEach(entityId => {
      const entityState = this.hass.states[entityId];
      if (!entityState) return;
      const captured = { state: entityState.state };
      if (entityState.state === "on") {
        const attrs = entityState.attributes;
        if (attrs.brightness != null) captured.brightness = attrs.brightness;
        if (attrs.color_temp != null) captured.color_temp = attrs.color_temp;
        if (attrs.hs_color != null) captured.hs_color = attrs.hs_color;
        if (attrs.color_mode != null) captured.color_mode = attrs.color_mode;
      }
      lightStates[entityId] = captured;
    });

    this._scenes = this._scenes.map(s => {
      if (s.id !== sceneId) return s;
      const existingAnimations = s.lightAnimations || {};
      const syncedAnimations = {};
      Object.keys(lightStates).forEach(entityId => {
        if (existingAnimations[entityId]) {
          syncedAnimations[entityId] = existingAnimations[entityId];
        }
      });
      const existingOverrides = s.lightOverrides || {};
      const syncedOverrides = {};
      Object.keys(lightStates).forEach(entityId => {
        if (existingOverrides[entityId]) {
          syncedOverrides[entityId] = existingOverrides[entityId];
        }
      });
      return { ...s, lightStates, lightAnimations: syncedAnimations, lightOverrides: syncedOverrides };
    });
    this._saveScenesToHA();
  }

  _normalizeScene(scene) {
    return {
      ...scene,
      groupIds: Array.isArray(scene.groupIds) ? scene.groupIds : [],
      lightStates: scene.lightStates || {},
      lightAnimations: scene.lightAnimations || {},
      lightOverrides: scene.lightOverrides || {},
    };
  }

  _getSceneLightIds(scene) {
    const sceneLightIds = new Set();
    scene.groupIds.forEach(groupId => {
      const group = this._groups.find(g => g.id === groupId);
      if (group) {
        group.lightIds.forEach(lightId => sceneLightIds.add(lightId));
      }
    });
    return [...sceneLightIds];
  }

  _getConfiguredSceneLightIds(scene) {
    const lightStates = scene.lightStates || {};
    const lightOverrides = scene.lightOverrides || {};
    const lightAnimations = scene.lightAnimations || {};
    return [...new Set([
      ...Object.keys(lightStates),
      ...Object.keys(lightOverrides),
      ...Object.keys(lightAnimations),
    ])];
  }

  _getSceneServiceName(sceneId) {
    return this._sceneServices?.[sceneId] || null;
  }

  _getLightAnimationOptions(entityId) {
    const entityState = this.hass?.states?.[entityId];
    const effectList = entityState?.attributes?.effect_list;
    return Array.isArray(effectList) ? effectList : [];
  }

  _updateLightAnimation(sceneId, entityId, field, value) {
    this._scenes = this._scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const currentAnimations = scene.lightAnimations || {};
      const currentAnimation = currentAnimations[entityId] || {};
      const nextAnimation = { ...currentAnimation, [field]: value };

      const transitionValue = Number(nextAnimation.transition);
      if (nextAnimation.transition == null || nextAnimation.transition === "" || !Number.isFinite(transitionValue) || transitionValue <= 0) {
        delete nextAnimation.transition;
      } else {
        nextAnimation.transition = transitionValue;
      }

      if (!nextAnimation.effect) {
        delete nextAnimation.effect;
      }

      const nextAnimations = { ...currentAnimations };
      if (Object.keys(nextAnimation).length === 0) {
        delete nextAnimations[entityId];
      } else {
        nextAnimations[entityId] = nextAnimation;
      }
      return { ...scene, lightAnimations: nextAnimations };
    });
    this._saveScenesToHA();
  }

  _updateLightOverrideBrightness(sceneId, entityId, value) {
    this._scenes = this._scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const currentOverrides = scene.lightOverrides || {};
      const current = currentOverrides[entityId] || {};
      const nextValue = Number(value);
      const next = { ...current };

      if (!Number.isFinite(nextValue) || nextValue < 1 || nextValue > 100) {
        delete next.brightness;
      } else {
        next.brightness = Math.round(nextValue / 100 * 255);
      }

      const updated = { ...currentOverrides };
      if (Object.keys(next).length === 0) {
        delete updated[entityId];
      } else {
        updated[entityId] = next;
      }
      return { ...scene, lightOverrides: updated };
    });
    this._saveScenesToHA();
  }

  // Activate through backend service to match automation behavior exactly
  async _activateScene(sceneId) {
    const scene = this._scenes.find(s => s.id === sceneId);
    if (!scene || !this.hass) return;

    this._activatingSceneId = sceneId;
    try {
      const sceneService = this._getSceneServiceName(sceneId);
      if (sceneService) {
        await this.hass.callService("light_manager", sceneService, {});
      } else {
        await this.hass.callService("light_manager", "activate_scene", { scene_id: sceneId });
      }
    } catch (err) {
      console.error("Light Manager: failed to activate scene", err);
    } finally {
      this._activatingSceneId = null;
    }
  }

  async _copySceneExport(scene) {
    const sceneService = this._getSceneServiceName(scene.id);
    const performAction = sceneService ? `light_manager.${sceneService}` : "light_manager.activate_scene";
    const dataBlock = sceneService ? "" : `\n  data:\n    scene_id: ${scene.id}`;
    const serviceData = `type: button\ntap_action:\n  action: perform-action\n  perform_action: ${performAction}${dataBlock}\nname: ${scene.name}`;
    try {
      await navigator.clipboard.writeText(serviceData);
      this._exportedSceneId = scene.id;
      window.setTimeout(() => {
        if (this._exportedSceneId === scene.id) {
          this._exportedSceneId = null;
        }
      }, 2500);
    } catch (err) {
      console.error("Light Manager: failed to copy scene export", err);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  render() {
    return html`
      <div class="panel-shell">
        <div class="header">Light Manager</div>
        <div class="tabs">
          <button
            class="tab ${this._activeTab === "groups" ? "active" : ""}"
            @click=${() => { this._activeTab = "groups"; }}
          >Groups (${this._groups.length})</button>
          <button
            class="tab ${this._activeTab === "scenes" ? "active" : ""}"
            @click=${() => { this._activeTab = "scenes"; }}
          >Scenes (${this._scenes.length})</button>
        </div>
        ${this._activeTab === "groups" ? this._renderGroups() : this._renderScenes()}
      </div>
    `;
  }

  _renderGroups() {
    return html`
      <div class="groups-toolbar">
        <button
          class="btn-primary"
          @click=${() => { this._showCreateGroup = !this._showCreateGroup; this._newGroupName = ""; }}
        >+ Create Group</button>
      </div>

      ${this._showCreateGroup ? this._renderCreateGroupForm() : ""}

      ${this._groups.length === 0 && !this._showCreateGroup
        ? html`
            <div class="empty-state">
              <div class="empty-state-icon">💡</div>
              <div>No groups yet. Create one to organise your lights.</div>
            </div>
          `
        : html`
            <div class="groups-list">
              ${this._groups.map(group => this._renderGroup(group))}
            </div>
          `}
    `;
  }

  _renderCreateGroupForm() {
    return html`
      <div class="create-group-form">
        <input
          type="text"
          placeholder="Group name"
          .value=${this._newGroupName}
          @input=${e => { this._newGroupName = e.target.value; }}
          @keydown=${e => { if (e.key === "Enter") this._createGroup(); }}
        />
        <button class="btn-primary" @click=${this._createGroup}>Create</button>
        <button
          class="btn-secondary"
          @click=${() => { this._showCreateGroup = false; this._newGroupName = ""; }}
        >Cancel</button>
      </div>
    `;
  }

  _renderGroup(group) {
    const groupLights = group.lightIds
      .map(id => this._lights.find(l => l.entityId === id))
      .filter(Boolean);

    const isEditing = this._editingGroupId === group.id;
    const isAddingLight = this._addingLightToGroup === group.id;
    const availableLights = this._lights.filter(l => !group.lightIds.includes(l.entityId));

    return html`
      <div class="group-card">
        <div class="group-card-header">
          ${isEditing
            ? html`
                <input
                  class="edit-input"
                  type="text"
                  .value=${this._editingGroupName}
                  @input=${e => { this._editingGroupName = e.target.value; }}
                  @keydown=${e => { if (e.key === "Enter") this._saveEditGroup(group.id); }}
                />
                <button class="btn-primary" @click=${() => this._saveEditGroup(group.id)}>Save</button>
                <button class="btn-secondary" @click=${this._cancelEdit}>Cancel</button>
              `
            : html`
                <span class="group-name">${group.name}</span>
                <div class="group-actions">
                  <button
                    class="btn-icon"
                    title="Rename group"
                    @click=${() => this._startEditGroup(group)}
                  >✏️</button>
                  <button
                    class="btn-icon danger"
                    title="Delete group"
                    @click=${() => this._deleteGroup(group.id)}
                  >🗑️</button>
                </div>
              `}
        </div>

        <div class="group-lights">
          ${groupLights.length === 0
            ? html`<div class="no-lights-msg">No lights in this group yet.</div>`
            : groupLights.map(
                light => html`
                  <div class="group-light-row">
                    <span class="light-name">${light.name}</span>
                    <span class="light-state ${light.state === "on" ? "state-on" : "state-off"}">
                      ${light.state}
                    </span>
                    <button
                      class="remove-btn"
                      title="Remove from group"
                      @click=${() => this._removeLightFromGroup(group.id, light.entityId)}
                    >&times;</button>
                  </div>
                `
              )}
        </div>


        <div class="group-footer">
          ${isAddingLight
            ? html`
                <select
                  class="add-light-select"
                  @change=${e => {
                    if (e.target.value) {
                      this._addLightToGroup(group.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Select a light to add...</option>
                  ${availableLights.map(light => html`
                    <option value="${light.entityId}">${light.name}</option>
                  `)}
                </select>
                <button
                  class="btn-secondary"
                  @click=${() => { this._addingLightToGroup = null; }}
                >Done</button>
              `
            : html`
                <button
                  class="btn-secondary"
                  ?disabled=${availableLights.length === 0}
                  @click=${() => { this._addingLightToGroup = group.id; }}
                >+ Add Light</button>
                ${availableLights.length === 0
                  ? html`<span style="font-size:0.85em;color:var(--secondary-text-color)">All lights are already in this group.</span>`
                  : ""}
              `}
        </div>
      </div>
    `;
  }

  _renderScenes() {
    return html`
      <div class="groups-toolbar">
        <button
          class="btn-primary"
          @click=${() => { this._showCreateScene = !this._showCreateScene; this._newSceneName = ""; }}
        >+ Create Scene</button>
      </div>

      ${this._showCreateScene ? this._renderCreateSceneForm() : ""}

      ${this._scenes.length === 0 && !this._showCreateScene
        ? html`
            <div class="empty-state">
              <div class="empty-state-icon">🎬</div>
              <div>No scenes yet. Create one to organise your groups.</div>
            </div>
          `
        : html`
            <div class="groups-list">
              ${this._scenes.map(scene => this._renderScene(scene))}
            </div>
          `}
    `;
  }

  _renderCreateSceneForm() {
    return html`
      <div class="create-group-form">
        <input
          type="text"
          placeholder="Scene name"
          .value=${this._newSceneName}
          @input=${e => { this._newSceneName = e.target.value; }}
          @keydown=${e => { if (e.key === "Enter") this._createScene(); }}
        />
        <button class="btn-primary" @click=${this._createScene}>Create</button>
        <button
          class="btn-secondary"
          @click=${() => { this._showCreateScene = false; this._newSceneName = ""; }}
        >Cancel</button>
      </div>
    `;
  }

  _renderScene(scene) {
    const sceneGroups = scene.groupIds
      .map(id => this._groups.find(g => g.id === id))
      .filter(Boolean);

    const isEditing = this._editingSceneId === scene.id;
    const isAddingGroup = this._addingGroupToScene === scene.id;
    const availableGroups = this._groups.filter(g => !scene.groupIds.includes(g.id));
    const isActivating = this._activatingSceneId === scene.id;
    const lightStates = scene.lightStates || {};
    const lightAnimations = scene.lightAnimations || {};
    const lightOverrides = scene.lightOverrides || {};
    const configuredLightIds = this._getConfiguredSceneLightIds(scene);
    const hasStates = configuredLightIds.length > 0;
    const sceneServiceName = this._getSceneServiceName(scene.id);
    const isEditingAnimations = this._editingAnimationSceneId === scene.id;
    const sceneLightIds = this._getSceneLightIds(scene);

    return html`
      <div class="group-card">
        <div class="group-card-header">
          ${isEditing
            ? html`
                <input
                  class="edit-input"
                  type="text"
                  .value=${this._editingSceneName}
                  @input=${e => { this._editingSceneName = e.target.value; }}
                  @keydown=${e => { if (e.key === "Enter") this._saveEditScene(scene.id); }}
                />
                <button class="btn-primary" @click=${() => this._saveEditScene(scene.id)}>Save</button>
                <button class="btn-secondary" @click=${this._cancelEditScene}>Cancel</button>
              `
            : html`
                <span class="group-name">${scene.name}</span>
                <div class="group-actions">
                  <button
                    class="btn-icon"
                    title="Capture current light states into this scene"
                    @click=${() => this._captureSceneState(scene.id)}
                  >📷</button>
                  <button
                    class="btn-icon"
                    title="Copy dashboard button config"
                    @click=${() => this._copySceneExport(scene)}
                  >📤</button>
                  <button
                    class="btn-icon"
                    title="Rename scene"
                    @click=${() => this._startEditScene(scene)}
                  >✏️</button>
                  <button
                    class="btn-icon"
                    title="Configure per-light scene/effect and brightness"
                    @click=${() => {
                      this._editingAnimationSceneId = isEditingAnimations ? null : scene.id;
                    }}
                  >🎛️</button>
                  <button
                    class="btn-icon danger"
                    title="Delete scene"
                    @click=${() => this._deleteScene(scene.id)}
                  >🗑️</button>
                </div>
              `}
        </div>

        <div class="group-lights">
          ${sceneGroups.length === 0
            ? html`<div class="no-lights-msg">No groups in this scene yet.</div>`
            : sceneGroups.map(
                group => html`
                  <div class="group-light-row">
                    <span class="light-name">${group.name}</span>
                    <div class="scene-lights-preview">
                      ${this._renderGroupStatePreview(group, lightStates, lightOverrides, lightAnimations)}
                    </div>
                    <button
                      class="remove-btn"
                      title="Remove from scene"
                      @click=${() => this._removeGroupFromScene(scene.id, group.id)}
                    >&times;</button>
                  </div>
                `
              )}
        </div>

        ${isEditingAnimations
          ? html`
              <div class="animation-editor">
                <div class="animation-editor-title">Per-light scene/effect, transition, and brightness</div>
                ${sceneLightIds.length === 0
                  ? html`<div class="animation-empty">Add groups and lights first to configure animation.</div>`
                  : sceneLightIds.map(entityId => {
                      const light = this._lights.find(l => l.entityId === entityId);
                      const options = this._getLightAnimationOptions(entityId);
                      const current = lightAnimations[entityId] || {};
                      const currentBrightness = lightOverrides[entityId]?.brightness;
                      const brightnessPct = currentBrightness != null ? Math.round(currentBrightness / 255 * 100) : "";
                      return html`
                        <div class="animation-row">
                          <span class="animation-light-name">${light?.name || entityId}</span>
                          <div class="animation-control">
                            <span class="control-label">Scene / effect</span>
                            <select
                              .value=${current.effect || ""}
                              @change=${e => {
                                this._updateLightAnimation(scene.id, entityId, "effect", e.target.value);
                              }}
                            >
                              <option value="">Use light default</option>
                              ${options.map(option => html`<option value="${option}">${option}</option>`)}
                            </select>
                          </div>
                          <div class="animation-control">
                            <span class="control-label">Transition (seconds)</span>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              placeholder="None"
                              .value=${current.transition != null ? String(current.transition) : ""}
                              @change=${e => {
                                this._updateLightAnimation(scene.id, entityId, "transition", e.target.value);
                              }}
                            />
                          </div>
                          <div class="animation-control">
                            <span class="control-label">Brightness (%)</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              step="1"
                              placeholder="Use captured"
                              .value=${String(brightnessPct)}
                              @change=${e => {
                                this._updateLightOverrideBrightness(scene.id, entityId, e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      `;
                    })}
                ${this._exportedSceneId === scene.id
                  ? html`<span class="export-hint">Copied dashboard button YAML to clipboard.</span>`
                  : ""}
              </div>
            `
          : ""}

        <div class="group-footer">
          <button
            class="btn-activate"
            ?disabled=${!hasStates || isActivating}
            @click=${() => this._activateScene(scene.id)}
          >${isActivating ? "Testing..." : "▶ Test Scene"}</button>
          ${!hasStates && sceneGroups.length > 0
            ? html`<span class="capture-hint">Capture states and/or configure per-light scene/effect first</span>`
            : ""}
          <div class="scene-summary">
            ${configuredLightIds.length > 0
              ? html`<span class="scene-config-pill">${configuredLightIds.length} configured</span>`
              : ""}
            ${sceneServiceName
              ? html`
                  <span class="scene-service-hint">
                    Service: <code>light_manager.${sceneServiceName}</code>
                  </span>
                `
              : ""}
          </div>
          ${isAddingGroup
            ? html`
                <select
                  @change=${e => {
                    if (e.target.value) {
                      this._addGroupToScene(scene.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Select a group...</option>
                  ${availableGroups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                </select>
                <button
                  class="btn-secondary"
                  @click=${() => { this._addingGroupToScene = null; }}
                >Done</button>
              `
            : html`
                <button
                  class="btn-secondary"
                  ?disabled=${availableGroups.length === 0}
                  @click=${() => { this._addingGroupToScene = scene.id; }}
                >+ Add Group</button>
                ${availableGroups.length === 0 && this._groups.length > 0
                  ? html`<span style="font-size:0.85em;color:var(--secondary-text-color)">All groups are already in this scene.</span>`
                  : ""}
              `}
        </div>
      </div>
    `;
  }

  // Render scene + live preview dots for lights in a group
  _renderGroupStatePreview(group, lightStates, lightOverrides = {}, lightAnimations = {}) {
    const configuredLights = group.lightIds.filter(id =>
      lightStates[id] || lightOverrides[id] || lightAnimations[id]
    );
    const liveOnCount = group.lightIds.filter(id => this.hass?.states?.[id]?.state === "on").length;

    if (configuredLights.length === 0) {
      return html`
        <span class="preview-meta">${group.lightIds.length} ${group.lightIds.length === 1 ? "light" : "lights"}</span>
        <span class="preview-live">Live ${liveOnCount}/${group.lightIds.length} on</span>
      `;
    }

    const onCount = configuredLights.filter(id => {
      const state = lightStates[id];
      return !state || state.state !== "off";
    }).length;

    return html`
      <span class="preview-meta">Scene ${onCount}/${configuredLights.length} on</span>
      <span class="preview-live">Live ${liveOnCount}/${group.lightIds.length} on</span>
      ${configuredLights.slice(0, 5).map(id => this._renderStateDot(
        lightStates[id] || { state: "on", brightness: lightOverrides[id]?.brightness }
      ))}
    `;
  }

  // Render a single colored dot representing a captured light state
  _renderStateDot(lightState) {
    if (!lightState || lightState.state === "off") {
      return html`<span class="state-dot state-dot-off" title="Off"></span>`;
    }
    let style = "";
    if (lightState.hs_color) {
      const [h, s] = lightState.hs_color;
      const l = lightState.brightness != null ? Math.round(lightState.brightness / 255 * 40 + 25) : 50;
      style = `background: hsl(${h}, ${s}%, ${l}%)`;
    } else if (lightState.color_temp) {
      // Map mireds to a warm (amber) → cool (white) hue range
      const kelvin = 1000000 / lightState.color_temp;
      const t = Math.min(1, Math.max(0, (kelvin - 2000) / 4500));
      const hue = Math.round(45 - t * 35);
      const sat = Math.round(90 - t * 85);
      const l = lightState.brightness != null ? Math.round(lightState.brightness / 255 * 30 + 40) : 60;
      style = `background: hsl(${hue}, ${sat}%, ${l}%)`;
    } else {
      const l = lightState.brightness != null ? Math.round(lightState.brightness / 255 * 40 + 30) : 60;
      style = `background: hsl(45, 70%, ${l}%)`;
    }
    const bPct = lightState.brightness != null ? Math.round(lightState.brightness / 255 * 100) : null;
    const title = bPct != null ? `On (${bPct}%)` : "On";
    return html`<span class="state-dot" style="${style}" title="${title}"></span>`;
  }
}

customElements.define("light-manager-panel", LightManagerPanel);
