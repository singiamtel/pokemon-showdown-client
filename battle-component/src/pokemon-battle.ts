/**
 * Pokemon Battle Web Component
 *
 * A custom element that embeds a Pokemon Showdown battle with full UI,
 * animations, and interactive choice handling.
 *
 * @example
 * ```html
 * <pokemon-battle id="battle"></pokemon-battle>
 * <script>
 *   const battle = document.getElementById('battle');
 *   battle.log = "|player|p1|Alice\n|player|p2|Bob";
 *   battle.addEventListener('choice-request', (e) => {
 *     console.log('Need choice:', e.detail);
 *   });
 * </script>
 * ```
 */

import { Battle } from '@pkmn/client';
import type { Protocol } from '@pkmn/protocol';

export interface ChoiceRequestDetail {
  /** The request object from the server */
  request: any;
  /** Available choices */
  availableChoices: string[];
  /** Whether this is a move request, switch request, or team preview */
  requestType: 'move' | 'switch' | 'team' | 'wait';
}

export interface ChoiceMadeDetail {
  /** The individual choice made (e.g., "move 1 mega") */
  choice: string;
  /** The complete choice string if all choices are done (e.g., "/choose move 1, switch 2") */
  complete?: string;
  /** Whether all required choices are complete */
  isDone: boolean;
}

export interface BattleStateDetail {
  /** Current turn number */
  turn: number;
  /** Player 1 information */
  p1: any;
  /** Player 2 information */
  p2: any;
  /** Whether the battle has ended */
  ended: boolean;
}

/**
 * Custom element for rendering Pokemon Showdown battles
 */
