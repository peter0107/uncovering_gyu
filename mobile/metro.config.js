const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Node.js 전용 모듈 폴리필 (Supabase realtime-js의 ws 패키지 대응)
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
};

module.exports = withNativeWind(config, { input: './src/global.css' });
