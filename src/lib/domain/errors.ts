export type DomainErrorCode =
  | "INVALID_WEIGHT"
  | "DUPLICATE_MEMBER"
  | "UNKNOWN_MEMBER"
  | "NO_MEMBERS"
  | "INVALID_AMOUNT"
  | "NO_PARTICIPANTS"
  | "INVALID_SHARES"
  | "EXACT_MISMATCH"
  | "UNBALANCED"
  | "TOO_MANY_MEMBERS";

/** Thrown by domain functions for invalid input; the UI maps `code` to a message (CLAUDE.md decision 4). */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
