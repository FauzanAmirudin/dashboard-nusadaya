import { mock } from "bun:test";

export interface MockDbQueryMethods {
	findFirst: ReturnType<typeof mock>;
	findMany: ReturnType<typeof mock>;
}

export interface MockDb {
	select: ReturnType<typeof mock>;
	insert: ReturnType<typeof mock>;
	update: ReturnType<typeof mock>;
	delete: ReturnType<typeof mock>;
	transaction: <T>(cb: (tx: MockDb) => Promise<T> | T) => Promise<T>;
	execute: ReturnType<typeof mock>;
	query: Record<string, MockDbQueryMethods>;
	// Test utility helpers
	setQueryResult: (
		table: string,
		method: "findFirst" | "findMany",
		result: any,
	) => void;
	resetAll: () => void;
}

/**
 * Creates a chainable mock query builder that resolves to the specified result.
 */
export function createChainableQuery(resolvedValue: any = []) {
	const chain: any = {
		from: mock(() => chain),
		where: mock(() => chain),
		orderBy: mock(() => chain),
		limit: mock(() => chain),
		offset: mock(() => chain),
		set: mock(() => chain),
		values: mock(() => chain),
		returning: mock(() => Promise.resolve(resolvedValue)),
		onConflictDoUpdate: mock(() => chain),
		leftJoin: mock(() => chain),
		rightJoin: mock(() => chain),
		innerJoin: mock(() => chain),
		groupBy: mock(() => chain),
		having: mock(() => chain),
		// biome-ignore lint/suspicious/noThenProperty: intentionally a thenable mock query builder
		then: (resolve: (val: any) => any, reject?: (err: any) => any) =>
			Promise.resolve(resolvedValue).then(resolve, reject),
	};
	return chain;
}

/**
 * Create a mock Drizzle database instance for unit testing.
 */
export function createMockDb(): MockDb {
	const queryTables: Record<string, MockDbQueryMethods> = {};

	const getOrCreateTable = (table: string): MockDbQueryMethods => {
		if (!queryTables[table]) {
			queryTables[table] = {
				findFirst: mock(() => Promise.resolve(null)),
				findMany: mock(() => Promise.resolve([])),
			};
		}
		return queryTables[table];
	};

	// Use Proxy for db.query.* so any table access is automatically handled
	const queryProxy = new Proxy(queryTables, {
		get(target, prop: string) {
			if (typeof prop === "symbol" || prop === "inspect" || prop === "then") {
				return undefined;
			}
			return getOrCreateTable(prop);
		},
	});

	const selectMock = mock(() => createChainableQuery([]));
	const insertMock = mock(() => createChainableQuery([{ id: 1 }]));
	const updateMock = mock(() => createChainableQuery([{ id: 1 }]));
	const deleteMock = mock(() => createChainableQuery([{ id: 1 }]));
	const executeMock = mock(() => Promise.resolve([]));

	const transactionMock = mock(async (cb: (tx: MockDb) => any) => {
		return await cb(mockDb);
	});

	const mockDb: MockDb = {
		select: selectMock,
		insert: insertMock,
		update: updateMock,
		delete: deleteMock,
		execute: executeMock,
		transaction: transactionMock as unknown as <T>(
			cb: (tx: MockDb) => Promise<T> | T,
		) => Promise<T>,
		query: queryProxy,

		setQueryResult(
			table: string,
			method: "findFirst" | "findMany",
			result: any,
		) {
			const tbl = getOrCreateTable(table);
			tbl[method].mockImplementation(() => Promise.resolve(result));
		},

		resetAll() {
			selectMock.mockClear();
			insertMock.mockClear();
			updateMock.mockClear();
			deleteMock.mockClear();
			executeMock.mockClear();
			for (const key of Object.keys(queryTables)) {
				queryTables[key].findFirst.mockClear();
				queryTables[key].findMany.mockClear();
			}
		},
	};

	return mockDb;
}
