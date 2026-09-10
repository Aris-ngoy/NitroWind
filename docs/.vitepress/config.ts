import { defineConfig } from "vitepress";

export default defineConfig({
	title: "nitro-wind",
	description: "High-performance Tailwind CSS engine for React Native, powered by Nitro Modules",
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/guide/getting-started" },
			{ text: "API", link: "/api/" },
			{ text: "Migration", link: "/migration/nativewind" },
		],
		sidebar: [
			{
				text: "Guide",
				items: [
					{ text: "Getting Started", link: "/guide/getting-started" },
					{ text: "Architecture", link: "/guide/architecture" },
					{ text: "Theming", link: "/guide/theming" },
					{ text: "Animations", link: "/guide/animations" },
				],
			},
			{
				text: "API",
				items: [{ text: "Public API", link: "/api/" }],
			},
			{
				text: "Migration",
				items: [
					{ text: "From NativeWind", link: "/migration/nativewind" },
					{ text: "From Uniwind", link: "/migration/uniwind" },
					{ text: "From Unistyles", link: "/migration/unistyles" },
				],
			},
		],
	},
});
