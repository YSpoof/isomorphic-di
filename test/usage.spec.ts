import { expect, it } from "vitest";
import { configure, inject } from "quick-di";

abstract class UserRepository {
  abstract getUsers(): string[];
}

class LoggerService {
  readonly lines: string[] = [];

  log(message: string): void {
    this.lines.push(message);
  }
}

class UserService {
  private repo = inject(UserRepository);
  private logger = inject(LoggerService);

  users(): string[] {
    this.logger.log("users");
    return this.repo.getUsers();
  }
}

class InMemoryUserRepository extends UserRepository {
  getUsers(): string[] {
    return ["ada"];
  }
}

it("injects collaborators into a service", () => {
  const logger = new LoggerService();

  configure([
    { provide: UserRepository, useClass: InMemoryUserRepository },
    { provide: LoggerService, useValue: logger },
  ]);

  expect(inject(UserService).users()).toEqual(["ada"]);
  expect(logger.lines).toEqual(["users"]);
});
