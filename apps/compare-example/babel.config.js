module.exports = (api) => {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		overrides: [
			{
				test: (filename) =>
					typeof filename === "string" && /src[\\/]engines[\\/]nativewind[\\/]/.test(filename),
				presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
			},
			{
				test: (filename) =>
					typeof filename === "string" &&
					(/[\\/](packages|node_modules)[\\/]nitro-wind[\\/]/.test(filename) ||
						/src[\\/]engines[\\/]nitrowind[\\/]/.test(filename)),
				plugins: ["nitro-wind/babel"],
			},
		],
	};
};
