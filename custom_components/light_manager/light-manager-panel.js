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
    _activatingSceneId: { state: true },
    _stoppingSceneId: { state: true },
    _sceneServices: { state: true },
    _scenePopupSceneId: { state: true },
    _popupNewSceneName: { state: true },
    _sceneLibrarySearch: { state: true },
    _sceneLibraryPopupId: { state: true },
    _sceneLibraryColorIndex: { state: true },
    _sceneLibraryAnimationInterval: { state: true },
    _sceneLibraryAnimationRepeat: { state: true },
    _showAddSceneToGroupId: { state: true },
    _addSceneDialogStep: { state: true },
    _addSceneLibrarySelection: { state: true },
    _sceneLibraryShowGroupSelect: { state: true },
    _sceneLibrarySaveAnimated: { state: true },
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
    this._activatingSceneId = null;
    this._stoppingSceneId = null;
    this._sceneServices = {};
    this._sceneServicesLoaded = false;
    this._scenePopupSceneId = null;
    this._popupNewSceneName = "";
    this._sceneLibrarySearch = "";
    this._sceneLibraryPopupId = null;
    this._sceneLibraryColorIndex = 0;
    this._sceneLibraryAnimationInterval = 3;
    this._sceneLibraryAnimationRepeat = true;
    this._showAddSceneToGroupId = null;
    this._addSceneDialogStep = "type";
    this._addSceneLibrarySelection = null;
    this._sceneLibraryShowGroupSelect = null;
    this._sceneLibrarySaveAnimated = false;
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
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .toolbar-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--secondary-text-color);
      font-size: 0.88em;
      user-select: none;
      cursor: pointer;
    }

    .scene-group-section {
      background: var(--card-background-color);
      border-radius: 10px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      overflow: hidden;
    }

    .scene-group-section summary {
      list-style: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      background: var(--table-header-background-color, var(--secondary-background-color));
      border-bottom: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      font-weight: 600;
    }

    .scene-group-section summary::-webkit-details-marker {
      display: none;
    }

    .scene-group-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .scene-group-count {
      font-size: 0.82em;
      color: var(--secondary-text-color);
      font-weight: 500;
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



    .scene-library-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      align-items: center;
    }

    .scene-library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 10px;
    }

    .scene-library-card {
      border: none;
      border-radius: 12px;
      overflow: hidden;
      background: var(--card-background-color);
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.12));
      padding: 0;
      text-align: left;
    }

    .scene-library-thumb {
      height: 96px;
      width: 100%;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .scene-library-title {
      display: block;
      padding: 10px 12px;
      color: var(--primary-text-color);
      font-weight: 600;
      font-size: 0.95em;
    }

    .scene-library-category {
      font-size: 0.75em;
      text-transform: uppercase;
      letter-spacing: 0.11em;
      color: var(--secondary-text-color);
      margin: 8px 2px 4px;
      grid-column: 1 / -1;
      font-weight: 600;
    }

    .scene-library-popup {
      width: min(640px, 100%);
      border-radius: 18px;
      overflow: hidden;
      background: #1f2128;
      box-shadow: 0 20px 42px rgba(0, 0, 0, 0.52);
      color: #f2f4f8;
    }

    .scene-library-popup-image {
      height: 230px;
      position: relative;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
      padding: 16px;
      box-sizing: border-box;
    }

    .scene-library-popup-image::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.46), transparent 55%);
    }

    .scene-library-popup-name {
      position: relative;
      z-index: 1;
      font-size: 2em;
      margin: 0;
      color: #ffffff;
      font-weight: 700;
    }

    .scene-library-popup-close {
      position: absolute;
      top: 12px;
      right: 12px;
      color: #fff;
      z-index: 2;
    }

    .scene-library-popup-body {
      padding: 14px 16px 18px;
      background: #30333c;
    }

    .scene-library-palette {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .scene-library-color {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid transparent;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.28);
      padding: 0;
      min-width: 44px;
      min-height: 44px;
    }

    .scene-library-color.active {
      border-color: white;
      transform: scale(1.08);
    }

    .scene-library-popup-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-top: 8px;
    }

    .scene-library-popup-actions button {
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: rgba(255, 255, 255, 0.08);
      color: #f1f3f6;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-size: 0.86em;
      padding: 11px 14px;
    }

    .scene-library-popup-actions button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.16);
    }

    .scene-popup-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(8, 12, 20, 0.72);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      padding: 14px;
      box-sizing: border-box;
    }

    .scene-popup-card {
      width: min(540px, 100%);
      border-radius: 20px;
      overflow: hidden;
      background: linear-gradient(175deg, #efcc72 0%, #c79f44 34%, #26221b 84%, #151515 100%);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.42);
      color: #f8f5eb;
    }

    .scene-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 14px;
      gap: 12px;
    }

    .scene-popup-title {
      font-size: 1.35em;
      font-weight: 600;
      margin: 0;
    }

    .scene-popup-subtitle {
      margin: 4px 0 0;
      color: rgba(248, 245, 235, 0.88);
      font-size: 0.88em;
    }

    .scene-popup-close {
      border-radius: 999px;
      min-width: 36px;
      min-height: 36px;
      font-size: 1.1em;
      color: #f8f5eb;
      background: rgba(20, 20, 20, 0.28);
    }

    .scene-popup-content {
      background: rgba(18, 18, 18, 0.78);
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      padding: 14px 16px 16px;
    }

    .scene-popup-label {
      margin: 2px 0 10px;
      font-size: 0.78em;
      color: rgba(248, 245, 235, 0.72);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .scene-popup-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .scene-popup-chip {
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 5px 10px;
      font-size: 0.82em;
      color: #fff7db;
      background: rgba(255, 255, 255, 0.08);
    }

    .scene-popup-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: 8px;
    }

    .scene-popup-actions button {
      width: 100%;
      border-radius: 999px;
      padding: 9px 10px;
      background: rgba(255, 255, 255, 0.12);
      color: #f8f5eb;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.82em;
      font-weight: 600;
    }

    .scene-popup-actions button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    .scene-popup-create {
      margin-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      padding-top: 12px;
    }

    .scene-popup-create-row {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .scene-popup-create-row input {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.24);
      color: #fff7db;
      min-width: 220px;
    }

    .scene-popup-create-row input::placeholder {
      color: rgba(255, 247, 219, 0.62);
    }

    .scene-popup-create-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: 8px;
    }

    .scene-popup-create-actions button {
      width: 100%;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      color: #f8f5eb;
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-size: 0.8em;
      padding: 8px 10px;
    }

    .scene-popup-create-actions button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.16);
    }

    @media (max-width: 640px) {
      .scene-popup-actions,
      .scene-popup-create-actions {
        grid-template-columns: 1fr;
      }
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

      .scene-library-popup-image {
        height: 180px;
      }
    }

    /* New styles for Light Groups tab */
    .group-brightness-bar { display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--divider-color); }
    .group-brightness-bar input[type="range"] { flex:1; accent-color:var(--primary-color); }
    .group-section-label { font-size:0.75em; text-transform:uppercase; letter-spacing:0.1em; color:var(--secondary-text-color); font-weight:600; padding:8px 12px 4px; }
    .scene-tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:8px; padding:8px 12px; }
    .scene-tile { background:var(--secondary-background-color); border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px; }
    .scene-tile-name { font-size:0.9em; font-weight:500; color:var(--primary-text-color); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .scene-tile-actions { display:flex; gap:4px; }
    .light-toggle-btn { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:20px; padding:2px 10px; font-size:0.8em; cursor:pointer; color:var(--primary-text-color); }
    .light-toggle-btn.on { background:var(--primary-color); color:white; border-color:var(--primary-color); }
    .add-scene-dialog { width:min(480px,100%); border-radius:16px; background:var(--card-background-color); box-shadow:0 16px 40px rgba(0,0,0,0.4); overflow:hidden; color:var(--primary-text-color); }
    .add-scene-dialog-header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid var(--divider-color); }
    .add-scene-dialog-title { font-size:1.1em; font-weight:600; margin:0; }
    .add-scene-dialog-body { padding:16px 20px 20px; }
    .add-scene-type-btn { width:100%; padding:14px 16px; background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:10px; text-align:left; cursor:pointer; font-size:0.95em; color:var(--primary-text-color); display:flex; justify-content:space-between; align-items:center; }
    .add-scene-type-btn:hover { background:var(--divider-color); }
    .library-mini-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:8px; max-height:400px; overflow-y:auto; }
    .group-select-row { display:flex; flex-wrap:wrap; gap:8px; }
    .group-select-btn { padding:8px 16px; border-radius:999px; background:var(--secondary-background-color); border:1px solid var(--divider-color); cursor:pointer; font-size:0.9em; color:var(--primary-text-color); }
    .group-select-btn:hover { background:var(--primary-color); color:white; border-color:var(--primary-color); }
    .all-groups-on-btn { background:var(--success-color,#4caf50); color:white; }

    /* Scene color cards */
    .scene-tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; padding:8px 12px; }
    .scene-tile { border-radius:12px; overflow:hidden; background:var(--secondary-background-color); display:flex; flex-direction:column; cursor:default; }
    .scene-tile-swatch { height:72px; width:100%; flex-shrink:0; }
    .scene-tile-name { font-size:0.82em; font-weight:600; color:var(--primary-text-color); padding:6px 8px 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .scene-tile-actions { display:flex; gap:2px; padding:2px 4px 6px; }
    .scene-tile-actions .btn-icon { padding:2px 6px; font-size:0.85em; min-width:28px; min-height:28px; }

    /* Light cards grid */
    .light-cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px; padding:8px 12px; }
    .light-card { position:relative; background:var(--secondary-background-color); border-radius:12px; padding:12px 8px 8px; display:flex; flex-direction:column; align-items:center; gap:6px; transition:background 0.2s; }
    .light-card.on { background:color-mix(in srgb, var(--primary-color) 18%, var(--card-background-color)); }
    .light-card-icon { font-size:1.8em; line-height:1; opacity:0.7; }
    .light-card.on .light-card-icon { opacity:1; }
    .light-card-name { font-size:0.75em; font-weight:500; color:var(--primary-text-color); text-align:center; word-break:break-word; line-height:1.2; }
    .light-card-remove { position:absolute; top:4px; right:4px; background:transparent; border:none; cursor:pointer; font-size:0.85em; color:var(--secondary-text-color); line-height:1; padding:2px; border-radius:3px; width:18px; height:18px; display:flex; align-items:center; justify-content:center; }
    .light-card-remove:hover { background:var(--error-color,#db4437); color:white; }
    .light-card .light-toggle-btn { font-size:0.75em; padding:3px 10px; margin-top:auto; }
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

  _deleteScene(sceneId) {
    this._scenes = this._scenes.filter(s => s.id !== sceneId);
    this._saveScenesToHA();
  }

  // Capture current HA light states for every light across all groups in the scene
  _captureSceneState(sceneId) {
    const scene = this._scenes.find(s => s.id === sceneId);
    if (!scene || !this.hass) return;

    const lightIds = new Set();
    // Support both legacy groupIds array and new single groupId
    const groupIdList = scene.groupId
      ? [scene.groupId]
      : (scene.groupIds || []);
    groupIdList.forEach(groupId => {
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



  _getLightIdsForGroupIds(groupIds) {
    const sceneLightIds = new Set();
    groupIds.forEach(groupId => {
      const group = this._groups.find(g => g.id === groupId);
      if (group) {
        group.lightIds.forEach(lightId => sceneLightIds.add(lightId));
      }
    });
    return [...sceneLightIds];
  }

  _getLightIdsForGroup(groupId) {
    const group = this._groups.find(g => g.id === groupId);
    if (!group) return [];
    return [...group.lightIds];
  }

  _buildPresetLightStates(groupIds, presetType) {
    const lightIds = this._getLightIdsForGroupIds(groupIds);
    const lightStates = {};
    const presets = {
      relax: { brightness: 130, color_temp: 400 },
      focus: { brightness: 255, color_temp: 250 },
      night: { brightness: 45, color_temp: 454 },
    };
    const preset = presets[presetType];
    if (!preset) return lightStates;

    lightIds.forEach(entityId => {
      lightStates[entityId] = {
        state: "on",
        brightness: preset.brightness,
        color_temp: preset.color_temp,
        color_mode: "color_temp",
      };
    });
    return lightStates;
  }

  _createSceneFromPopup(baseScene, mode = "duplicate") {
    if (!baseScene) return;

    const name = this._popupNewSceneName.trim() || `${baseScene.name} ${mode === "duplicate" ? "Copy" : mode[0].toUpperCase() + mode.slice(1)}`;
    let lightStates = {};
    let lightAnimations = {};
    let lightOverrides = {};

    // Support both legacy groupIds and new groupId
    const groupIdList = baseScene.groupId
      ? [baseScene.groupId]
      : (baseScene.groupIds || []);

    if (mode === "duplicate") {
      lightStates = { ...(baseScene.lightStates || {}) };
      lightAnimations = { ...(baseScene.lightAnimations || {}) };
      lightOverrides = { ...(baseScene.lightOverrides || {}) };
    } else if (mode === "capture") {
      const sceneLightIds = this._getLightIdsForGroupIds(groupIdList);
      sceneLightIds.forEach(entityId => {
        const entityState = this.hass?.states?.[entityId];
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
    } else {
      lightStates = this._buildPresetLightStates(groupIdList, mode);
    }

    const newScene = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      groupId: groupIdList[0] || null,
      groupIds: [...groupIdList],
      lightStates,
      lightAnimations,
      lightOverrides,
    };

    this._scenes = [...this._scenes, newScene];
    this._saveScenesToHA();
    this._popupNewSceneName = "";
    this._scenePopupSceneId = newScene.id;
  }


  _getSceneLibraryPresets() {
    return [
      { id: "adrift", name: "Adrift", category: "Ocean", gradient: "linear-gradient(135deg, #3e6cff 0%, #9b6cff 45%, #ff8fb0 100%)", palette: [[216, 70, 46], [228, 36, 40], [240, 26, 38], [278, 22, 50], [18, 24, 52], [46, 80, 72]] },
      { id: "soho", name: "Soho", category: "Futuristic", gradient: "linear-gradient(135deg, #ff2a9d 0%, #7f3fff 45%, #00b1ff 100%)", palette: [[328, 92, 58], [280, 82, 56], [204, 88, 54], [20, 72, 58], [46, 80, 68]] },
      { id: "magneto", name: "Magneto", category: "Futuristic", gradient: "linear-gradient(135deg, #0d1f5d 0%, #102c9a 42%, #2de2e6 100%)", palette: [[210, 80, 42], [224, 74, 50], [192, 82, 56], [264, 32, 54], [46, 68, 67]] },
      { id: "winter_beauty", name: "Winter Beauty", category: "Nature", gradient: "linear-gradient(135deg, #7fa0c9 0%, #b5d2ef 48%, #f1fbff 100%)", palette: [[208, 26, 68], [212, 38, 74], [194, 22, 78], [228, 18, 70], [50, 40, 75]] },
      { id: "disturbia", name: "Disturbia", category: "Futuristic", gradient: "linear-gradient(135deg, #450036 0%, #a32055 40%, #ff8a00 100%)", palette: [[324, 76, 43], [340, 64, 45], [20, 92, 55], [290, 36, 42], [46, 80, 70]] },
      { id: "silverstone", name: "Silverstone", category: "Race", gradient: "linear-gradient(135deg, #0c1328 0%, #244e89 43%, #9dc7f7 100%)", palette: [[220, 62, 38], [206, 56, 52], [198, 52, 64], [250, 24, 40], [46, 68, 72]] },
      { id: "singapore", name: "Singapore", category: "Race", gradient: "linear-gradient(135deg, #160016 0%, #8b0659 38%, #f73284 100%)", palette: [[320, 80, 45], [334, 72, 52], [290, 54, 46], [212, 58, 50], [50, 72, 70]] },
      { id: "sao_paulo", name: "São Paulo", category: "Race", gradient: "linear-gradient(135deg, #00212f 0%, #04787a 46%, #6fe7bb 100%)", palette: [[190, 66, 40], [174, 60, 46], [162, 54, 60], [206, 40, 52], [46, 70, 70]] },
    ];
  }

  _getFilteredSceneLibraryPresets() {
    const term = this._sceneLibrarySearch.trim().toLowerCase();
    const presets = this._getSceneLibraryPresets();
    if (!term) return presets;
    return presets.filter(preset => (
      preset.name.toLowerCase().includes(term) ||
      preset.category.toLowerCase().includes(term)
    ));
  }

  _getAllSceneGroupIds() {
    return this._groups.map(group => group.id);
  }

  async _setLibraryPresetOnce(preset, colorIndex = 0, groupId = null) {
    const color = preset.palette[colorIndex] || preset.palette[0];
    if (!color || !this.hass) return;
    const [hue, saturation, lightness] = color;
    const brightness = Math.min(255, Math.max(10, Math.round(lightness / 100 * 255)));
    const saturationPct = Math.min(100, Math.max(0, saturation));
    const targetLightIds = groupId
      ? this._getLightIdsForGroup(groupId)
      : this._getLightIdsForGroupIds(this._getAllSceneGroupIds());
    if (targetLightIds.length === 0) return;

    await Promise.all(targetLightIds.map(entityId => this.hass.callService("light", "turn_on", {
      entity_id: entityId,
      hs_color: [hue, saturationPct],
      brightness,
      transition: 0.6,
    })));

    if (Array.isArray(preset.palette) && preset.palette.length > 0) {
      this._sceneLibraryColorIndex = (colorIndex + 1) % preset.palette.length;
    }
  }

  _saveLibraryPresetAsScene(preset, colorIndex = 0, animate = false, groupId = null) {
    const color = preset.palette[colorIndex] || preset.palette[0];
    if (!color) return;
    const [hue, saturation, lightness] = color;
    const brightness = Math.min(255, Math.max(10, Math.round(lightness / 100 * 255)));

    let targetGroupIds;
    let targetLightIds;
    if (groupId) {
      targetGroupIds = [groupId];
      targetLightIds = this._getLightIdsForGroup(groupId);
    } else {
      targetGroupIds = this._getAllSceneGroupIds();
      targetLightIds = this._getLightIdsForGroupIds(targetGroupIds);
    }

    const lightStates = {};
    const lightAnimations = {};

    targetLightIds.forEach(entityId => {
      lightStates[entityId] = {
        state: "on",
        hs_color: [hue, saturation],
        color_mode: "hs",
        brightness,
      };
      if (animate) {
        lightAnimations[entityId] = {
          color_sequence: preset.palette.map(([stepHue, stepSaturation, stepLightness]) => ({
            hs_color: [stepHue, stepSaturation],
            brightness: Math.min(255, Math.max(10, Math.round(stepLightness / 100 * 255))),
          })),
          interval_seconds: this._sceneLibraryAnimationInterval,
          repeat: this._sceneLibraryAnimationRepeat,
        };
      }
    });

    const newScene = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: animate ? `${preset.name} Animated` : preset.name,
      groupId: groupId || null,
      groupIds: targetGroupIds,
      lightStates,
      lightAnimations,
      lightOverrides: {},
    };

    this._scenes = [...this._scenes, newScene];
    this._saveScenesToHA();
    this._sceneLibraryPopupId = null;
    this._sceneLibraryShowGroupSelect = null;
    if (groupId) {
      this._activeTab = "light_groups";
    }
  }


  _hsColorToHex(hsColor) {
    if (!Array.isArray(hsColor) || hsColor.length < 2) return "#ffffff";
    const h = ((Number(hsColor[0]) % 360) + 360) % 360;
    const s = Math.max(0, Math.min(100, Number(hsColor[1]))) / 100;
    const v = 1;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toHex = value => Math.round((value + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  _hexToHsColor(hex) {
    if (!hex || typeof hex !== "string") return [0, 0];
    const cleaned = hex.replace("#", "");
    const parsed = cleaned.length === 3
      ? cleaned.split("").map(part => part + part).join("")
      : cleaned;
    if (!/^([0-9a-fA-F]{6})$/.test(parsed)) return [0, 0];

    const r = parseInt(parsed.slice(0, 2), 16) / 255;
    const g = parseInt(parsed.slice(2, 4), 16) / 255;
    const b = parseInt(parsed.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * (((b - r) / delta) + 2);
      else h = 60 * (((r - g) / delta) + 4);
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : (delta / max) * 100;
    return [Math.round(h), Math.round(s)];
  }

  _normalizeScene(scene) {
    // Migrate legacy groupIds array to single groupId
    let groupId = scene.groupId;
    let groupIds = scene.groupIds;
    if (!groupId && Array.isArray(groupIds) && groupIds.length > 0) {
      groupId = groupIds[0];
    }
    const normalized = {
      ...scene,
      groupId: groupId || null,
      lightStates: scene.lightStates || {},
      lightAnimations: scene.lightAnimations || {},
      lightOverrides: scene.lightOverrides || {},
    };
    // Keep groupIds for backward compatibility but remove old-style array if migrating
    if (!normalized.groupIds) {
      normalized.groupIds = groupId ? [groupId] : [];
    }
    return normalized;
  }

  _getSceneLightIds(scene) {
    const sceneLightIds = new Set();
    // Support both groupId (single) and groupIds (legacy array)
    const groupIdList = scene.groupId
      ? [scene.groupId]
      : (scene.groupIds || []);
    groupIdList.forEach(groupId => {
      const group = this._groups.find(g => g.id === groupId);
      if (group) {
        group.lightIds.forEach(lightId => sceneLightIds.add(lightId));
      }
    });
    return [...sceneLightIds];
  }

  _getSceneSwatchStyle(scene) {
    const states = Object.values(scene.lightStates || {});
    const colors = states
      .filter(s => s.state !== "off" && s.hs_color)
      .map(s => {
        const [h, sat] = s.hs_color;
        const l = s.brightness != null ? Math.round(s.brightness / 255 * 35 + 30) : 52;
        return `hsl(${h}, ${sat}%, ${l}%)`;
      });
    if (colors.length >= 2) {
      return `background: linear-gradient(135deg, ${colors.slice(0, 4).join(", ")})`;
    }
    if (colors.length === 1) {
      return `background: ${colors[0]}`;
    }
    // Fallback: color_temp
    const tempState = states.find(s => s.state !== "off" && s.color_temp);
    if (tempState) {
      const kelvin = 1000000 / tempState.color_temp;
      const t = Math.min(1, Math.max(0, (kelvin - 2000) / 4500));
      return `background: hsl(${Math.round(45 - t * 35)}, ${Math.round(90 - t * 85)}%, 52%)`;
    }
    return "background: var(--primary-color)";
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

  _cleanupLightAnimationConfig(animation) {
    const next = { ...(animation || {}) };

    const transitionValue = Number(next.transition);
    if (next.transition == null || next.transition === "" || !Number.isFinite(transitionValue) || transitionValue <= 0) {
      delete next.transition;
    } else {
      next.transition = transitionValue;
    }

    if (!next.effect) {
      delete next.effect;
    }

    const intervalValue = Number(next.interval_seconds);
    if (next.interval_seconds == null || next.interval_seconds === "" || !Number.isFinite(intervalValue) || intervalValue <= 0) {
      delete next.interval_seconds;
    } else {
      next.interval_seconds = Math.max(0.2, intervalValue);
    }

    if (typeof next.repeat !== "boolean") {
      delete next.repeat;
    }

    if (Array.isArray(next.color_sequence)) {
      const cleanedSteps = next.color_sequence.filter(step => (
        step
        && Array.isArray(step.hs_color)
        && step.hs_color.length === 2
        && step.hs_color.every(value => Number.isFinite(Number(value)))
      )).map(step => {
        const normalized = {
          hs_color: [Number(step.hs_color[0]), Number(step.hs_color[1])],
        };
        const brightness = Number(step.brightness);
        if (Number.isFinite(brightness)) {
          normalized.brightness = Math.max(1, Math.min(255, Math.round(brightness)));
        }
        return normalized;
      });

      if (cleanedSteps.length > 0) {
        next.color_sequence = cleanedSteps;
      } else {
        delete next.color_sequence;
      }
    } else {
      delete next.color_sequence;
    }

    return next;
  }

  _updateLightAnimation(sceneId, entityId, field, value) {
    this._scenes = this._scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const currentAnimations = scene.lightAnimations || {};
      const currentAnimation = currentAnimations[entityId] || {};
      const nextAnimation = this._cleanupLightAnimationConfig({ ...currentAnimation, [field]: value });

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

  _addLightAnimationColor(sceneId, entityId, hexColor) {
    const hsColor = this._hexToHsColor(hexColor);
    this._scenes = this._scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const currentAnimations = scene.lightAnimations || {};
      const currentAnimation = currentAnimations[entityId] || {};
      const currentSequence = Array.isArray(currentAnimation.color_sequence) ? currentAnimation.color_sequence : [];
      const currentBrightness = currentAnimation?.brightness;
      const nextAnimation = this._cleanupLightAnimationConfig({
        ...currentAnimation,
        color_sequence: [...currentSequence, {
          hs_color: hsColor,
          brightness: Number.isFinite(Number(currentBrightness)) ? Number(currentBrightness) : undefined,
        }],
      });

      const nextAnimations = { ...currentAnimations, [entityId]: nextAnimation };
      return { ...scene, lightAnimations: nextAnimations };
    });
    this._saveScenesToHA();
  }

  _removeLightAnimationColor(sceneId, entityId, index) {
    this._scenes = this._scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const currentAnimations = scene.lightAnimations || {};
      const currentAnimation = currentAnimations[entityId] || {};
      const currentSequence = Array.isArray(currentAnimation.color_sequence) ? currentAnimation.color_sequence : [];
      const nextSequence = currentSequence.filter((_, seqIndex) => seqIndex !== index);
      const nextAnimation = this._cleanupLightAnimationConfig({ ...currentAnimation, color_sequence: nextSequence });

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

  async _stopScene(sceneId = null) {
    if (!this.hass) return;

    this._stoppingSceneId = sceneId || "__all__";
    try {
      const data = sceneId ? { scene_id: sceneId } : {};
      await this.hass.callService("light_manager", "stop_scene", data);
    } catch (err) {
      console.error("Light Manager: failed to stop scene animations", err);
    } finally {
      this._stoppingSceneId = null;
    }
  }

  async _copySceneExport(scene) {
    const sceneService = this._getSceneServiceName(scene.id);
    const performAction = sceneService ? `light_manager.${sceneService}` : "light_manager.activate_scene";
    const dataBlock = sceneService ? "" : `\n  data:\n    scene_id: ${scene.id}`;
    const serviceData = `type: button\ntap_action:\n  action: perform-action\n  perform_action: ${performAction}${dataBlock}\nname: ${scene.name}`;
    try {
      await navigator.clipboard.writeText(serviceData);
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
            class="tab ${this._activeTab === "light_groups" ? "active" : ""}"
            @click=${() => { this._activeTab = "light_groups"; }}
          >Light Groups (${this._groups.length})</button>
          <button
            class="tab ${this._activeTab === "light_library" ? "active" : ""}"
            @click=${() => { this._activeTab = "light_library"; }}
          >Light Library</button>
        </div>
        ${this._activeTab === "groups"
          ? this._renderGroups()
          : this._activeTab === "light_groups"
            ? this._renderLightGroups()
            : this._renderSceneLibrary()}
      </div>
      ${this._renderScenePopup()}
      ${this._renderSceneLibraryPopup()}
      ${this._renderAddSceneDialog()}
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

  // ── Light Groups Tab ─────────────────────────────────────────────────────

  _renderLightGroups() {
    if (this._groups.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">💡</div>
          <div>No groups yet. Create groups in the Groups tab first.</div>
        </div>
      `;
    }
    return html`
      <div class="groups-list">
        ${this._groups.map(group => this._renderLightGroupCard(group))}
      </div>
    `;
  }

  _renderLightGroupCard(group) {
    const lightIds = group.lightIds || [];
    const isEditing = this._editingGroupId === group.id;
    const isAddingLight = this._addingLightToGroup === group.id;
    const availableLights = this._lights.filter(l => !lightIds.includes(l.entityId));

    // Compute average brightness
    const avgBrightness = lightIds.length > 0
      ? Math.round(
          lightIds.map(id => this.hass?.states?.[id]?.attributes?.brightness || 0)
            .reduce((a, b) => a + b, 0) / lightIds.length / 255 * 100
        ) || 50
      : 50;

    // Group is "on" if any light is on
    const groupIsOn = lightIds.some(id => this.hass?.states?.[id]?.state === "on");

    // Scenes belonging to this group
    const groupScenes = this._scenes.filter(s => s.groupId === group.id);

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

        <!-- Brightness bar -->
        <div class="group-brightness-bar">
          <input
            type="range"
            min="1"
            max="100"
            .value=${String(avgBrightness)}
            @change=${e => {
              const val = Number(e.target.value);
              if (lightIds.length > 0) {
                this.hass.callService("light", "turn_on", {
                  entity_id: lightIds,
                  brightness_pct: val,
                });
              }
            }}
          />
          <span style="font-size:0.85em;color:var(--secondary-text-color);min-width:38px;text-align:right">${avgBrightness}%</span>
          <button
            class="light-toggle-btn ${groupIsOn ? "on" : ""}"
            @click=${() => {
              if (lightIds.length > 0) {
                this.hass.callService("light", groupIsOn ? "turn_off" : "turn_on", {
                  entity_id: lightIds,
                });
              }
            }}
          >${groupIsOn ? "On" : "Off"}</button>
        </div>

        <!-- MY SCENES section -->
        <div class="group-section-label">My Scenes</div>
        ${groupScenes.length === 0
          ? html`<div class="no-lights-msg">No scenes yet. Use + Add Scene below.</div>`
          : html`
              <div class="scene-tiles">
                ${groupScenes.map(scene => html`
                  <div class="scene-tile">
                    <div class="scene-tile-swatch" style="${this._getSceneSwatchStyle(scene)}"></div>
                    <div class="scene-tile-name" title="${scene.name}">${scene.name}</div>
                    <div class="scene-tile-actions">
                      <button
                        class="btn-icon"
                        title="Activate scene"
                        ?disabled=${this._activatingSceneId === scene.id}
                        @click=${() => this._activateScene(scene.id)}
                      >▶</button>
                      <button
                        class="btn-icon"
                        title="Stop scene"
                        ?disabled=${this._stoppingSceneId === scene.id}
                        @click=${() => this._stopScene(scene.id)}
                      >⏹</button>
                      <button
                        class="btn-icon danger"
                        title="Delete scene"
                        @click=${() => this._deleteScene(scene.id)}
                      >🗑️</button>
                    </div>
                  </div>
                `)}
              </div>
            `}

        <!-- LIGHTS section -->
        <div class="group-section-label">Lights</div>
        ${lightIds.length === 0
          ? html`<div class="no-lights-msg">No lights in this group yet.</div>`
          : html`
              <div class="light-cards-grid">
                ${lightIds.map(entityId => {
                  const light = this._lights.find(l => l.entityId === entityId);
                  const lightName = light?.name || entityId;
                  const isOn = this.hass?.states?.[entityId]?.state === "on";
                  return html`
                    <div class="light-card ${isOn ? "on" : ""}">
                      <button
                        class="light-card-remove"
                        title="Remove from group"
                        @click=${() => this._removeLightFromGroup(group.id, entityId)}
                      >&times;</button>
                      <span class="light-card-icon">💡</span>
                      <span class="light-card-name">${lightName}</span>
                      <button
                        class="light-toggle-btn ${isOn ? "on" : ""}"
                        @click=${() => {
                          this.hass.callService("light", isOn ? "turn_off" : "turn_on", {
                            entity_id: entityId,
                          });
                        }}
                      >${isOn ? "On" : "Off"}</button>
                    </div>
                  `;
                })}
              </div>
            `}

        <!-- Add light row -->
        ${isAddingLight
          ? html`
              <div class="group-footer">
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
              </div>
            `
          : ""}

        <!-- Footer: Add Scene button -->
        <div class="group-footer">
          <button
            class="btn-primary"
            @click=${() => {
              this._showAddSceneToGroupId = group.id;
              this._addSceneDialogStep = "type";
              this._addSceneLibrarySelection = null;
              this._sceneLibrarySearch = "";
            }}
          >+ Add Scene</button>
          <button
            class="btn-secondary"
            ?disabled=${availableLights.length === 0}
            @click=${() => { this._addingLightToGroup = group.id; }}
          >+ Add Light</button>
        </div>
      </div>
    `;
  }

  // ── Add Scene Dialog ─────────────────────────────────────────────────────

  _renderAddSceneDialog() {
    if (!this._showAddSceneToGroupId) return "";
    const group = this._groups.find(g => g.id === this._showAddSceneToGroupId);
    if (!group) return "";

    return html`
      <div class="scene-popup-backdrop" @click=${() => { this._showAddSceneToGroupId = null; }}>
        <div class="add-scene-dialog" @click=${e => e.stopPropagation()}>
          <div class="add-scene-dialog-header">
            <h3 class="add-scene-dialog-title">
              ${this._addSceneDialogStep === "type"
                ? `Add Scene to ${group.name}`
                : "Choose a Library Scene"}
            </h3>
            <button
              class="btn-icon"
              @click=${() => {
                if (this._addSceneDialogStep === "library") {
                  this._addSceneDialogStep = "type";
                } else {
                  this._showAddSceneToGroupId = null;
                }
              }}
            >${this._addSceneDialogStep === "library" ? "← Back" : "✕"}</button>
          </div>
          <div class="add-scene-dialog-body">
            ${this._addSceneDialogStep === "type"
              ? html`
                  <button
                    class="add-scene-type-btn"
                    @click=${() => {
                      this._addSceneDialogStep = "library";
                      this._sceneLibrarySearch = "";
                    }}
                  >
                    <span>Library Scene</span>
                    <span>→</span>
                  </button>
                `
              : this._renderAddSceneLibraryStep(group)}
          </div>
        </div>
      </div>
    `;
  }

  _renderAddSceneLibraryStep(group) {
    const filteredPresets = this._getFilteredSceneLibraryPresets();
    return html`
      <div style="margin-bottom:10px;">
        <input
          type="text"
          placeholder="Search presets..."
          .value=${this._sceneLibrarySearch}
          @input=${e => { this._sceneLibrarySearch = e.target.value; }}
          style="width:100%;box-sizing:border-box;"
        />
      </div>
      <div style="display:grid; gap:10px; margin:6px 0 12px;">
        <label style="display:flex; align-items:center; gap:10px; font-size:0.9em; color:var(--primary-text-color);">
          Time between colors (seconds)
          <input
            type="number"
            min="0.2"
            step="0.1"
            style="max-width:100px;"
            .value=${String(this._sceneLibraryAnimationInterval)}
            @change=${e => {
              const next = Number(e.target.value);
              this._sceneLibraryAnimationInterval = Number.isFinite(next) && next > 0 ? next : 3;
            }}
          />
        </label>
        <label style="display:flex; align-items:center; gap:10px; font-size:0.9em; color:var(--primary-text-color);">
          <input
            type="checkbox"
            .checked=${this._sceneLibraryAnimationRepeat}
            @change=${e => { this._sceneLibraryAnimationRepeat = e.target.checked; }}
          />
          Repeat indefinitely
        </label>
      </div>
      ${filteredPresets.length === 0
        ? html`<div style="color:var(--secondary-text-color);font-style:italic;">No presets found.</div>`
        : html`
            <div class="library-mini-grid">
              ${filteredPresets.map(preset => html`
                <button
                  class="scene-library-card"
                  @click=${() => {
                    this._saveLibraryPresetAsScene(preset, 0, true, group.id);
                    this._showAddSceneToGroupId = null;
                  }}
                >
                  <div class="scene-library-thumb" style="background:${preset.gradient}"></div>
                  <span class="scene-library-title">${preset.name}</span>
                </button>
              `)}
            </div>
          `}
    `;
  }


  _renderSceneLibrary() {
    const filteredPresets = this._getFilteredSceneLibraryPresets();
    let previousCategory = null;
    return html`
      <div class="scene-library-toolbar">
        <input
          type="text"
          placeholder="Search scene library"
          .value=${this._sceneLibrarySearch}
          @input=${e => { this._sceneLibrarySearch = e.target.value; }}
        />
      </div>
      ${filteredPresets.length === 0
        ? html`
            <div class="empty-state">
              <div class="empty-state-icon">🔎</div>
              <div>No scene presets found for "${this._sceneLibrarySearch}".</div>
            </div>
          `
        : html`
            <div class="scene-library-grid">
              ${filteredPresets.map(preset => {
                const categoryBlock = preset.category !== previousCategory
                  ? html`<div class="scene-library-category">${preset.category}</div>`
                  : "";
                previousCategory = preset.category;
                return html`
                  ${categoryBlock}
                  <button class="scene-library-card" @click=${() => {
                    this._sceneLibraryPopupId = preset.id;
                    this._sceneLibraryColorIndex = 0;
                    this._sceneLibraryAnimationInterval = 3;
                    this._sceneLibraryAnimationRepeat = true;
                    this._sceneLibraryShowGroupSelect = null;
                    this._sceneLibrarySaveAnimated = false;
                  }}>
                    <div class="scene-library-thumb" style="background:${preset.gradient}"></div>
                    <span class="scene-library-title">${preset.name}</span>
                  </button>
                `;
              })}
            </div>
          `}
    `;
  }

  _renderSceneLibraryPopup() {
    if (!this._sceneLibraryPopupId) return "";
    const preset = this._getSceneLibraryPresets().find(item => item.id === this._sceneLibraryPopupId);
    if (!preset) return "";

    return html`
      <div class="scene-popup-backdrop" @click=${() => { this._sceneLibraryPopupId = null; this._sceneLibraryShowGroupSelect = null; }}>
        <div class="scene-library-popup" @click=${e => { e.stopPropagation(); }}>
          <div class="scene-library-popup-image" style="background:${preset.gradient}">
            <h3 class="scene-library-popup-name">${preset.name}</h3>
            <button class="btn-icon scene-popup-close scene-library-popup-close" title="Close" @click=${() => { this._sceneLibraryPopupId = null; this._sceneLibraryShowGroupSelect = null; }}>✕</button>
          </div>
          <div class="scene-library-popup-body">
            <div class="scene-library-palette">
              ${preset.palette.map((color, idx) => html`
                <button
                  class="scene-library-color ${this._sceneLibraryColorIndex === idx ? "active" : ""}"
                  style="background:hsl(${color[0]}, ${color[1]}%, ${color[2]}%)"
                  title="Use color ${idx + 1}"
                  @click=${() => { this._sceneLibraryColorIndex = idx; }}
                ></button>
              `)}
            </div>
            <div style="display:grid; gap:10px; margin:6px 0 12px;">
              <label style="display:flex; align-items:center; gap:10px; color:#f1f3f6; font-size:0.9em;">
                Time between colors (seconds)
                <input
                  type="number"
                  min="0.2"
                  step="0.1"
                  style="max-width:100px;"
                  .value=${String(this._sceneLibraryAnimationInterval)}
                  @change=${e => {
                    const next = Number(e.target.value);
                    this._sceneLibraryAnimationInterval = Number.isFinite(next) && next > 0 ? next : 3;
                  }}
                />
              </label>
              <label style="display:flex; align-items:center; gap:10px; color:#f1f3f6; font-size:0.9em;">
                <input
                  type="checkbox"
                  .checked=${this._sceneLibraryAnimationRepeat}
                  @change=${e => { this._sceneLibraryAnimationRepeat = e.target.checked; }}
                />
                Repeat indefinitely
              </label>
            </div>

            ${this._sceneLibraryShowGroupSelect
              ? html`
                  <div style="margin-bottom:10px;color:#f1f3f6;font-size:0.88em;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                    ${this._sceneLibraryShowGroupSelect === "save" ? "Save to which group?" : "Set lights in which group?"}
                  </div>
                  <div class="group-select-row">
                    ${this._groups.map(group => html`
                      <button
                        class="group-select-btn"
                        @click=${() => {
                          if (this._sceneLibraryShowGroupSelect === "save") {
                            this._saveLibraryPresetAsScene(preset, this._sceneLibraryColorIndex, this._sceneLibrarySaveAnimated, group.id);
                          } else {
                            this._setLibraryPresetOnce(preset, this._sceneLibraryColorIndex, group.id);
                            this._sceneLibraryShowGroupSelect = null;
                          }
                        }}
                      >${group.name}</button>
                    `)}
                    <button
                      class="group-select-btn"
                      style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.3);color:#f1f3f6;"
                      @click=${() => { this._sceneLibraryShowGroupSelect = null; }}
                    >Cancel</button>
                  </div>
                `
              : html`
                  <div class="scene-library-popup-actions">
                    <button @click=${() => {
                      this._sceneLibrarySaveAnimated = false;
                      this._sceneLibraryShowGroupSelect = "save";
                    }}>Save to My Scenes</button>
                    <button @click=${() => {
                      this._sceneLibraryShowGroupSelect = "setonce";
                    }}>Set Once</button>
                    <button @click=${() => this._stopScene(null)} ?disabled=${this._stoppingSceneId === "__all__"}>${this._stoppingSceneId === "__all__" ? "Stopping..." : "Stop All Scenes"}</button>
                  </div>
                `}
          </div>
        </div>
      </div>
    `;
  }

  _renderScenePopup() {
    if (!this._scenePopupSceneId) return "";
    const scene = this._scenes.find(s => s.id === this._scenePopupSceneId);
    if (!scene) return "";

    // Support both new groupId and legacy groupIds
    const groupIdList = scene.groupId
      ? [scene.groupId]
      : (scene.groupIds || []);
    const sceneGroups = groupIdList
      .map(id => this._groups.find(g => g.id === id))
      .filter(Boolean);
    const configuredLightIds = this._getConfiguredSceneLightIds(scene);
    const sceneServiceName = this._getSceneServiceName(scene.id);
    const hasStates = Object.keys(scene.lightStates || {}).length > 0 || configuredLightIds.length > 0;
    const isActivating = this._activatingSceneId === scene.id;

    return html`
      <div class="scene-popup-backdrop" @click=${() => { this._scenePopupSceneId = null; }}>
        <div class="scene-popup-card" @click=${e => { e.stopPropagation(); }}>
          <div class="scene-popup-header">
            <div>
              <h3 class="scene-popup-title">${scene.name}</h3>
              <p class="scene-popup-subtitle">${sceneGroups.length} ${sceneGroups.length === 1 ? "group" : "groups"} · ${configuredLightIds.length} configured lights</p>
            </div>
            <button class="btn-icon scene-popup-close" title="Close" @click=${() => { this._scenePopupSceneId = null; }}>✕</button>
          </div>
          <div class="scene-popup-content">
            <p class="scene-popup-label">Included groups</p>
            <div class="scene-popup-chip-row">
              ${sceneGroups.length === 0
                ? html`<span class="scene-popup-chip">No groups yet</span>`
                : sceneGroups.map(group => html`<span class="scene-popup-chip">${group.name}</span>`)}
            </div>
            ${sceneServiceName
              ? html`<div class="scene-service-hint">Service: <code>light_manager.${sceneServiceName}</code></div>`
              : ""}
            <div class="scene-popup-actions">
              <button ?disabled=${!hasStates || isActivating} @click=${() => this._activateScene(scene.id)}>${isActivating ? "Testing..." : "▶ Test Scene"}</button>
              <button @click=${() => this._captureSceneState(scene.id)}>📸 Capture</button>
              <button @click=${() => this._copySceneExport(scene)}>📋 Copy YAML</button>
              <button class="btn-danger" ?disabled=${this._stoppingSceneId === scene.id} @click=${() => this._stopScene(scene.id)}>${this._stoppingSceneId === scene.id ? "Stopping..." : "⏹ Stop Scene"}</button>
            </div>
            ${!hasStates && sceneGroups.length > 0
              ? html`<span class="capture-hint">Capture states and/or configure per-light scene/effect first</span>`
              : ""}
            <div class="scene-popup-create">
              <p class="scene-popup-label">Create specific scenes</p>
              <div class="scene-popup-create-row">
                <input
                  type="text"
                  placeholder="New scene name (optional)"
                  .value=${this._popupNewSceneName}
                  @input=${e => { this._popupNewSceneName = e.target.value; }}
                />
                <button @click=${() => this._createSceneFromPopup(scene, "duplicate")}>➕ Duplicate</button>
              </div>
              <div class="scene-popup-create-actions">
                <button @click=${() => this._createSceneFromPopup(scene, "capture")}>📸 Capture as new</button>
                <button ?disabled=${sceneGroups.length === 0} @click=${() => this._createSceneFromPopup(scene, "relax")}>🟠 Relax preset</button>
                <button ?disabled=${sceneGroups.length === 0} @click=${() => this._createSceneFromPopup(scene, "focus")}>🔵 Focus preset</button>
                <button ?disabled=${sceneGroups.length === 0} @click=${() => this._createSceneFromPopup(scene, "night")}>🌙 Night preset</button>
              </div>
            </div>
          </div>
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
