const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withExcludeSupportLibrary(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // 이미 추가되어 있으면 스킵
    if (contents.includes("exclude group: \"com.android.support\"")) {
      return config;
    }

    // android { 블록 찾아서 configurations.all 추가
    const excludeCode = `
    // Fix Duplicate class error for react-native-android-widget
    configurations.all {
        exclude group: "com.android.support"
        exclude module: "support-v4"
    }
`;

    // android { 다음 줄에 추가
    config.modResults.contents = contents.replace(
      /android\s*\{/,
      `android {${excludeCode}`
    );

    return config;
  });
};
