# Namibia Quest Game

Czysty restart projektu jako retro-przygodowa gra 2D o wyprawie przez Namibie.

Ten projekt nie kontynuuje starego `expedition-chronicles` jako aplikacji/kroniki. Zachowuje tylko trase, wspomnienia i ustalenia projektowe.

## Kierunek

- jedna gra, nie aplikacja turystyczna;
- Phaser.js jako prosty silnik 2D w przegladarce;
- mobile-first, iPhone portrait jako glowny format;
- styl: Retro Illustrated Expedition;
- mapa jako hub przygody;
- wybor postaci + imie;
- uproszczone statystyki RPG: Sila, Spryt, Spokoj, Tempo;
- lokacje jako etapy gry do odblokowania;
- minigry jako pelnoekranowe sceny, nie formularze i kafle aplikacji.

## Pierwszy vertical slice

1. Start.
2. Wybor postaci.
3. Mapa Namibii.
4. Windhoek.
5. Wybor ekwipunku.
6. Pack the 4x4.

## Uruchomienie lokalne

W katalogu projektu:

```bash
python3 -m http.server 8010
```

Potem w przegladarce:

```text
http://localhost:8010
```

Na iPhonie w tej samej sieci:

```text
http://ADRES-MACA:8010
```

Uwaga: Phaser jest na razie ladowany z CDN, wiec do testu potrzebny jest dostep do internetu.

