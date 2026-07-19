const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidInsecureRepo(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const insecureRepoRule = `
        allprojects {
            repositories {
                all { repo ->
                    if (repo.hasProperty('url') && repo.url.toString().startsWith("http://")) {
                        repo.allowInsecureProtocol = true
                    }
                }
            }
        }
      `;
      
      modConfig.modResults.contents += `\n${insecureRepoRule}\n`;
    }
    return modConfig;
  });
};