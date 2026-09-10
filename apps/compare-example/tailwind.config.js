/** @type {import("tailwindcss").Config} */
module.exports = {
	content: ["./src/engines/nativewind/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {},
	},
	plugins: [],
};
