import { useState } from "react";
import { type GestureResponderEvent, Pressable, ScrollView, Text, View } from "react-native";
import { isNativeEngineAvailable } from "./engine";
import { useNitroWind } from "./provider";
import { styled } from "./styled";
import { ThemeTransitionPreset } from "./transitions";
import { useStyle } from "./useStyle";

const Screen = styled(View);
const Card = styled(View);
const Title = styled(Text);
const Body = styled(Text);
const Button = styled(Pressable);
const Label = styled(Text);
const Row = styled(View);
const Box = styled(View);
const Span = styled(Text);
const Swatch = styled(View);
const AnimatedCard = styled(View);

const SWATCHES = [
	"bg-red-500",
	"bg-orange-500",
	"bg-amber-400",
	"bg-green-500",
	"bg-sky-500",
	"bg-indigo-500",
	"bg-fuchsia-500",
] as const;

const THEMES = [
	{ id: "dark", label: "Dark", bg: "#09090b", color: "#ffffff" },
	{ id: "light", label: "Light", bg: "#ffffff", color: "#0f172a" },
	{ id: "coffee", label: "Coffee", bg: "#1f1610", color: "#fef3c7" },
	{ id: "emerald", label: "Emerald", bg: "#022c22", color: "#a7f3d0" },
	{ id: "ocean", label: "Ocean", bg: "#082f49", color: "#bae6fd" },
] as const;

const TRANSITION_PRESETS = [
	{ preset: ThemeTransitionPreset.CircleCenter, name: "Circle Center" },
	{ preset: ThemeTransitionPreset.CircleFromOrigin, name: "Circle Origin" },
	{ preset: ThemeTransitionPreset.CircleTopRight, name: "Circle Top-R" },
	{ preset: ThemeTransitionPreset.CircleBottomLeft, name: "Circle Bot-L" },
	{ preset: ThemeTransitionPreset.SlideFromOrigin, name: "Slide Origin" },
	{ preset: ThemeTransitionPreset.SlideRightToLeft, name: "Slide R→L" },
	{ preset: ThemeTransitionPreset.SlideLeftToRight, name: "Slide L→R" },
	{ preset: ThemeTransitionPreset.Fade, name: "Fade" },
	{ preset: ThemeTransitionPreset.Blur, name: "Blur" },
	{ preset: ThemeTransitionPreset.BlurFromOrigin, name: "Blur Origin" },
	{ preset: ThemeTransitionPreset.None, name: "Instant" },
] as const;

export interface NitroWindShowcaseProps {
	badge: string;
	subtitle: string;
}

