import {
	type ColorScheme,
	DEFAULT_STYLE_CONTEXT,
	type PlatformName,
	type StyleContext,
	ThemeTransitionPreset,
	type ThemeTransitionOptions,
} from "nitro-wind-core";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { Appearance, I18nManager, Platform, View } from "react-native";
import { setEngineThemeName } from "./engine";
import { getWindowSize } from "./layout";
import { type SnapshotStore, createSnapshotStore } from "./store";
import { ThemeTransitionOverlay, requestThemeTransition } from "./transitions";

export interface GroupState {
	active: boolean;
	focus: boolean;
	hover: boolean;
}

export interface InteractionState {
	pressed: boolean;
	hovered: boolean;
	focused: boolean;
	disabled: boolean;
}

const DEFAULT_GROUP: GroupState = { active: false, focus: false, hover: false };
const DEFAULT_INTERACTION: InteractionState = {
	pressed: false,
	hovered: false,
	focused: false,
	disabled: false,
};

export interface NitroWindContextValue {
	theme: ColorScheme;
	setTheme: (theme: ColorScheme, options?: ThemeTransitionOptions) => void;
	group: GroupState;
	interaction: InteractionState;
	context: StyleContext;
	scopedTheme?: ColorScheme | null;
	scopedVariables?: Record<string, string | number> | null;
	scopedRTL?: boolean | null;
}

type WindStore = SnapshotStore<NitroWindContextValue>;

const NitroWindStoreContext = createContext<WindStore | null>(null);

let hasAdaptiveThemes = true;

export function getHasAdaptiveThemes(): boolean {
	return hasAdaptiveThemes;
}

export function setHasAdaptiveThemes(value: boolean): void {
	hasAdaptiveThemes = value;
}

