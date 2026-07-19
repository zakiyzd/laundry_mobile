const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidInsecureRepo(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      // 1. Ganti semua instansiasi jcenter http ke https secara paksa di build.gradle utama
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /http:\/\/jcenter\.bintray\.com/g,
        'https://jcenter.bintray.com'
      );

      // 2. Tambahkan fallback global rules di allprojects jika regex di atas terlewat
      const fallbackRule = `
        allprojects {
            buildscript {
                repositories {
                    maven { url "https://jcenter.bintray.com" }
                }
            }
            repositories {
                maven { url "https://jcenter.bintray.com" }
                // Jika masih ada yang maksa pakai http, izinkan lewat saklar ini
                List<ArtifactRepository> insecureRepos = repositories.findAll { repo ->
                    repo.hasProperty('url') && repo.url.toString().startsWith("http://")
                }
                insecureRepos.each { repo ->
                    repo.allowInsecureProtocol = true
                }
            }
        }
      `;
      modConfig.modResults.contents += `\n${fallbackRule}\n`;
    }
    return modConfig;
  });
};