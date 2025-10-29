/**
 * @pkmn/battle-component
 *
 * Web component for embedding Pokemon Showdown battles
 *
 * @example
 * ```typescript
 * import '@pkmn/battle-component';
 *
 * const battle = document.createElement('pokemon-battle');
 * battle.log = "|player|p1|Alice\n|player|p2|Bob";
 * battle.addEventListener('choice-request', (e) => {
 *   console.log('Need choice:', e.detail);
 * });
 * document.body.appendChild(battle);
 * ```
 */

export {
  PokemonBattleElement,
  type ChoiceRequestDetail,
  type ChoiceMadeDetail,
  type BattleStateDetail,
} from './pokemon-battle';

// Auto-register the custom element
import './pokemon-battle';

// Augment global HTML element types
declare global {
  interface HTMLElementTagNameMap {
    'pokemon-battle': import('./pokemon-battle').PokemonBattleElement;
  }
}
