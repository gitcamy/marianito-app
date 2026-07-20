import { Entry, Friend } from '@/types/models';

/** The mock current user always gets id 'me' so seed data can reference them. */
export const ME_ID = 'me';

export const SEED_FRIENDS: Friend[] = [
  { id: 'f1', displayName: 'Ana Etxeberria', username: 'ana', avatarUri: null, isNearby: true, isFriend: true, isBlocked: false },
  { id: 'f2', displayName: 'Mikel Aguirre', username: 'mikel', avatarUri: null, isNearby: true, isFriend: true, isBlocked: false },
  { id: 'f3', displayName: 'June Ibarra', username: 'june', avatarUri: null, isNearby: true, isFriend: true, isBlocked: false },
  { id: 'f4', displayName: 'Leire Otxoa', username: 'leire', avatarUri: null, isNearby: false, isFriend: true, isBlocked: false },
  { id: 'f5', displayName: 'Iñigo Zubiri', username: 'inigo', avatarUri: null, isNearby: false, isFriend: true, isBlocked: false },
  { id: 'f6', displayName: 'Nerea Salaberria', username: 'nerea', avatarUri: null, isNearby: false, isFriend: false, isBlocked: false },
  { id: 'f7', displayName: 'Oier Mendieta', username: 'oier', avatarUri: null, isNearby: false, isFriend: false, isBlocked: false },
  { id: 'f8', displayName: 'Maialen Urrutia', username: 'maialen', avatarUri: null, isNearby: false, isFriend: false, isBlocked: false },
];

/**
 * Seeded entries keep the demo journal alive (D3–D5) and make the C3
 * "you were tagged" flow demoable on one device (entry s2: a friend initiated,
 * the current user is a tagged co-signer who hasn't appended yet).
 * photoUri uses the local `seed:` scheme — rendered as an offline placeholder tile.
 */
export const SEED_ENTRIES: Entry[] = [
  {
    id: 's1',
    photoUri: 'seed:olive',
    caption: 'First vermut of the summer on the terrace.',
    location: 'Casco Viejo, Bilbao',
    initiatorId: ME_ID,
    participantIds: [ME_ID, 'f1', 'f2'],
    appends: [
      { id: 'a1', authorId: 'f1', kind: 'comment', text: 'The olives were unbeatable 🫒', createdAt: '2026-07-05T13:41:00' },
    ],
    startedAt: '2026-07-05T13:12:00',
    isMarianitoHour: true,
    createdAt: '2026-07-05T13:24:00',
  },
  {
    id: 's2',
    photoUri: 'seed:maroon',
    caption: 'Ana set the table — sardines and a cold marianito.',
    location: null,
    initiatorId: 'f1',
    participantIds: ['f1', ME_ID, 'f3'],
    appends: [],
    startedAt: '2026-07-12T18:35:00',
    isMarianitoHour: false,
    createdAt: '2026-07-12T18:47:00',
  },
  {
    id: 's3',
    photoUri: 'seed:paleGreen',
    caption: 'Sunday before the rain came.',
    location: 'Plaza Nueva',
    initiatorId: ME_ID,
    participantIds: [ME_ID, 'f4'],
    appends: [
      { id: 'a2', authorId: 'f4', kind: 'comment', text: 'Next round on me.', createdAt: '2026-06-21T14:20:00' },
    ],
    startedAt: '2026-06-21T13:30:00',
    isMarianitoHour: true,
    createdAt: '2026-06-21T13:55:00',
  },
];
