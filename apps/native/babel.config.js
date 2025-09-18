module.exports = (api) => {
	api.cache(true);
	const plugins = [];

	// Reanimated v4 moved its Babel plugin to react-native-worklets
	plugins.push("react-native-worklets/plugin");

	return {
		presets: [
			["babel-preset-expo", { jsxImportSource: "nativewind" }],
			"nativewind/babel",
		],
		plugins,
	};
};
