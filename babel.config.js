module.exports = function (api) {
  api.cache(true);

  const presets = ['babel-preset-expo'];
  const plugins = ['react-native-reanimated/plugin'];

  try {
    require.resolve('nativewind/babel');
    presets.push('nativewind/babel');
  } catch {}

  try {
    require.resolve('babel-plugin-module-resolver');
    plugins.unshift([
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
        },
      },
    ]);
  } catch {}

  return {
    presets,
    plugins,
  };
};
