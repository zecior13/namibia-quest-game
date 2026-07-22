export const ROUTE = [
  { id: "windhoek", name: "Windhoek", short: "Windhoek", x: 64, y: 67, kind: "major", scene: "WindhoekScene" },
  { id: "solitaire", name: "Solitaire", short: "Solitaire", x: 50, y: 78, kind: "stage" },
  { id: "sesriem", name: "Sesriem", short: "Sesriem", x: 42, y: 86, kind: "major" },
  { id: "deadvlei", name: "Sossusvlei / Deadvlei", short: "Deadvlei", x: 36, y: 91, kind: "stage" },
  { id: "bigDaddy", name: "Big Daddy", short: "Big Daddy", x: 43, y: 94, kind: "major" },
  { id: "swakopmund", name: "Swakopmund", short: "Swakopmund", x: 26, y: 55, kind: "major" },
  { id: "walvis", name: "Walvis Bay", short: "Walvis Bay", x: 24, y: 61, kind: "major" },
  { id: "sandwich", name: "Sandwich Harbour", short: "Sandwich", x: 28, y: 70, kind: "stage" },
  { id: "skeleton", name: "Skeleton Coast", short: "Wybrzeże Szkieletów", x: 17, y: 42, kind: "major" },
  { id: "capeCross", name: "Cape Cross", short: "Cape Cross", x: 20, y: 49, kind: "stage" },
  { id: "spitzRoad", name: "Droga do Spitzkoppe", short: "Szutrowy rajd", x: 35, y: 50, kind: "road" },
  { id: "spitzkoppe", name: "Spitzkoppe", short: "Spitzkoppe", x: 50, y: 56, kind: "major" },
  { id: "twyfelfontein", name: "Twyfelfontein", short: "Twyfelfontein", x: 45, y: 35, kind: "major" },
  { id: "madisa", name: "Madisa Camp", short: "Madisa Camp", x: 51, y: 40, kind: "stage" },
  { id: "damaraHimba", name: "Damara / Himba", short: "Damara / Himba", x: 58, y: 29, kind: "major" },
  { id: "etosha", name: "Etosha", short: "Etosha", x: 68, y: 18, kind: "major" },
  { id: "mountEtjo", name: "Mount Etjo", short: "Mount Etjo", x: 72, y: 45, kind: "major" },
  { id: "okahandja", name: "Okahandja", short: "Okahandja", x: 69, y: 57, kind: "stage" },
  { id: "daanViljoen", name: "Daan Viljoen", short: "Daan Viljoen", x: 61, y: 63, kind: "stage" },
  { id: "windhoekReturn", name: "Powrót do Windhoek", short: "Windhoek", x: 66, y: 70, kind: "major" }
];

export const ROUTE_INDEX = Object.fromEntries(ROUTE.map((point, index) => [point.id, index]));

export const ROUTE_LABEL_OFFSETS = {
  windhoek: [-74, -8],
  solitaire: [12, 3],
  sesriem: [12, 2],
  deadvlei: [-64, 12],
  bigDaddy: [12, 5],
  swakopmund: [12, -13],
  walvis: [12, 4],
  sandwich: [12, 2],
  skeleton: [12, -14],
  capeCross: [12, 2],
  spitzRoad: [11, -2],
  spitzkoppe: [12, 4],
  twyfelfontein: [12, -11],
  madisa: [12, 7],
  damaraHimba: [12, -11],
  etosha: [12, -8],
  mountEtjo: [12, -8],
  okahandja: [12, 4],
  daanViljoen: [-68, 4],
  windhoekReturn: [12, 4]
};
