# quick-di

**Quick dependency injection** — minimal DI for Node, Bun, Deno, and the browser. Class tokens, `inject()`, no decorators, no `reflect-metadata`.

## Features

- `inject()` inside classes instead of constructor arguments
- `useClass`, `useValue`, and `useFactory`
- Singletons by default, `transient: true` when you want a new instance
- `runInScope()` for request or test overrides
- Works in Node, Bun, Deno, and the browser
- Zero dependencies

## Installation

```bash
pnpm add quick-di
```

## Usage

### Inject

Contracts are abstract classes. Concrete classes with no provider are created with `new`.

```ts
import { configure, inject, runInScope } from "quick-di";

export abstract class UserRepository {
  abstract getUsers(): string[];
}

export class UserService {
  private repo = inject(UserRepository);
  private logger = inject(LoggerService);

  users(): string[] {
    this.logger.log("users");
    return this.repo.getUsers();
  }
}
```

### Configure

```ts
class InMemoryUserRepository extends UserRepository {
  getUsers(): string[] {
    return ["ada"];
  }
}

class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}

class Config {
  constructor(readonly env: string) {}
}

configure([
  { provide: UserRepository, useClass: InMemoryUserRepository },
  { provide: LoggerService, useValue: { log: console.log } },
  { provide: Config, useFactory: () => new Config("dev"), transient: true },
]);

const service = inject(UserService);
```

`configure` merges providers. Registering a token again drops its cached singleton.

Abstract classes must be configured. TypeScript erases the `abstract` keyword, so an unconfigured abstract token cannot be rejected reliably at runtime.

### Request scope

`runInScope` checks its own providers first, then the global container. It does not replace global registrations.

A configured singleton is cached on the container that registered it. An auto-created class is cached on the active scope, or on the global container when there is no scope. A global singleton that already exists is reused inside a scope, so construct process-wide services at startup if they must be shared. Nested `runInScope` calls do not see the outer scope.

```ts
class MockRepo extends UserRepository {
  getUsers(): string[] {
    return ["mock"];
  }
}

runInScope([{ provide: UserRepository, useClass: MockRepo }], () => {
  const scoped = inject(UserService);
  return scoped.users();
});
```

On Node, Bun, and Deno the scope follows `async`/`await`. In the browser there is no `AsyncLocalStorage`, so the scope is synchronous only: it ends when the callback returns, including when the callback returns a promise.

## API

```ts
type Token<T> = abstract new (...args: any[]) => T;

type Provider<T = any> =
  | {
      provide: Token<T>;
      useClass: new (...args: any[]) => T;
      transient?: boolean;
    }
  | {
      provide: Token<T>;
      useValue: T;
      transient?: boolean;
    }
  | {
      provide: Token<T>;
      useFactory: () => T;
      transient?: boolean;
    };

function inject<T>(token: Token<T>): T;

function configure(providers: readonly Provider[]): void;

function runInScope<T>(providers: readonly Provider[], fn: () => T): T;
```

`inject(Token)` returns `T`.

## Source Code

MIT licensed — contribute on [GitHub](https://github.com/yspoof/quick-di).
