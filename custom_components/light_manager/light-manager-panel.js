import { LitElement, html, css } from "https://unpkg.com/lit@3?module";

const STORAGE_KEY = "light_manager_groups";

function loadGroups() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveGroups(groups) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

class LightManagerPanel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    route: { type: Object },
    panel: { type: Object },
    _lights: { state: true },
    _groups: { state: true },
    _activeTab: { state: true },
    _newGroupName: { state: true },
    _showCreateGroup: { state: true },
    _addingLightToGroup: { state: true },
    _editingGroupId: { state: true },
    _editingGroupName: { state: true },
  };

  constructor() {
    super();
    this._lights = [];
    this._groups = loadGroups();
    this._activeTab = "lights";
    this._newGroupName = "";
    this._showCreateGroup = false;
    this._addingLightToGroup = null;
    this._editingGroupId = null;
    this._editingGroupName = "";
  }

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      background: var(--primary-background-color);
      min-height: 100vh;
    }

    .header {
      font-size: 2em;
      font-weight: 300;
      margin-bottom: 24px;
      color: var(--primary-text-color);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      border-bottom: 2px solid var(--divider-color);
    }

    .tab {
      padding: 10px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.95em;
      font-weight: 500;
      color: var(--secondary-text-color);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.2s, border-color 0.2s;
    }

    .tab:hover {
      color: var(--primary-text-color);
    }

    .tab.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    /* Lights table */
    .light-table {
      width: 100%;
      max-width: 1200px;
      border-collapse: collapse;
      background: var(--card-background-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .light-table th,
    .light-table td {
      text-align: left;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
    }

    .light-table tbody tr:last-child td {
      border-bottom: none;
    }

    .light-table th {
      background: var(--table-header-background-color, var(--secondary-background-color));
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }

    .light-table td {
      color: var(--primary-text-color);
    }

    .state-on {
      color: var(--state-icon-active-color, var(--success-color));
      font-weight: 500;
      text-transform: capitalize;
    }

    .state-off {
      color: var(--secondary-text-color);
      text-transform: capitalize;
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

    /* Groups toolbar */
    .groups-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    /* Buttons */
    button {
      padding: 8px 16px;
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
    }

    .btn-icon:hover {
      background: var(--secondary-background-color);
    }

    .btn-icon.danger:hover {
      background: var(--error-color, #db4437);
      color: white;
    }

    /* Create group form */
    .create-group-form {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 16px;
      background: var(--card-background-color);
      border-radius: 8px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      margin-bottom: 16px;
    }

    input[type="text"],
    select {
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
    select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Group cards */
    .groups-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-width: 1200px;
    }

    .group-card {
      background: var(--card-background-color);
      border-radius: 8px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      overflow: hidden;
    }

    .group-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: var(--table-header-background-color, var(--secondary-background-color));
      border-bottom: 1px solid var(--divider-color);
      gap: 8px;
    }

    .group-name {
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .group-actions {
      display: flex;
      gap: 4px;
    }

    .group-lights {
      padding: 0;
    }

    .group-light-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--divider-color);
    }

    .group-light-row:last-child {
      border-bottom: none;
    }

    .light-name {
      flex: 1;
      color: var(--primary-text-color);
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
      padding: 10px 16px;
      border-top: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
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
    }

    .remove-btn:hover {
      background: var(--error-color, #db4437);
      color: white;
    }
  `;

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("hass")) {
      this._updateLights();
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

  _saveGroups() {
    saveGroups(this._groups);
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
    this._saveGroups();
    this._newGroupName = "";
    this._showCreateGroup = false;
  }

  _deleteGroup(groupId) {
    this._groups = this._groups.filter(g => g.id !== groupId);
    this._saveGroups();
  }

  _addLightToGroup(groupId, entityId) {
    if (!entityId) return;
    this._groups = this._groups.map(g =>
      g.id === groupId && !g.lightIds.includes(entityId)
        ? { ...g, lightIds: [...g.lightIds, entityId] }
        : g
    );
    this._saveGroups();
    this._addingLightToGroup = null;
  }

  _removeLightFromGroup(groupId, entityId) {
    this._groups = this._groups.map(g =>
      g.id === groupId
        ? { ...g, lightIds: g.lightIds.filter(id => id !== entityId) }
        : g
    );
    this._saveGroups();
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
    this._saveGroups();
    this._editingGroupId = null;
  }

  _cancelEdit() {
    this._editingGroupId = null;
    this._editingGroupName = "";
  }

  render() {
    return html`
      <div class="header">Light Manager</div>
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "lights" ? "active" : ""}"
          @click=${() => { this._activeTab = "lights"; }}
        >All Lights</button>
        <button
          class="tab ${this._activeTab === "groups" ? "active" : ""}"
          @click=${() => { this._activeTab = "groups"; }}
        >Groups (${this._groups.length})</button>
      </div>
      ${this._activeTab === "lights" ? this._renderAllLights() : this._renderGroups()}
    `;
  }

  _renderAllLights() {
    const onLights = this._lights.filter(l => l.state === "on");
    return html`
      ${onLights.length > 0
        ? html`
            <table class="light-table">
              <thead>
                <tr>
                  <th>Light Name</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                ${onLights.map(
                  light => html`
                    <tr>
                      <td>${light.name}</td>
                      <td class="state-on">${light.state}</td>
                    </tr>
                  `
                )}
              </tbody>
            </table>
          `
        : html`
            <div class="empty-state">
              <div class="empty-state-icon">💡</div>
              <div>No lights are currently on</div>
            </div>
          `}
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
                  @change=${e => { this._addLightToGroup(group.id, e.target.value); e.target.value = ""; }}
                >
                  <option value="">-- Select a light to add --</option>
                  ${availableLights.map(
                    l => html`<option value=${l.entityId}>${l.name}</option>`
                  )}
                </select>
                <button
                  class="btn-secondary"
                  @click=${() => { this._addingLightToGroup = null; }}
                >Cancel</button>
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
}

customElements.define("light-manager-panel", LightManagerPanel);
