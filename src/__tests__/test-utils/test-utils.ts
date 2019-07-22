type ContextCallback<T> = (context: T) => Promise<void>;

export function beforeAllWithContext<T>(
  callback: () => Promise<T>,
): Promise<T> {
  return new Promise((resole, reject) => {
    beforeAll(() => callback().then(resole, reject));
  });
}

export function afterAllWithContext<T>(
  context: Promise<T>,
  callback: ContextCallback<T>,
) {
  afterAll(() => context.then(callback));
}

export function beforeEachWithContext<T>(
  callback: () => Promise<T>,
): Promise<T> {
  return new Promise((resole, reject) => {
    beforeEach(() => callback().then(resole, reject));
  });
}

export function afterEachWithContext<T>(
  context: Promise<T>,
  callback: ContextCallback<T>,
) {
  afterEach(() => context.then(callback));
}

export function describeWithContext<T>(
  name: string,
  context: Promise<T>,
  fn: ContextCallback<T>,
) {
  describe(name, async () => fn(await context));
}

export function itWithContext<T>(
  name: string,
  context: Promise<T>,
  fn: ContextCallback<T>,
) {
  it(name, async () => fn(await context));
}

export function testWithContext<T>(
  name: string,
  context: Promise<T>,
  fn: ContextCallback<T>,
) {
  test(name, async () => fn(await context));
}
