export const HEROES = [
  {
    id: "kira",
    name: "Kira \"Red Dust\" Moyo",
    role: "Kierowczyni i liderka",
    color: 0x9b3f32,
    stats: { sila: 6, spryt: 5, spokoj: 8, tempo: 5 },
    note: "Pewna ręka na szutrze i chłodna głowa, kiedy droga robi się zła.",
    sheet: "assets/characters/sheets/kira-red-dust-moyo.png"
  },
  {
    id: "nia",
    name: "Nia \"Trail\" Kambonde",
    role: "Tropicielka i przewodniczka",
    color: 0x718f42,
    stats: { sila: 5, spryt: 8, spokoj: 7, tempo: 4 },
    note: "Widziała trop, zanim reszta zobaczyła piasek.",
    sheet: "assets/characters/sheets/nia-trail-kambonde.png"
  },
  {
    id: "bruno",
    name: "Bruno \"Cargo Bay\" Krüger",
    role: "Mechanik i logistyk",
    color: 0x315d78,
    stats: { sila: 9, spryt: 6, spokoj: 4, tempo: 5 },
    note: "Ma wszystko, co potrzebne. Czasem nawet za dużo.",
    sheet: "assets/characters/sheets/bruno-cargo-bay-kruger.png"
  },
  {
    id: "celeste",
    name: "Celeste \"Hotelowa\" Ferreira",
    role: "Turystka z przypadku",
    color: 0xc95f70,
    stats: { sila: 3, spryt: 7, spokoj: 6, tempo: 8 },
    note: "Przyjechała jak do hotelu, ale zaskakująco dobrze wychodzi z kłopotów.",
    sheet: "assets/characters/sheets/celeste-hotelowa-ferreira.png"
  },
  {
    id: "tebo",
    name: "Tebo \"Gaduła\" Ndlovu",
    role: "Negocjator i gawędziarz",
    color: 0xd66b24,
    stats: { sila: 4, spryt: 9, spokoj: 5, tempo: 6 },
    note: "Mówi dużo, ale ludzie często kończą rozmowę z uśmiechem.",
    sheet: "assets/characters/sheets/tebo-gadala-ndlovu.png"
  },
  {
    id: "mira",
    name: "Mira \"Migawka\" Nakamura",
    role: "Fotografka i obserwatorka",
    color: 0x6d4b86,
    stats: { sila: 4, spryt: 7, spokoj: 9, tempo: 4 },
    note: "Czeka cierpliwie, aż świat sam ustawi się w dobrym kadrze.",
    sheet: "assets/characters/sheets/mira-migawka-nakamura.png"
  },
  {
    id: "alex",
    name: "Alex \"Błysk\" Carter",
    role: "Kierowca i zwiadowca",
    color: 0xf1eee3,
    stats: { sila: 5, spryt: 6, spokoj: 4, tempo: 9 },
    note: "Najpierw jedzie, potem pyta, czy droga rzeczywiście tam była.",
    sheet: "assets/characters/sheets/alex-blysk-carter.png"
  }
];

export const STAT_LABELS = {
  sila: "Siła",
  spryt: "Spryt",
  spokoj: "Spokój",
  tempo: "Tempo"
};

export const HERO_SHEETS = HEROES.map((hero) => ({
  key: `heroSheet-${hero.id}`,
  path: hero.sheet
}));
