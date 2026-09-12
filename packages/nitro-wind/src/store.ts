export interface SnapshotStore<T> {
	get(): T;
	set(next: T): void;
	update(next: T): void;
	notify(): void;
	subscribe(listener: () => void): () => void;
}

export function createSnapshotStore<T>(initial: T): SnapshotStore<T> {
	let snapshot = initial;
	const listeners = new Set<() => void>();
	return {
		get: () => snapshot,
		set: (next) => {
			if (Object.is(snapshot, next)) return;
			snapshot = next;
			for (const listener of listeners) listener();
		},
		update: (next) => {
			if (Object.is(snapshot, next)) return;
			snapshot = next;
		},
		notify: () => {
			for (const listener of listeners) listener();
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
}

export const noopSubscribe = (): (() => void) => () => {};
