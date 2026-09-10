module.exports = (api) => {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		overrides: [
			{
				test: /src[\\/]engines[\\/]nativewind[\\/]/,
				presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
			},
		],
	};
};
