import { describe, expect, test } from "bun:test";
import {
	buildReanimatedProps,
	getOrCreateAnimatedComponent,
	parseReanimatedAnimations,
} from "../reanimated";

describe("parseReanimatedAnimations", () => {
	test("returns empty for classNames without reanimated utilities", () => {
		const res = parseReanimatedAnimations("bg-blue-500 text-white p-4");
		expect(res.hasReanimatedProps).toBe(false);
		expect(res.enteringPreset).toBeUndefined();
		expect(res.exitingPreset).toBeUndefined();
		expect(res.layoutPreset).toBeUndefined();
	});

	test("parses entering animations with uw- and nw- prefixes", () => {
		const uwRes = parseReanimatedAnimations("uw-entering-fade-in");
		expect(uwRes.hasReanimatedProps).toBe(true);
		expect(uwRes.enteringPreset).toBe("FadeIn");

		const nwRes = parseReanimatedAnimations("nw-entering-slide-in-left");
		expect(nwRes.hasReanimatedProps).toBe(true);
		expect(nwRes.enteringPreset).toBe("SlideInLeft");

		const zoomRes = parseReanimatedAnimations("uw-entering-zoom-in");
		expect(zoomRes.enteringPreset).toBe("ZoomIn");

		const flipRes = parseReanimatedAnimations("nw-entering-flip-in-y");
		expect(flipRes.enteringPreset).toBe("FlipInY");
	});

	test("parses exiting animations with uw- and nw- prefixes", () => {
		const uwRes = parseReanimatedAnimations("uw-exiting-fade-out");
		expect(uwRes.hasReanimatedProps).toBe(true);
		expect(uwRes.exitingPreset).toBe("FadeOut");

		const nwRes = parseReanimatedAnimations("nw-exiting-slide-out-right");
		expect(nwRes.hasReanimatedProps).toBe(true);
		expect(nwRes.exitingPreset).toBe("SlideOutRight");

		const zoomRes = parseReanimatedAnimations("uw-exiting-zoom-out");
		expect(zoomRes.exitingPreset).toBe("ZoomOut");

		const bounceRes = parseReanimatedAnimations("nw-exiting-bounce-out");
		expect(bounceRes.exitingPreset).toBe("BounceOut");
	});

	test("parses layout animations with uw- and nw- prefixes", () => {
		const linear = parseReanimatedAnimations("uw-layout-linear-transition");
		expect(linear.hasReanimatedProps).toBe(true);
		expect(linear.layoutPreset).toBe("LinearTransition");

		const fading = parseReanimatedAnimations("nw-layout-fading-transition");
		expect(fading.hasReanimatedProps).toBe(true);
		expect(fading.layoutPreset).toBe("FadingTransition");

		const curved = parseReanimatedAnimations("uw-layout-curved-transition");
		expect(curved.layoutPreset).toBe("CurvedTransition");

		const sequenced = parseReanimatedAnimations("nw-layout-sequenced-transition");
		expect(sequenced.layoutPreset).toBe("SequencedTransition");
	});

	test("parses modifiers: duration, delay, easing, spring physics", () => {
		const res = parseReanimatedAnimations(
			"uw-entering-fade-in uw-entering-duration-300 uw-entering-delay-150 uw-entering-ease-out uw-layout-linear-transition uw-layout-springify uw-layout-damping-15 uw-layout-stiffness-120 uw-layout-mass-2",
		);

		expect(res.enteringPreset).toBe("FadeIn");
		expect(res.enteringModifiers.duration).toBe(300);
		expect(res.enteringModifiers.delay).toBe(150);
		expect(res.enteringModifiers.easing).toBe("out");

		expect(res.layoutPreset).toBe("LinearTransition");
		expect(res.layoutModifiers.springify).toBe(true);
		expect(res.layoutModifiers.damping).toBe(15);
		expect(res.layoutModifiers.stiffness).toBe(120);
		expect(res.layoutModifiers.mass).toBe(2);
	});
});

describe("buildReanimatedProps", () => {
	class MockBuilder {
		config: Record<string, unknown> = {};

		static createInstance() {
			return new MockBuilder();
		}

		duration(d: number) {
			this.config.duration = d;
			return this;
		}

		delay(d: number) {
			this.config.delay = d;
			return this;
		}

		springify() {
			this.config.springify = true;
			return this;
		}

		damping(v: number) {
			this.config.damping = v;
			return this;
		}

		stiffness(v: number) {
			this.config.stiffness = v;
			return this;
		}

		mass(v: number) {
			this.config.mass = v;
			return this;
		}

		easing(e: unknown) {
			this.config.easing = e;
			return this;
		}
	}

	const mockReanimated = {
		FadeIn: MockBuilder,
		FadeOut: MockBuilder,
		LinearTransition: MockBuilder,
		Easing: {
			linear: "linear-easing",
			ease: "ease-easing",
			bounce: "bounce-easing",
			out: (fn: unknown) => `out(${fn})`,
		},
		createAnimatedComponent: (c: unknown) => ({ __animated: true, component: c }),
	};

	test("builds and chains builder instances with modifiers", () => {
		const props = buildReanimatedProps(
			"uw-entering-fade-in uw-entering-duration-400 uw-entering-delay-100 uw-entering-ease-out uw-exiting-fade-out uw-layout-linear-transition uw-layout-springify uw-layout-damping-20",
			mockReanimated,
		);

		expect(props.entering).toBeInstanceOf(MockBuilder);
		const entering = props.entering as MockBuilder;
		expect(entering.config.duration).toBe(400);
		expect(entering.config.delay).toBe(100);
		expect(entering.config.easing).toBe("out(ease-easing)");

		expect(props.exiting).toBeInstanceOf(MockBuilder);

		expect(props.layout).toBeInstanceOf(MockBuilder);
		const layout = props.layout as MockBuilder;
		expect(layout.config.springify).toBe(true);
		expect(layout.config.damping).toBe(20);
	});

	test("getOrCreateAnimatedComponent creates and caches animated components", () => {
		function DummyView() {
			return null;
		}

		const animated1 = getOrCreateAnimatedComponent(DummyView, mockReanimated);
		expect((animated1 as unknown as { __animated: boolean }).__animated).toBe(true);

		const animated2 = getOrCreateAnimatedComponent(DummyView, mockReanimated);
		expect(animated1).toBe(animated2);
	});

	test("getOrCreateAnimatedComponent safely returns original component if reanimated is unavailable", () => {
		function DummyView() {
			return null;
		}

		const result = getOrCreateAnimatedComponent(DummyView, null);
		expect(result).toBe(DummyView);
	});
});
