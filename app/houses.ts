// Lilly's twelve houses, shared by the classifier prompt (server) and the
// topic picker (client). No "server-only" here: both sides need this list, and
// it is plain reference data with nothing secret in it.

export interface HouseTopic {
  house: number;
  label: string;
  covers: string;
}

export const HOUSE_LABELS: HouseTopic[] = [
  { house: 1, label: "the querent", covers: "the querent's own body, life, health, character; questions about oneself with no other party" },
  { house: 2, label: "money", covers: "the querent's money, movable goods, income, whether they will profit" },
  { house: 3, label: "siblings & short journeys", covers: "brothers, sisters, neighbours, short trips, letters, rumours" },
  { house: 4, label: "home & family", covers: "father, land, houses, property, inheritance, the end of a matter" },
  { house: 5, label: "children & pleasure", covers: "children, pregnancy, gambling, games, pleasure, creative ventures" },
  { house: 6, label: "work & health", covers: "illness, servants, employees, small animals, daily labour and service" },
  { house: 7, label: "partners & opponents", covers: "marriage, love, the other party, spouse, business partners, open enemies, lawsuits, thieves" },
  { house: 8, label: "death & other's money", covers: "death, wills, legacies, the partner's money, debts, dread" },
  { house: 9, label: "travel & learning", covers: "long journeys, foreign lands, religion, law, dreams, study, higher learning" },
  { house: 10, label: "career & authority", covers: "profession, employer, promotion, honour, reputation, the boss, mother, government" },
  { house: 11, label: "friends & hopes", covers: "friends, allies, hopes and wishes, the employer's money" },
  { house: 12, label: "hidden troubles", covers: "secret enemies, imprisonment, self-undoing, large animals, hidden affliction" },
];