function readScheme(): ColorScheme {
	return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

function windowSize(): { width: number; height: number } {
	return getWindowSize();
}

function makeValue(
	theme: ColorScheme,
	group: GroupState,
	interaction: InteractionState,
	setTheme: (theme: ColorScheme, options?: ThemeTransitionOptions) => void,
	scopedTheme?: ColorScheme | null,
	scopedVariables?: Record<string, string | number> | null,
	scopedRTL?: boolean | null,
): NitroWindContextValue {
	const { width, height } = windowSize();
	const effectiveTheme = scopedTheme ?? theme;
	const isRTL = scopedRTL != null ? scopedRTL : I18nManager.isRTL;
	return {
		theme,
		setTheme,
		group,
		interaction,
		scopedTheme: scopedTheme ?? null,
		scopedVariables: scopedVariables ?? null,
		scopedRTL: scopedRTL ?? null,
		context: {
			...DEFAULT_STYLE_CONTEXT,
			colorScheme: effectiveTheme,
			platform: Platform.OS as PlatformName,
			width,
			height,
			isRTL,
			pressed: interaction.pressed,
			hovered: interaction.hovered,
			focused: interaction.focused,
			disabled: interaction.disabled,
			groupActive: group.active,
			groupFocus: group.focus,
			groupHover: group.hover,
		},
	};
}

function sameGroup(a: GroupState, b: GroupState): boolean {
	return a.active === b.active && a.focus === b.focus && a.hover === b.hover;
}

function sameInteraction(a: InteractionState, b: InteractionState): boolean {
	return (
		a.pressed === b.pressed &&
		a.hovered === b.hovered &&
		a.focused === b.focused &&
		a.disabled === b.disabled
	);
}

function sameContextValue(a: NitroWindContextValue, b: NitroWindContextValue): boolean {
	return (
		a.theme === b.theme &&
		a.setTheme === b.setTheme &&
		a.scopedTheme === b.scopedTheme &&
		a.scopedRTL === b.scopedRTL &&
		a.scopedVariables === b.scopedVariables &&
		sameGroup(a.group, b.group) &&
		sameInteraction(a.interaction, b.interaction) &&
		a.context.width === b.context.width &&
		a.context.height === b.context.height
	);
}

function writeStore(store: WindStore, next: NitroWindContextValue): void {
	if (sameContextValue(store.get(), next)) {
		return;
	}
	store.set(next);
}

function useSyncedStore(next: NitroWindContextValue): WindStore {
	const [store] = useState<WindStore>(() => createSnapshotStore(next));
	const changedRef = useRef(false);

	if (!sameContextValue(store.get(), next)) {
		store.update(next);
		changedRef.current = true;
	}

	useEffect(() => {
		if (changedRef.current) {
			changedRef.current = false;
			store.notify();
		}
	});

	return store;
}

const fallbackSetTheme = (
	theme: ColorScheme,
	options?: ThemeTransitionOptions,
): void => {
	const prev = fallbackStore.get();
	const resolvedTheme = theme === "system" ? readScheme() : theme;
	if (theme === "system") {
		hasAdaptiveThemes = true;
	} else {
		hasAdaptiveThemes = false;
	}
	if (prev.theme === resolvedTheme) return;

	const commitTheme = () => {
		setEngineThemeName(resolvedTheme);
		writeStore(
			fallbackStore,
			makeValue(
				resolvedTheme,
				prev.group,
				prev.interaction,
				fallbackSetTheme,
				prev.scopedTheme,
				prev.scopedVariables,
				prev.scopedRTL,
			),
		);
	};

	if (options?.preset != null && options.preset !== ThemeTransitionPreset.None) {
		const handled = requestThemeTransition({
			fromTheme: prev.theme,
			toTheme: resolvedTheme,
			preset: options.preset,
			duration: options.duration ?? 400,
			origin: options.origin,
			overlayColor: (options as { overlayColor?: string }).overlayColor,
			onCommit: commitTheme,
		});
		if (!handled) {
			commitTheme();
		}
		return;
	}

	commitTheme();
};

const fallbackStore: WindStore = createSnapshotStore(
	makeValue("light", DEFAULT_GROUP, DEFAULT_INTERACTION, fallbackSetTheme),
);

let activeSetTheme: (theme: ColorScheme, options?: ThemeTransitionOptions) => void = fallbackSetTheme;
let activeGetTheme: () => ColorScheme = () => fallbackStore.get().theme;

export function getActiveTheme(): ColorScheme {
	return activeGetTheme();
}

export function setActiveTheme(
	theme: ColorScheme,
	options?: ThemeTransitionOptions,
): void {
	activeSetTheme(theme, options);
}

function syncFallbackScheme(scheme: ColorScheme = readScheme()): void {
	const prev = fallbackStore.get();
	if (prev.theme === scheme) return;
	writeStore(fallbackStore, makeValue(scheme, prev.group, prev.interaction, prev.setTheme));
}

syncFallbackScheme();
Appearance.addChangeListener(({ colorScheme }) => {
	syncFallbackScheme(colorScheme === "dark" ? "dark" : "light");
});

export function NitroWindProvider({
	theme: themeProp,
	children,
}: {
	theme?: ColorScheme;
	children: ReactNode;
}) {
	const [store] = useState<WindStore>(() => {
		const scheme = themeProp ?? readScheme();
		const created = createSnapshotStore(
			makeValue(scheme, DEFAULT_GROUP, DEFAULT_INTERACTION, () => {}),
		);
		const setTheme = (next: ColorScheme, options?: ThemeTransitionOptions) => {
			const prev = created.get();
			const resolvedTheme = next === "system" ? readScheme() : next;
			if (next === "system") {
				hasAdaptiveThemes = true;
			} else {
				hasAdaptiveThemes = false;
			}
			if (prev.theme === resolvedTheme) return;

			const commitTheme = () => {
				setEngineThemeName(resolvedTheme);
				writeStore(
					created,
					makeValue(
						resolvedTheme,
						prev.group,
						prev.interaction,
						setTheme,
						prev.scopedTheme,
						prev.scopedVariables,
						prev.scopedRTL,
					),
				);
			};

			if (options?.preset != null && options.preset !== ThemeTransitionPreset.None) {
				const handled = requestThemeTransition({
					fromTheme: prev.theme,
					toTheme: resolvedTheme,
					preset: options.preset,
					duration: options.duration ?? 400,
					origin: options.origin,
					overlayColor: (options as { overlayColor?: string }).overlayColor,
					onCommit: commitTheme,
				});
				if (!handled) {
					commitTheme();
				}
				return;
			}

			commitTheme();
		};
		created.update(makeValue(scheme, DEFAULT_GROUP, DEFAULT_INTERACTION, setTheme));
		setEngineThemeName(scheme);
		return created;
	});

	useEffect(() => {
		activeSetTheme = store.get().setTheme;
		activeGetTheme = () => store.get().theme;
		return () => {
			activeSetTheme = fallbackSetTheme;
			activeGetTheme = () => fallbackStore.get().theme;
		};
	}, [store]);

	const themeChangedRef = useRef(false);

	if (themeProp != null) {
		const prev = store.get();
		if (prev.theme !== themeProp) {
			setEngineThemeName(themeProp);
			store.update(
				makeValue(
					themeProp,
					prev.group,
					prev.interaction,
					prev.setTheme,
					prev.scopedTheme,
					prev.scopedVariables,
					prev.scopedRTL,
				),
			);
			themeChangedRef.current = true;
		}
	}

	useEffect(() => {
		if (themeChangedRef.current) {
			themeChangedRef.current = false;
			store.notify();
		}
	});

	return (
		<NitroWindStoreContext.Provider value={store}>
			<View style={{ flex: 1 }}>
				{children}
				<ThemeTransitionOverlay />
			</View>
		</NitroWindStoreContext.Provider>
	);
}

export function useNitroWindStore(): WindStore {
	return useContext(NitroWindStoreContext) ?? fallbackStore;
}

export function useNitroWind(): NitroWindContextValue {
	const store = useNitroWindStore();
	return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function useUniwind(): { theme: ColorScheme; hasAdaptiveThemes: boolean } {
	const store = useNitroWindStore();
	const env = useSyncExternalStore(store.subscribe, store.get, store.get);
	return {
		theme: env.scopedTheme ?? env.theme,
		hasAdaptiveThemes: env.scopedTheme != null ? false : hasAdaptiveThemes,
	};
}

export function GroupProvider({
	value,
	children,
}: {
	value: GroupState;
	children: ReactNode;
}) {
	const parentStore = useNitroWindStore();
	const parent = useSyncExternalStore(parentStore.subscribe, parentStore.get, parentStore.get);
	const next = makeValue(
		parent.theme,
		value,
		parent.interaction,
		parent.setTheme,
		parent.scopedTheme,
		parent.scopedVariables,
		parent.scopedRTL,
	);
	const store = useSyncedStore(next);
	return <NitroWindStoreContext.Provider value={store}>{children}</NitroWindStoreContext.Provider>;
}

export function InteractionProvider({
	value,
	children,
}: {
	value: Partial<InteractionState>;
	children: ReactNode;
}) {
	const parentStore = useNitroWindStore();
	const parent = useSyncExternalStore(parentStore.subscribe, parentStore.get, parentStore.get);
	const interaction: InteractionState = { ...parent.interaction, ...value };
	const next = makeValue(
		parent.theme,
		parent.group,
		interaction,
		parent.setTheme,
		parent.scopedTheme,
		parent.scopedVariables,
		parent.scopedRTL,
	);
	const store = useSyncedStore(next);
	return <NitroWindStoreContext.Provider value={store}>{children}</NitroWindStoreContext.Provider>;
}

export function ScopedTheme({
	theme,
	children,
}: {
	theme: ColorScheme;
	children: ReactNode;
}) {
	const parentStore = useNitroWindStore();
	const parent = useSyncExternalStore(parentStore.subscribe, parentStore.get, parentStore.get);
	const next = makeValue(
		parent.theme,
		parent.group,
		parent.interaction,
		parent.setTheme,
		theme,
		parent.scopedVariables,
		parent.scopedRTL,
	);
	const store = useSyncedStore(next);
	return <NitroWindStoreContext.Provider value={store}>{children}</NitroWindStoreContext.Provider>;
}

export function ScopedVariables({
	variables,
	children,
}: {
	variables: Record<string, string | number>;
	children: ReactNode;
}) {
	const parentStore = useNitroWindStore();
	const parent = useSyncExternalStore(parentStore.subscribe, parentStore.get, parentStore.get);
	const mergedVars = { ...parent.scopedVariables, ...variables };
	const next = makeValue(
		parent.theme,
		parent.group,
		parent.interaction,
		parent.setTheme,
		parent.scopedTheme,
		mergedVars,
		parent.scopedRTL,
	);
	const store = useSyncedStore(next);
	return <NitroWindStoreContext.Provider value={store}>{children}</NitroWindStoreContext.Provider>;
}

export function LayoutDirection({
	rtl,
	children,
}: {
	rtl: boolean;
	children: ReactNode;
}) {
	const parentStore = useNitroWindStore();
	const parent = useSyncExternalStore(parentStore.subscribe, parentStore.get, parentStore.get);
	const next = makeValue(
		parent.theme,
		parent.group,
		parent.interaction,
		parent.setTheme,
		parent.scopedTheme,
		parent.scopedVariables,
		rtl,
	);
	const store = useSyncedStore(next);
	return (
		<View style={{ direction: rtl ? "rtl" : "ltr" }}>
			<NitroWindStoreContext.Provider value={store}>{children}</NitroWindStoreContext.Provider>
		</View>
	);
}
