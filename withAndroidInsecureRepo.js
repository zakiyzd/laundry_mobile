const { withSettingsGradle } = require('@expo/config-plugins');

module.exports = function withAndroidInsecureRepo(config) {
  return withSettingsGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const insecureManagementRule = `
        // Memaksa dependency resolution di tingkat inisialisasi awal untuk mengizinkan http
        dependencyResolutionManagement {
            repositories {
                all { repo ->
                    if (repo.hasProperty('url') && repo.url.toString().startsWith("http://")) {
                        repo.allowInsecureProtocol = true
                    }
                }
            }
        }
      `;
      
      // Sisipkan di bagian paling atas file settings.gradle
      modConfig.modResults.contents = insecureManagementRule + "\n" + modConfig.modResults.contents;
    }
    return modConfig;
  });
};