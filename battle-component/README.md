# @pkmn/battle-component

A Web Component for embedding Pokemon Showdown battles with full UI, animations, and interactive choice handling.

## Features

- 🎮 **Interactive Battle UI** - Full battle visualization with animations
- 🎯 **Choice Handling** - Make moves, switches, and team preview selections
- 📡 **Event-Driven API** - Listen to battle state changes and choice requests
- 🔌 **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
- 📦 **Self-Contained** - All battle logic and rendering in one component
- 🎨 **Customizable** - Shadow DOM with CSS custom properties support

## Installation

```bash
npm install @pkmn/battle-component
```

## Quick Start

### HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@pkmn/battle-component';
  </script>
</head>
<body>
  <pokemon-battle id="battle" interactive></pokemon-battle>

  <script>
    const battle = document.getElementById('battle');

    // Feed battle log
    battle.log = `|player|p1|Alice
|player|p2|Bob
|teamsize|p1|6
|teamsize|p2|6`;

    // Listen for choice requests
    battle.addEventListener('choice-request', (e) => {
      console.log('Choices available:', e.detail.availableChoices);
    });

    // Listen for choices made
    battle.addEventListener('choice-made', (e) => {
      if (e.detail.complete) {
        console.log('Send to server:', e.detail.complete);
      }
    });
  </script>
</body>
</html>
```

### TypeScript

```typescript
import '@pkmn/battle-component';
import type { PokemonBattleElement, ChoiceRequestDetail } from '@pkmn/battle-component';

const battle = document.createElement('pokemon-battle') as PokemonBattleElement;
battle.setAttribute('interactive', '');

battle.addEventListener('choice-request', (e: CustomEvent<ChoiceRequestDetail>) => {
  console.log('Request type:', e.detail.requestType);
  console.log('Available choices:', e.detail.availableChoices);
});

battle.addEventListener('choice-made', (e) => {
  if (e.detail.complete) {
    // Send to Pokemon Showdown server
    sendToServer(e.detail.complete);
  }
});

document.body.appendChild(battle);
```

### React

```tsx
import { useRef, useEffect } from 'react';
import '@pkmn/battle-component';
import type { PokemonBattleElement } from '@pkmn/battle-component';

function BattleComponent() {
  const battleRef = useRef<PokemonBattleElement>(null);

  useEffect(() => {
    const battle = battleRef.current;
    if (!battle) return;

    const handleChoiceRequest = (e: CustomEvent) => {
      console.log('Choice request:', e.detail);
    };

    const handleChoiceMade = (e: CustomEvent) => {
      if (e.detail.complete) {
        console.log('Send to server:', e.detail.complete);
      }
    };

    battle.addEventListener('choice-request', handleChoiceRequest);
    battle.addEventListener('choice-made', handleChoiceMade);

    // Feed battle log
    battle.log = '|player|p1|Alice\n|player|p2|Bob';

    return () => {
      battle.removeEventListener('choice-request', handleChoiceRequest);
      battle.removeEventListener('choice-made', handleChoiceMade);
    };
  }, []);

  return <pokemon-battle ref={battleRef} interactive />;
}
```

### Vue

```vue
<template>
  <pokemon-battle
    ref="battle"
    interactive
    @choice-request="handleChoiceRequest"
    @choice-made="handleChoiceMade"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import '@pkmn/battle-component';
import type { PokemonBattleElement } from '@pkmn/battle-component';

const battle = ref<PokemonBattleElement>();

onMounted(() => {
  if (battle.value) {
    battle.value.log = '|player|p1|Alice\n|player|p2|Bob';
  }
});

function handleChoiceRequest(e: CustomEvent) {
  console.log('Choice request:', e.detail);
}

function handleChoiceMade(e: CustomEvent) {
  if (e.detail.complete) {
    console.log('Send to server:', e.detail.complete);
  }
}
</script>
```

## API

### Element: `<pokemon-battle>`

#### Attributes

- `interactive` - Enable interactive mode with choice controls
- `mode` - Set mode: `"replay"` or `"live"` (default: `"live"`)

#### Properties

##### `log: string`

Set the battle protocol log. Can be set multiple times to append more lines.

```javascript
battle.log = '|player|p1|Alice\n|player|p2|Bob';
```

##### `state: BattleStateDetail | null`

Get the current battle state (read-only).

```javascript
const state = battle.state;
console.log(state.turn);  // Current turn number
console.log(state.p1);    // Player 1 data
console.log(state.ended); // Whether battle has ended
```

#### Methods

##### `appendLog(lines: string): void`

Append battle protocol lines to the battle.

```javascript
battle.appendLog('|turn|1\n|move|p1a: Pikachu|Thunderbolt|p2a: Charizard');
```

##### `makeChoice(choice: string): boolean`

Make a battle choice programmatically. Returns `true` if successful.

```javascript
battle.makeChoice('move 1');        // Use move 1
battle.makeChoice('move 1 mega');   // Use move 1 with Mega Evolution
battle.makeChoice('switch 2');      // Switch to pokemon 2
battle.makeChoice('move 1 dynamax'); // Dynamax and use move 1
```

##### `play(): void`

Play the battle (for replays).

##### `pause(): void`

Pause the battle (for replays).

##### `reset(): void`

Reset the battle to initial state.

#### Events

##### `choice-request`

Fired when the server requests a choice from the player.

```typescript
interface ChoiceRequestDetail {
  request: any;                    // Raw request object
  availableChoices: string[];      // Available choice strings
  requestType: 'move' | 'switch' | 'team' | 'wait';
}

