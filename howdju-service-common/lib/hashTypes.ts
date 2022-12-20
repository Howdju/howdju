export const HashTypes = { BCRYPT: "BCRYPT", ARGON2: "ARGON2" } as const;
export type HashType = typeof HashTypes[keyof typeof HashTypes];
