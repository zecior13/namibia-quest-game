# Namibia Quest: Character Bible

This is the canonical character base for the game. New screens, maps, minigames and UI portraits must use these identities, silhouettes, palettes and statistics. Do not replace an approved character with a newly invented visual variant without an explicit design decision.

## Shared visual standard

- Late-1990s illustrated adventure-game look.
- Matte, restrained colors and hand-inked dark outlines.
- Readable silhouettes and exaggerated archetypal proportions.
- Lightly humorous, self-aware character design.
- No photorealism, glossy cinematic lighting, generic fashion-model faces or modern app-card presentation.
- Every character has three planned representations: full body, bust portrait and small gameplay sprite.
- Canonical source sheets live in `assets/characters/sheets/`.

## Core cast

### Kira “Red Dust” Moyo

- Role: driver and expedition leader.
- Background: Namibian woman, experienced with rough roads and practical decisions.
- Personality: steady, responsible, calm under pressure.
- Stats: Siła 6, Spryt 5, Spokój 8, Tempo 5.
- Visual identity: dark skin, cropped black hair, red/rust jacket and scarf, steering-wheel mark.
- Base color: rust red.
- Sheet: `assets/characters/sheets/kira-red-dust-moyo.png`.

### Nia “Trail” Kambonde

- Role: tracker and local guide.
- Background: Namibian woman with a strong knowledge of tracks, terrain and hidden routes.
- Personality: observant, patient, quietly confident.
- Stats: Siła 5, Spryt 8, Spokój 7, Tempo 4.
- Visual identity: dark skin, braids with yellow beads, green shirt, ochre vest, red satchel and tracking notebook.
- Base color: green and ochre.
- Sheet: `assets/characters/sheets/nia-trail-kambonde.png`.

### Bruno “Cargo Bay” Krüger

- Role: mechanic and logistics specialist.
- Background: broad, stocky former mechanic who trusts tools, rope and careful packing.
- Personality: strong, practical, dependable, occasionally too cautious.
- Stats: Siła 9, Spryt 6, Spokój 4, Tempo 5.
- Visual identity: red hair and sideburns, blue mechanic coveralls, tool belt, rope and toolbox.
- Base color: steel blue.
- Sheet: `assets/characters/sheets/bruno-cargo-bay-kruger.png`.

### Celeste “Hotelowa” Ferreira

- Role: accidental safari tourist.
- Background: normally travels with a suitcase to hotels and swimming pools, not deserts.
- Personality: stylish, skeptical, resourceful when forced to improvise.
- Stats: Siła 3, Spryt 7, Spokój 6, Tempo 8.
- Visual identity: light brown skin, short curly honey hair, large pale sun hat, turquoise sunglasses, coral-pink jacket and bright pink suitcase.
- Base color: turquoise and coral pink.
- Sheet: `assets/characters/sheets/celeste-hotelowa-ferreira.png`.

### Tebo “Gaduła” Ndlovu

- Role: negotiator and storyteller.
- Background: born in Namibia, with a Mexican father; his face has subtle Latin influence without losing his Namibian identity.
- Personality: talkative, warm, slightly scattered, excellent at bargaining.
- Stats: Siła 4, Spryt 9, Spokój 5, Tempo 6.
- Visual identity: very dark brown skin, broad friendly face, short curls, small moustache, orange vest, navy shirt, yellow neckerchief, notebook, old phone and trade tokens.
- Base color: orange and navy.
- Sheet: `assets/characters/sheets/tebo-gadala-ndlovu.png`.

### Mira “Migawka” Nakamura

- Role: photographer and observer.
- Background: Asian expedition photographer with a patient eye for details and timing.
- Personality: calm, focused, quietly determined.
- Stats: Siła 4, Spryt 7, Spokój 9, Tempo 4.
- Visual identity: East Asian features, warm light-medium skin, black bob haircut with a violet streak, purple windbreaker, cream shirt, camera and shoulder bag.
- Base color: violet and cream.
- Sheet: `assets/characters/sheets/mira-migawka-nakamura.png`.

## Optional additional hero

### Alex “Błysk” Carter

- Role: driver and scout.
- Background: young American or European adventurer who arrived convinced he could handle anything.
- Personality: attractive, overconfident, risk-loving and lightly self-parodic; learns humility from the desert.
- Stats: Siła 5, Spryt 6, Spokój 4, Tempo 9.
- Visual identity: pale skin, bright blue eyes, exaggerated golden-blond fringe, sunglasses, dominant white expedition outfit with turquoise and red accents, suspiciously clean boots and duffel.
- Base color: white.
- Sheet: `assets/characters/sheets/alex-blysk-carter.png`.

## Implementation rules

1. Use `id`, `stats`, `color`, `note` and `sheet` from `src/data/heroes.js` as the canonical data contract.
2. Minigames should use the small sprite or a deliberately cropped part of the canonical sheet, never a new unrelated icon.
3. Map and HUD portraits should use the bust representation from the same sheet.
4. Character-specific advantages should remain soft modifiers; no character should make a minigame trivial or impossible.
5. Keep the dominant palette and silhouette recognizable at small sizes.
