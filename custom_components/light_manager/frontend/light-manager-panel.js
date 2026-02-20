import { LitElement, html, css } from "https://unpkg.com/lit@3?module";

class LightManagerPanel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    route: { type: Object },
    panel: { type: Object },
    _lights: { state: true },
  };

  constructor() {
    super();
    this._lights = [];
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
      .filter(entityId =>
        entityId.startsWith("light.") &&
        this.hass.states[entityId].state === "on"
      )
      .map(entityId => ({
        entityId,
        name: this.hass.states[entityId].attributes.friendly_name || entityId,
        state: this.hass.states[entityId].state,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    this._lights = lights;
  }

  render() {
    return html`
      <div class="header">Light Manager</div>
      ${this._lights.length > 0
        ? html`
            <table class="light-table">
              <thead>
                <tr>
                  <th>Light Name</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                ${this._lights.map(
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
}

customElements.define("light-manager-panel", LightManagerPanel);
