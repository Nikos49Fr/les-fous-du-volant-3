export const GP_NAMES = [
  { id: 0, country: '', flag: '', name: '' },
  {
    id: 1,
    country: 'Bahreïn',
    flag: 'bh',
    name: 'Bahrain International Circuit (Sakhir)',
  },
  {
    id: 2,
    country: 'Arabie saoudite',
    flag: 'sa',
    name: 'Jeddah Corniche Circuit',
  },
  {
    id: 3,
    country: 'Australie',
    flag: 'au',
    name: 'Albert Park Grand Prix Circuit (Melbourne)',
  },
  { id: 4, country: 'Japon', flag: 'jp', name: 'Suzuka Circuit' },
  { id: 5, country: 'Chine', flag: 'cn', name: 'Shanghai International Circuit' },
  {
    id: 6,
    country: 'États-Unis',
    flag: 'us',
    name: 'Miami International Autodrome',
  },
  {
    id: 7,
    country: 'Italie',
    flag: 'it',
    name: 'Autodromo Enzo e Dino Ferrari (Imola)',
  },
  { id: 8, country: 'Monaco', flag: 'mc', name: 'Circuit de Monaco' },
  {
    id: 9,
    country: 'Espagne',
    flag: 'es',
    name: 'Circuit de Barcelona-Catalunya',
  },
  {
    id: 10,
    country: 'Canada',
    flag: 'ca',
    name: 'Circuit Gilles-Villeneuve (Montréal)',
  },
  { id: 11, country: 'Autriche', flag: 'at', name: 'Red Bull Ring' },
  {
    id: 12,
    country: 'Royaume-Uni',
    flag: 'gb',
    name: 'Silverstone Circuit',
  },
  {
    id: 13,
    country: 'Belgique',
    flag: 'be',
    name: 'Circuit de Spa-Francorchamps',
  },
  { id: 14, country: 'Hongrie', flag: 'hu', name: 'Hungaroring' },
  { id: 15, country: 'Pays-Bas', flag: 'nl', name: 'Circuit Zandvoort' },
  {
    id: 16,
    country: 'Italie',
    flag: 'it',
    name: 'Autodromo Nazionale Monza',
  },
  {
    id: 17,
    country: 'Azerbaïdjan',
    flag: 'az',
    name: 'Baku City Circuit',
  },
  {
    id: 18,
    country: 'Singapour',
    flag: 'sg',
    name: 'Marina Bay Street Circuit',
  },
  {
    id: 19,
    country: 'États-Unis',
    flag: 'us',
    name: 'Circuit of the Americas (Austin)',
  },
  {
    id: 20,
    country: 'Mexique',
    flag: 'mx',
    name: 'Autódromo Hermanos Rodríguez',
  },
  {
    id: 21,
    country: 'Brésil',
    flag: 'br',
    name: 'Autódromo José Carlos Pace (Interlagos)',
  },
  {
    id: 22,
    country: 'États-Unis',
    flag: 'us',
    name: 'Las Vegas Street Circuit',
  },
  {
    id: 23,
    country: 'Qatar',
    flag: 'qa',
    name: 'Lusail International Circuit',
  },
  {
    id: 24,
    country: 'Abou Dabi',
    flag: 'ae',
    name: 'Yas Marina Circuit',
  },
];

export const GP_DATES = [
  { id: 1, dateTime: '2026-03-08T20:30:00+01:00', label: '8 mars 20h30' },
  { id: 2, dateTime: '2026-03-22T20:30:00+01:00', label: '22 mars 20h30' },
  { id: 3, dateTime: '2026-04-05T20:30:00+02:00', label: '5 avril 20h30' },
  { id: 4, dateTime: '2026-04-19T20:30:00+02:00', label: '19 avril 20h30' },
  { id: 5, dateTime: '2026-05-03T20:30:00+02:00', label: '3 mai 20h30' },
  { id: 6, dateTime: '2026-05-17T20:30:00+02:00', label: '17 mai 20h30' },
  { id: 7, dateTime: '2026-05-31T20:30:00+02:00', label: '31 mai 20h30' },
  { id: 8, dateTime: '2026-06-14T20:30:00+02:00', label: '14 juin 20h30' },
  { id: 9, dateTime: '2026-06-28T20:30:00+02:00', label: '28 juin 20h30' },
  { id: 10, dateTime: '2026-07-12T20:30:00+02:00', label: '12 juillet 20h30' },
  { id: 11, dateTime: '2026-07-26T20:30:00+02:00', label: '26 juillet 20h30' },
  { id: 12, dateTime: '2026-08-09T20:30:00+02:00', label: '9 aout 20h30' },
];

// Index 1..12 map to a GP name id from GP_NAMES.
// 0 means "unknown" (???)
export const GP_REVEALED = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
