export class NotImplementedError extends Error {
  constructor(message = "Not implemented") {
    super(message);
    this.name = "NotImplementedError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
