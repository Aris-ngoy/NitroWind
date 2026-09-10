import { Pressable, ScrollView, Text, View } from "react-native";
import { isNativeEngineAvailable } from "./engine";
import { useNitroWind } from "./provider";
import { styled } from "./styled";
import { useStyle } from "./useStyle";

const Screen = styled(View);
const Card = styled(View);
const Title = styled(Text);
const Body = styled(Text);
const Button = styled(Pressable);
const Label = styled(Text);
const Row = styled(View);
const Swatch = styled(View);

const SWATCHES = [
	"bg-red-500",
	"bg-orange-500",
	"bg-amber-400",
	"bg-green-500",
	"bg-sky-500",
	"bg-indigo-500",
	"bg-fuchsia-500",
] as const;

export interface NitroWindShowcaseProps {
	badge: string;
	subtitle: string;
}

function ThemeToggle() {
	const { theme, setTheme } = useNitroWind();
	return (
		<Button
			className="mt-3 rounded-xl bg-sky-500 px-4 py-3 active:bg-sky-600"
			onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
		>
			<Label className="text-white font-bold text-center">
				Switch to {theme === "dark" ? "light" : "dark"}
			</Label>
		</Button>
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
		<Screen className="flex-1 bg-slate-950">
			<ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
				<Card className="rounded-3xl p-6 bg-slate-900 border border-slate-800">
					<Body className="text-sky-400 font-bold">{badge}</Body>
					<Title className="text-white text-2xl font-bold mt-2">NitroWind</Title>
					<Body className="text-slate-400 mt-2 mb-2">{subtitle}</Body>
					<EngineBadge />
					<ThemeToggle />
					<Palette />
					<StylePreview />
					<GroupDemo />
					<SampleList />
				</Card>
			</ScrollView>
		</Screen>
	);
}
