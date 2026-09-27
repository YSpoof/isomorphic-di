export type Token<T> = abstract new (...args: any[]) => T;

export type Provider<T = any> =
  | {
      provide: Token<T>;
      useClass: new (...args: any[]) => T;
      useValue?: never;
      useFactory?: never;
      transient?: boolean;
    }
  | {
      provide: Token<T>;
      useValue: T;
      useClass?: never;
      useFactory?: never;
      transient?: boolean;
    }
  | {
      provide: Token<T>;
      useFactory: () => T;
      useClass?: never;
      useValue?: never;
      transient?: boolean;
    };

export type Scope = {
  providers: Map<Token<any>, Provider>;
  instances: Map<Token<any>, unknown>;
};