battle.addEventListener('choice-request', (e: CustomEvent<ChoiceRequestDetail>) => {
  console.log('Request type:', e.detail.requestType);
  console.log('Available choices:', e.detail.availableChoices);
});
```

##### `choice-made`

Fired when a choice is made (either via UI or programmatically).

```typescript
interface ChoiceMadeDetail {
  choice: string;      // The individual choice (e.g., "move 1 mega")
  complete?: string;   // Complete choice string if done (e.g., "/choose move 1, switch 2")
  isDone: boolean;     // Whether all required choices are complete
}

battle.addEventListener('choice-made', (e: CustomEvent<ChoiceMadeDetail>) => {
  if (e.detail.complete) {
    // Send complete choice to Pokemon Showdown server
    websocket.send(e.detail.complete);
  }
});
```

##### `state-change`

Fired when the battle state changes (turn, HP, status, etc.).

```typescript
battle.addEventListener('state-change', (e: CustomEvent<BattleStateDetail>) => {
  console.log('Turn:', e.detail.turn);
});
```

## Choice Format

Choices follow Pokemon Showdown's protocol format:

### Move Choices

```
move 1              - Use move 1
move 1 mega         - Mega evolve and use move 1
move 1 megax        - Mega evolve X and use move 1
move 1 megay        - Mega evolve Y and use move 1
move 1 zmove        - Use move 1 as Z-move
move 1 dynamax      - Dynamax and use move 1
move 1 terastallize - Terastallize and use move 1
move 1 +1           - Use move 1 targeting ally in slot 1
move 1 -1           - Use move 1 targeting foe in slot 1
```

### Switch Choices

```
switch 2            - Switch to pokemon in slot 2
```

### Team Preview

```
team 1              - Lead with pokemon in slot 1
```

### Multiple Choices

When multiple pokemon are active (doubles, triples), separate choices with commas:

```
/choose move 1, move 2
/choose move 1, switch 2
```

## Battle Protocol

The component accepts Pokemon Showdown's battle protocol format. Key message types:

```
|player|PLAYER|USERNAME     - Set player info
|teamsize|PLAYER|NUMBER     - Set team size
|gametype|TYPE              - Set game type (singles, doubles, etc.)
|gen|GENERATION             - Set generation
|turn|NUMBER                - Start turn
|move|POKEMON|MOVE|TARGET   - Pokemon uses move
|switch|POKEMON|DETAILS|HP  - Pokemon switches in
|faint|POKEMON              - Pokemon faints
|request|JSON               - Server requests a choice
```

See [Pokemon Showdown Protocol Documentation](https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md) for complete protocol details.

## Integration with Pokemon Showdown Server

To use this component with a real Pokemon Showdown server:

```typescript
import '@pkmn/battle-component';

const ws = new WebSocket('ws://localhost:8000/showdown/websocket');
const battle = document.querySelector('pokemon-battle');

ws.onmessage = (event) => {
  const messages = event.data.split('\n');
  messages.forEach(msg => {
    if (msg.startsWith('|')) {
      battle.appendLog(msg);
    }
  });
};

battle.addEventListener('choice-made', (e) => {
  if (e.detail.complete) {
    ws.send(e.detail.complete);
  }
});
```

## Styling

The component uses Shadow DOM, but exposes CSS custom properties for theming:

```css
pokemon-battle {
  --battle-bg: #a8b0d8;
  --battle-log-bg: #f4f4f4;
  --battle-log-height: 200px;
  --button-bg: #4CAF50;
  --button-hover-bg: #45a049;
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any browser with Web Components support

## Related Projects

- [@pkmn/client](https://github.com/pkmn/ps/tree/main/client) - Battle engine
- [@pkmn/protocol](https://github.com/pkmn/ps/tree/main/protocol) - Protocol parser
- [@pkmn/dex](https://github.com/pkmn/ps/tree/main/dex) - Pokemon data
- [Pokemon Showdown](https://github.com/smogon/pokemon-showdown) - Official server

## License

MIT License - Based on Pokemon Showdown's battle engine (also MIT licensed)

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Examples

See the [example.html](./example.html) file for a complete working demo.
