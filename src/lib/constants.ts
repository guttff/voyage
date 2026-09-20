import type { CatKey, Option } from './types';

export const STORAGE_KEY = 'voyage.app.v1';

export const CATS: Record<CatKey, { label: string; icon: string }> = {
  flight: {
    label: 'Flight',
    icon: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  },
  hotel: { label: 'Hotel', icon: 'M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9' },
  transport: {
    label: 'Transport',
    icon: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M9 17H15M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  },
  food: { label: 'Food', icon: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7' },
  activity: { label: 'Activities', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z' },
};

export const CAT_KEYS = Object.keys(CATS) as CatKey[];

export const NAV_ICONS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trips: 'M14.1 5.9 9.4 4.1a1 1 0 0 0-.8 0L3.6 6a1 1 0 0 0-.6.9V20l6-2.4 6 2.4 6-2.4V4l-6 2.4M9 4v14M15 6v14',
  budget: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  io: 'm21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16',
  settings:
    'M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.6a2 2 0 0 1-1 1.8l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.6a2 2 0 0 1 1-1.8l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
};

export const PEOPLE_ICON =
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8';
export const CHECK_ICON = 'M20 6 9 17l-5-5';
export const COMPASS_ICON = 'm16.2 7.8-2 6.3-6.4 2.1 2-6.3z';
export const IMPORT_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
export const EXPORT_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12';

/** Category names an outside tool (ChatGPT, an old export) is likely to emit. */
export const ALIAS: Record<string, CatKey> = {
  transportation: 'transport',
  car: 'transport',
  taxi: 'transport',
  uber: 'transport',
  train: 'transport',
  lodging: 'hotel',
  accommodation: 'hotel',
  stay: 'hotel',
  activities: 'activity',
  tour: 'activity',
  excursion: 'activity',
  restaurant: 'food',
  dining: 'food',
  meal: 'food',
  flights: 'flight',
  air: 'flight',
};

export const total = (o: Pick<Option, 'items'>) =>
  o.items.reduce((a, b) => a + (Number(b.cost) || 0), 0);