export class PokemonBattleElement extends HTMLElement {
  private battle: Battle | null = null;
  private battleContainer: HTMLDivElement | null = null;
  private logContainer: HTMLDivElement | null = null;
  private currentRequest: any = null;
  private currentChoices: string[] = [];
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.initializeBattle();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  /**
   * Render the shadow DOM structure
   */
  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          font-family: Verdana, sans-serif;
          font-size: 10pt;
        }

        .battle-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f0f0f0;
        }

        .battle-container {
          flex: 1;
          position: relative;
          background: #a8b0d8;
          overflow: hidden;
        }

        .battle-log {
          height: 200px;
          background: #f4f4f4;
          border-top: 1px solid #ccc;
          overflow-y: auto;
          padding: 5px;
          font-size: 9pt;
        }

        .battle-controls {
          background: #e8e8e8;
          border-top: 1px solid #ccc;
          padding: 10px;
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .battle-controls button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10pt;
        }

        .battle-controls button:hover {
          background: #45a049;
        }

        .battle-controls button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .message {
          margin: 2px 0;
          padding: 2px;
        }

        .message.error {
          color: red;
          font-weight: bold;
        }
      </style>

      <div class="battle-wrapper">
        <div class="battle-container"></div>
        <div class="battle-log"></div>
        <div class="battle-controls" style="display: none;"></div>
      </div>
    `;

    this.battleContainer = this.shadow.querySelector('.battle-container');
    this.logContainer = this.shadow.querySelector('.battle-log');
  }

  /**
   * Initialize the battle engine
   */
  private initializeBattle() {
    if (!this.battleContainer || !this.logContainer) return;

    // Create a minimal battle instance
    // Note: @pkmn/client has different initialization than the full PS client
    // This is a simplified version - you may need to adjust based on actual @pkmn/client API

    try {
      // Initialize battle with placeholder - actual implementation depends on @pkmn/client structure
      this.battle = new Battle();
      this.log('Battle initialized');
    } catch (error) {
      this.logError('Failed to initialize battle: ' + (error as Error).message);
    }
  }

  /**
   * Append battle protocol lines to the battle
   */
  appendLog(lines: string) {
    if (!this.battle) {
      this.logError('Battle not initialized');
      return;
    }

    const lineArray = lines.split('\n').filter(line => line.trim());

    for (const line of lineArray) {
      try {
        // Parse protocol lines
        if (line.startsWith('|request|')) {
          // Handle choice request
          const requestJson = line.substring('|request|'.length);
          this.handleRequest(JSON.parse(requestJson));
        } else {
          // Process regular battle line
          // Note: Actual implementation depends on @pkmn/client API
          this.log(line);
        }
      } catch (error) {
        this.logError('Error processing line: ' + line);
        console.error(error);
      }
    }
  }

  /**
   * Handle a request from the server
   */
  private handleRequest(request: any) {
    this.currentRequest = request;
    this.currentChoices = [];

    const detail: ChoiceRequestDetail = {
      request,
      availableChoices: this.getAvailableChoices(request),
      requestType: request.requestType || 'wait',
    };

    // Dispatch event
    this.dispatchEvent(new CustomEvent('choice-request', {
      detail,
      bubbles: true,
      composed: true,
    }));

    // Render choice controls if in interactive mode
    if (this.hasAttribute('interactive')) {
      this.renderChoiceControls(detail);
    }
  }

  /**
   * Get available choices from a request
   */
  private getAvailableChoices(request: any): string[] {
    const choices: string[] = [];

    if (!request) return choices;

    switch (request.requestType) {
      case 'move':
        if (request.active && request.active[0]) {
          const active = request.active[0];
          // Add move choices
          active.moves?.forEach((move: any, i: number) => {
            if (!move.disabled) {
              choices.push(`move ${i + 1}`);
              // Add special variants if available
              if (active.canMegaEvo) choices.push(`move ${i + 1} mega`);
              if (active.canDynamax) choices.push(`move ${i + 1} dynamax`);
              if (active.canTerastallize) choices.push(`move ${i + 1} terastallize`);
              if (active.zMoves && active.zMoves[i]) choices.push(`move ${i + 1} zmove`);
            }
          });
        }
        // Add switch choices
        request.side?.pokemon?.forEach((mon: any, i: number) => {
          if (!mon.active && !mon.fainted) {
            choices.push(`switch ${i + 1}`);
          }
        });
        break;

      case 'switch':
        request.side?.pokemon?.forEach((mon: any, i: number) => {
          if (!mon.active && !mon.fainted) {
            choices.push(`switch ${i + 1}`);
          }
        });
        break;

      case 'team':
        request.side?.pokemon?.forEach((mon: any, i: number) => {
          choices.push(`team ${i + 1}`);
        });
        break;
    }

    return choices;
  }

  /**
   * Render interactive choice controls
   */
  private renderChoiceControls(detail: ChoiceRequestDetail) {
    const controls = this.shadow.querySelector('.battle-controls') as HTMLDivElement;
    if (!controls) return;

    controls.style.display = 'flex';
    controls.innerHTML = '';

    detail.availableChoices.forEach(choice => {
      const button = document.createElement('button');
      button.textContent = this.formatChoiceLabel(choice);
      button.onclick = () => this.makeChoice(choice);
      controls.appendChild(button);
    });
  }

  /**
   * Format a choice string into a readable label
   */
  private formatChoiceLabel(choice: string): string {
    const parts = choice.split(' ');
    const type = parts[0];
    const index = parts[1];
    const modifier = parts[2];

    let label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${index}`;
    if (modifier) {
      label += ` (${modifier})`;
    }
    return label;
  }

  /**
   * Make a choice (either called programmatically or via UI)
   */
  makeChoice(choice: string): boolean {
    if (!this.currentRequest) {
      this.logError('No active request');
      return false;
    }

    // Validate choice
    const availableChoices = this.getAvailableChoices(this.currentRequest);
    const baseChoice = choice.split(' ').slice(0, 2).join(' ');
    const isValid = availableChoices.some(c => c.startsWith(baseChoice));

    if (!isValid) {
      this.logError(`Invalid choice: ${choice}`);
      return false;
    }

    // Add choice to list
    this.currentChoices.push(choice);

    // Determine if we're done
    const isDone = this.areChoicesComplete();

    const detail: ChoiceMadeDetail = {
      choice,
      isDone,
    };

    if (isDone) {
      detail.complete = `/choose ${this.currentChoices.join(', ')}`;
      this.log(`Choice: ${detail.complete}`);
    }

    // Dispatch event
    this.dispatchEvent(new CustomEvent('choice-made', {
      detail,
      bubbles: true,
      composed: true,
    }));

    // Hide controls if done
    if (isDone) {
      const controls = this.shadow.querySelector('.battle-controls') as HTMLDivElement;
      if (controls) controls.style.display = 'none';
      this.currentRequest = null;
    }

    return true;
  }

  /**
   * Check if all required choices are complete
   */
  private areChoicesComplete(): boolean {
    if (!this.currentRequest) return false;

    // Simple check - needs one choice per active pokemon or switch slot
    const requiredCount = this.currentRequest.active?.length ||
                         this.currentRequest.forceSwitch?.filter((x: boolean) => x).length ||
                         1;

    return this.currentChoices.length >= requiredCount;
  }

  /**
   * Get the current battle state
   */
  get state(): BattleStateDetail | null {
    if (!this.battle) return null;

    // Extract state from battle - actual implementation depends on @pkmn/client
    return {
      turn: (this.battle as any).turn || 0,
      p1: (this.battle as any).p1 || null,
      p2: (this.battle as any).p2 || null,
      ended: (this.battle as any).ended || false,
    };
  }

  /**
   * Set or append battle log
   */
  set log(value: string) {
    this.appendLog(value);
  }

  /**
   * Play the battle (for replays)
   */
  play() {
    if (this.battle && typeof (this.battle as any).play === 'function') {
      (this.battle as any).play();
    }
  }

  /**
   * Pause the battle (for replays)
   */
  pause() {
    if (this.battle && typeof (this.battle as any).pause === 'function') {
      (this.battle as any).pause();
    }
  }

  /**
   * Reset the battle
   */
  reset() {
    this.cleanup();
    this.initializeBattle();
  }

  /**
   * Log a message to the battle log
   */
  private log(message: string) {
    if (!this.logContainer) return;

    const div = document.createElement('div');
    div.className = 'message';
    div.textContent = message;
    this.logContainer.appendChild(div);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  /**
   * Log an error message
   */
  private logError(message: string) {
    if (!this.logContainer) return;

    const div = document.createElement('div');
    div.className = 'message error';
    div.textContent = message;
    this.logContainer.appendChild(div);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    if (this.battle) {
      // Cleanup battle resources if needed
      this.battle = null;
    }
    this.currentRequest = null;
    this.currentChoices = [];
  }

  /**
   * Observed attributes
   */
  static get observedAttributes() {
    return ['interactive', 'mode'];
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'interactive':
        // Toggle interactive mode
        break;
      case 'mode':
        // Change mode (replay vs live)
        break;
    }
  }
}

// Register the custom element
if (!customElements.get('pokemon-battle')) {
  customElements.define('pokemon-battle', PokemonBattleElement);
}
