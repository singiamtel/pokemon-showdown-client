# Integration Guide

This guide explains how to properly integrate the Pokemon Showdown battle client code into the web component.

## Current Status

The current implementation provides a working scaffold using `@pkmn/client`. However, you may want to use the full battle client code from this repository for better compatibility.

## Option 1: Using @pkmn/client (Recommended)

The `@pkmn/client` package is a cleaned-up extraction of the battle engine. It's MIT licensed and designed for external use.

### Pros
- Clean, minimal dependencies
- MIT licensed (more permissive)
- Actively maintained by @pkmn team
- Already designed for external integration

### Cons
- May lag behind latest Pokemon Showdown features
- Different API from original client

### Implementation

```typescript
import { Battle } from '@pkmn/client';
import { Protocol } from '@pkmn/protocol';

// Initialize battle
const battle = new Battle();

// Process protocol lines
for (const line of Protocol.parse(logText)) {
  battle.update(line);
}

// Access battle state
console.log(battle.p1, battle.p2);
```

## Option 2: Using Original PS Client Code

You can also integrate the original Pokemon Showdown client code directly from this repository.

### Required Files

From `play.pokemonshowdown.com/src/`:
- `battle.ts` - Main battle class
- `battle-animations.ts` - Animation engine
- `battle-log.ts` - Battle log parsing
- `battle-text-parser.ts` - Text parsing
- `battle-dex.ts` - Pokemon data
- `battle-choices.ts` - Choice handling
- `battle-scene-stub.ts` - Stub for server-side use

### Pros
- Latest features immediately
- Full compatibility with Pokemon Showdown
- Access to all client features

### Cons
- More dependencies (jQuery, Preact)
- AGPLv3 licensed for full client
- Requires more build configuration

### Implementation

1. **Copy Battle Files**

```bash
cd battle-component
mkdir -p src/ps-client
cp ../play.pokemonshowdown.com/src/battle*.ts src/ps-client/
```

2. **Update Imports**

Modify the web component to use local files:

```typescript
import { Battle } from './ps-client/battle';
import { BattleChoiceBuilder } from './ps-client/battle-choices';
```

3. **Handle jQuery Dependency**

The original client uses jQuery. You can either:

a) Include jQuery as a dependency:
```json
"dependencies": {
  "jquery": "^3.7.1",
  "@types/jquery": "^3.5.29"
}
```

b) Create jQuery shims for the parts you need:
```typescript
// Simple $ wrapper
const $ = (selector: string | Element) => {
  if (typeof selector === 'string') {
    return document.querySelector(selector);
  }
  return selector;
};
```

4. **Initialize Battle**

```typescript
private initializeBattle() {
  this.battle = new Battle({
    $frame: $(this.battleContainer),
    $logFrame: $(this.logContainer),
  });
}
```

## Option 3: Hybrid Approach

Use `@pkmn/client` for the core battle engine, but supplement with original code for specific features.

### Example: Using @pkmn/client + Original Choice System

```typescript
import { Battle } from '@pkmn/client';
import { BattleChoiceBuilder } from '../play.pokemonshowdown.com/src/battle-choices';

export class PokemonBattleElement extends HTMLElement {
  private battle: Battle;
  private choiceBuilder: BattleChoiceBuilder | null = null;

  handleRequest(request: any) {
    // Use original choice builder for robust choice handling
    this.choiceBuilder = new BattleChoiceBuilder(request);

    // Get available choices
    const choices = this.getAvailableChoices(request);
    this.renderChoiceControls(choices);
  }

  makeChoice(choice: string) {
    if (!this.choiceBuilder) return false;

    const error = this.choiceBuilder.addChoice(choice);
    if (error) {
      this.logError(error);
      return false;
    }

    if (this.choiceBuilder.isDone()) {
      const complete = this.choiceBuilder.toString();
      this.dispatchChoiceEvent(complete);
      return true;
    }

    return false;
  }
}
```

## Handling Assets

### Sprites and Images

Pokemon sprites are required for visual display. Options:

1. **Use Pokemon Showdown's CDN**
```typescript
const SPRITE_BASE = 'https://play.pokemonshowdown.com/sprites/';
```

2. **Bundle sprites with package** (increases package size)
```bash
cp -r ../play.pokemonshowdown.com/sprites/ public/sprites/
```

3. **Let users provide sprite path**
```html
<pokemon-battle sprite-path="/path/to/sprites"></pokemon-battle>
```

### CSS Styles

Copy and adapt battle styles:

```bash
cp ../play.pokemonshowdown.com/style/battle.css src/styles/
cp ../play.pokemonshowdown.com/style/battle-log.css src/styles/
```

Then import in your component:

```typescript
import battleStyles from './styles/battle.css?inline';

// In render
this.shadow.innerHTML = `
  <style>${battleStyles}</style>
  <!-- rest of component -->
`;
```

## Testing Your Integration

### Unit Tests

Create tests for choice handling:

```typescript
import { describe, it, expect } from 'vitest';
import { PokemonBattleElement } from './pokemon-battle';

describe('PokemonBattleElement', () => {
  it('should handle choice requests', () => {
    const battle = new PokemonBattleElement();
    document.body.appendChild(battle);

    const request = {
      requestType: 'move',
      rqid: 1,
      side: { /* ... */ },
      active: [{ moves: [/* ... */] }]
    };

    battle.handleRequest(request);

    const choices = battle.getAvailableChoices(request);
    expect(choices).toContain('move 1');
  });
});
```

### Integration Tests

Test with real battle logs:

```typescript
it('should replay a battle', async () => {
  const battle = new PokemonBattleElement();
  document.body.appendChild(battle);

  // Load a real battle log
  const log = await fetch('/test/fixtures/battle.log').then(r => r.text());
  battle.log = log;

  // Wait for battle to process
  await new Promise(resolve => setTimeout(resolve, 100));

  expect(battle.state?.turn).toBeGreaterThan(0);
});
```

## Performance Considerations

### Lazy Loading

Load battle assets only when needed:

```typescript
async initializeBattle() {
  if (!this.battleModule) {
    this.battleModule = await import('@pkmn/client');
  }
  this.battle = new this.battleModule.Battle();
}
```

### Virtual DOM

For large battle logs, consider virtualizing the log display:

```typescript
// Only render visible log entries
const visibleEntries = logEntries.slice(scrollTop, scrollTop + viewportSize);
```

## Deployment

### Publishing to npm

```bash
npm run build
npm publish
```

### Using in Production

```bash
npm install @pkmn/battle-component
```

```html
<script type="module">
  import '@pkmn/battle-component';
</script>

<pokemon-battle id="battle"></pokemon-battle>
```

## Next Steps

1. Decide which approach (Option 1, 2, or 3) fits your needs
2. Implement the battle engine integration
3. Add sprite loading and caching
4. Test with real battle logs
5. Optimize performance
6. Add more features (sound, more controls, etc.)

## Getting Help

- [Pokemon Showdown Discord](https://discord.gg/pokemonshowdown)
- [@pkmn GitHub](https://github.com/pkmn/ps)
- [Pokemon Showdown Development](https://github.com/smogon/pokemon-showdown)
