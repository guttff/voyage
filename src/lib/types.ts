export type CatKey = 'flight' | 'hotel' | 'transport' | 'food' | 'activity';

export type Person = {
  id: string;
  name: string;
  role: string;
};

export type Item = {
  id: string;
  /** ISO yyyy-mm-dd, always inside the trip's start..end range. */
  date: string;
  /** 24h HH:mm, or '' when the item has no set time. */
  time: string;
  note: string;
  cat: CatKey;
  title: string;
  cost: number;
  /** Display name of whoever added it. */
  by: string;
  /** Set on copies: the name of the option the item came from. */
  from?: string;
  /** Position within its day. Seeded from `time`; a drag sets it outright. */
  order?: number;
};

export type Option = {
  id: string;
  name: string;
  /** null on the Final plan, which belongs to both travelers. */
  author: string | null;
  /** Set when the option belongs to one of the two people. */
  personId?: string;
  final?: boolean;
  items: Item[];
};

export type Vacation = {
  id: string;
  name: string;
  start: string;
  end: string;
  /** options[0] is always the Final (merged) plan. */
  options: Option[];
};

export type Rule = {
  id: string;
  /** The rule takes effect on this date and holds until a later rule starts. */
  from: string;
  p1: number;
  p2: number;
};

export type Budget = {
  saved: number;
  rules: Rule[];
};

export type ActivityEntry = {
  t: number;
  text: string;
};

export type AppData = {
  people: Person[];
  /** id of the person currently planning. */
  user: string;
  vacations: Vacation[];
  budget: Budget;
  duotone: boolean;
  activity: ActivityEntry[];
};

export type Page = 'home' | 'trips' | 'trip' | 'budget' | 'settings';
export type TripTab = 'plans' | 'itinerary' | 'compare' | 'io';

export type Route = {
  page: Page;
  vacId?: string;
  tab: TripTab;
};

export type ItemForm = {
  date: string;
  time: string;
  cat: CatKey;
  title: string;
  note: string;
  cost: string;
};

export type NewVacForm = { name: string; start: string; end: string };
export type RuleForm = { from: string; p1: string; p2: string };

export type PanelKind = 'add' | 'copy' | 'newvac' | 'confirm';

export type Confirm = {
  title: string;
  body: string;
  label: string;
  go: () => void;
};

/** The JSON an option exports to, and the shape the importer writes back. */
export type OptionJson = {
  schema: 'voyage.option.v1';
  vacation: string;
  name: string;
  author: string;
  start: string;
  end: string;
  currency: 'USD';
  items: {
    day: number;
    date: string;
    time: string;
    category: CatKey;
    title: string;
    note: string;
    cost: number;
  }[];
};

export type Backup = {
  schema: 'voyage.backup.v1';
  exported: string;
  people: Person[];
  vacations: Vacation[];
  budget: Budget;
  activity: ActivityEntry[];
  /** slot id -> data URL. Absent in backups taken before photos were stored. */
  images?: Record<string, string>;
};
