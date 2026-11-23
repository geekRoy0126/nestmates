/** A household member. Arrays of members are always in join order, which is the tie-break order. */
export type Member = {
  id: string;
  name: string;
};

/** A recurring weekly chore. `weight` is the effort points it is worth (integer 1–5, PRD US2). */
export type Chore = {
  id: string;
  name: string;
  weight: number;
};

/** Money, always an integer number of cents (CLAUDE.md decision 2). */
export type Cents = number;

/** Cumulative effort points per member id. */
export type Points = Readonly<Record<string, number>>;
