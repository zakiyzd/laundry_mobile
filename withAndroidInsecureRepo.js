const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidInsecureRepo(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      // Memaksa Gradle mengizinkan insecure protocol di semua blok maven repositories
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /maven\s*\{\s*url\s*['"]http:\/\/[^'"]+['"]\s*\}/g,
        (match) => match.replace('}', 'allowInsecureProtocol = true \n}')
      );
    }
    return modConfig;
  });
};