function ThemeTransitionsDemo() {
	const { theme, setTheme } = useNitroWind();
	const [activePreset, setActivePreset] = useState<ThemeTransitionPreset>(
		ThemeTransitionPreset.CircleCenter,
	);

	return (
		<Card className="mt-4 rounded-2xl p-4 bg-slate-800 border border-slate-700">
			<Body className="text-sky-400 font-bold text-xs uppercase tracking-wider">
				Animated Theme Transitions
			</Body>
			<Title className="text-white text-base font-bold mt-1">
				Active Theme: <Span className="text-amber-400">{theme}</Span>
			</Title>
			<Body className="text-slate-400 text-xs mt-1">
				Select a preset, then tap any theme to trigger a smooth native/web view transition.
			</Body>

			{/* Transition Preset Selector */}
			<Body className="text-slate-300 font-bold text-xs mt-3 mb-2">Preset:</Body>
			<Row className="flex-row flex-wrap gap-1.5">
				{TRANSITION_PRESETS.map((item) => {
					const isSelected = activePreset === item.preset;
					return (
						<Button
							key={item.name}
							className={`rounded-lg px-2.5 py-1.5 ${
								isSelected ? "bg-sky-500" : "bg-slate-700 active:bg-slate-600"
							}`}
							onPress={() => setActivePreset(item.preset)}
						>
							<Label
								className={`text-xs font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}
							>
								{item.name}
							</Label>
						</Button>
					);
				})}
			</Row>

			{/* Theme Triggers */}
			<Body className="text-slate-300 font-bold text-xs mt-3 mb-2">Switch To:</Body>
			<Row className="flex-row flex-wrap gap-2">
				{THEMES.map((t) => {
					const isActive = theme === t.id;
					return (
						<Button
							key={t.id}
							className={`flex-row items-center rounded-xl px-3 py-2 border ${
								isActive
									? "border-sky-400 bg-slate-700"
									: "border-slate-600 bg-slate-900 active:bg-slate-700"
							}`}
							onPress={(e: GestureResponderEvent) => {
								const { pageX, pageY } = e.nativeEvent;
								const origin = pageX != null && pageY != null ? { x: pageX, y: pageY } : undefined;
								setTheme(t.id, { preset: activePreset, duration: 400, origin });
							}}
						>
							<View
								style={{
									width: 12,
									height: 12,
									borderRadius: 6,
									backgroundColor: t.bg,
									marginRight: 6,
									borderWidth: 1,
									borderColor: "#94a3b8",
								}}
							/>
							<Label className="text-white text-xs font-bold">{t.label}</Label>
						</Button>
					);
				})}
			</Row>
		</Card>
	);
}

const INITIAL_ANIMATED_ITEMS = [
	{
		id: "1",
		title: "Fade In card",
		tag: "uw-entering-fade-in",
		className:
			"uw-entering-fade-in uw-entering-duration-400 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
		color: "bg-indigo-600",
	},
	{
		id: "2",
		title: "Slide In Right card",
		tag: "uw-entering-slide-in-right",
		className:
			"uw-entering-slide-in-right uw-entering-duration-400 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
		color: "bg-sky-600",
	},
	{
		id: "3",
		title: "Zoom In card",
		tag: "uw-entering-zoom-in",
		className:
			"uw-entering-zoom-in uw-entering-duration-400 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
		color: "bg-emerald-600",
	},
	{
		id: "4",
		title: "Bounce In card",
		tag: "nw-entering-bounce-in",
		className:
			"nw-entering-bounce-in nw-entering-duration-500 nw-exiting-fade-out nw-layout-linear-transition nw-layout-springify",
		color: "bg-amber-600",
	},
];

let nextId = 5;

function ReanimatedAnimationsDemo() {
	const [cards, setCards] = useState(INITIAL_ANIMATED_ITEMS);

	const addCard = () => {
		const templates = [
			{
				title: `Slide card #${nextId}`,
				tag: "uw-entering-slide-in-left",
				className:
					"uw-entering-slide-in-left uw-entering-duration-400 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
				color: "bg-fuchsia-600",
			},
			{
				title: `Zoom card #${nextId}`,
				tag: "uw-entering-zoom-in",
				className:
					"uw-entering-zoom-in uw-entering-duration-400 uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify",
				color: "bg-cyan-600",
			},
			{
				title: `Fade card #${nextId}`,
				tag: "nw-entering-fade-in",
				className:
					"nw-entering-fade-in nw-entering-duration-400 nw-exiting-fade-out nw-layout-linear-transition nw-layout-springify",
				color: "bg-rose-600",
			},
		];
		const template = templates[(nextId - 5) % templates.length];
		if (template == null) return;
		const newId = String(nextId++);
		setCards((prev) => [...prev, { id: newId, ...template }]);
	};

	const removeCard = (id: string) => {
		setCards((prev) => prev.filter((c) => c.id !== id));
	};

	const shuffleCards = () => {
		setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
	};

	const resetCards = () => {
		setCards(INITIAL_ANIMATED_ITEMS);
	};

	return (
		<Card className="mt-4 rounded-2xl p-4 bg-slate-800 border border-slate-700">
			<Body className="text-sky-400 font-bold text-xs uppercase tracking-wider">
				Reanimated ClassName Animations
			</Body>
			<Title className="text-white text-base font-bold mt-1">
				Entering, Exiting & Layout Spring Transitions
			</Title>
			<Body className="text-slate-400 text-xs mt-1">
				Driven purely by className tokens (`uw-*` & `nw-*`) with Reanimated layout physics.
			</Body>

			{/* Interactive Controls */}
			<Row className="flex-row gap-2 mt-3 mb-3">
				<Button
					className="flex-1 rounded-xl bg-sky-500 py-2 items-center active:bg-sky-600"
					onPress={addCard}
				>
					<Label className="text-white font-bold text-xs">+ Add Card</Label>
				</Button>
				<Button
					className="flex-1 rounded-xl bg-slate-700 py-2 items-center active:bg-slate-600"
					onPress={shuffleCards}
				>
					<Label className="text-white font-bold text-xs">🔀 Reorder</Label>
				</Button>
				<Button
					className="rounded-xl bg-slate-700 px-3 py-2 items-center active:bg-slate-600"
					onPress={resetCards}
				>
					<Label className="text-slate-300 font-bold text-xs">Reset</Label>
				</Button>
			</Row>

			{/* Animated Card List */}
			<Box className="gap-2">
				{cards.map((card) => (
					<AnimatedCard
						key={card.id}
						className={`rounded-xl p-3 flex-row items-center justify-between ${card.color} ${card.className}`}
					>
						<Box className="flex-1 mr-2">
							<Body className="text-white font-bold text-sm">{card.title}</Body>
							<Body className="text-white/80 text-[10px] font-mono mt-0.5">{card.tag}</Body>
						</Box>
						<Button
							className="rounded-lg bg-black/20 px-2 py-1 active:bg-black/40"
							onPress={() => removeCard(card.id)}
						>
							<Label className="text-white text-xs font-bold">✕</Label>
						</Button>
					</AnimatedCard>
				))}
			</Box>
		</Card>
	);
}

function EngineBadge() {
	const native = isNativeEngineAvailable();
	return (
		<Card className="mt-3 rounded-xl p-3 bg-slate-800">
			<Body className="text-slate-300 text-center">
				Engine: {native ? "C++ Nitro HybridObject" : "JavaScript fallback (Expo Go)"}
			</Body>
		</Card>
	);
}

function StylePreview() {
	const { style } = useStyle("p-4 bg-red-500 dark:bg-blue-600 ios:p-6");
	return (
		<Card className="mt-3 rounded-xl p-4 bg-slate-800">
			<Body className="text-slate-300 text-center">
				useStyle("p-4 bg-red-500 dark:bg-blue-600 ios:p-6")
			</Body>
			<View style={style}>
				<Body className="text-white font-bold text-center">Resolved styles applied here</Body>
			</View>
		</Card>
	);
}

function GroupDemo() {
	return (
		<Button className="group mt-3 rounded-xl bg-slate-800 p-4">
			<Label className="text-white group-active:text-red-500 font-bold text-center">
				Press — group-active turns this red
			</Label>
		</Button>
	);
}

function Palette() {
	return (
		<Row className="flex-row flex-wrap justify-center mt-3">
			{SWATCHES.map((className) => (
				<Swatch key={className} className={`w-10 h-10 rounded-full m-1 ${className}`} />
			))}
		</Row>
	);
}

function SampleList() {
	return (
		<Card className="mt-3 rounded-xl bg-slate-800 overflow-hidden">
			{["Inbox", "Design system", "Benchmarks"].map((title, index) => (
				<Row
					key={title}
					className={`flex-row items-center p-3 ${index > 0 ? "border-t border-slate-700" : ""}`}
				>
					<Swatch className="w-8 h-8 rounded-full bg-sky-500" />
					<Body className="text-white font-bold ml-3 flex-1">{title}</Body>
					<Body className="text-slate-400">{index + 1}</Body>
				</Row>
			))}
		</Card>
	);
}

export function NitroWindShowcase({ badge, subtitle }: NitroWindShowcaseProps) {
	return (
		<Screen className="flex-1 bg-slate-950 pt-10">
			<ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
				<Card className="rounded-3xl p-6 bg-slate-900 border border-slate-800">
					<Body className="text-sky-400 font-bold">{badge}</Body>
					<Title className="text-white text-2xl font-bold mt-2">NitroWind</Title>
					<Body className="text-slate-400 mt-2 mb-2">{subtitle}</Body>
					<EngineBadge />
					<ThemeTransitionsDemo />
					<ReanimatedAnimationsDemo />
					<Palette />
					<StylePreview />
					<GroupDemo />
					<SampleList />
				</Card>
			</ScrollView>
		</Screen>
	);
}
