const { withSettingsGradle } = require('@expo/config-plugins');

module.exports = function withAndroidInsecureRepo(config) {
  return withSettingsGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const insecureManagementRule = `
// Memaksa dependency resolution untuk mengizinkan http di akhir inisialisasi settings
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
      
      // 🌟 SEKARANG DITARUH DI PALING BAWAH AGAR TIDAK MERUSAK PLUGIN MANAGEMENT
      modConfig.modResults.contents += `\n${insecureManagementRule}\n`;
    }
    return modConfig;
  });
};