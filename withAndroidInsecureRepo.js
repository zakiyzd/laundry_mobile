const { withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidInsecureRepo(config) {
  // 1. Taktik Agresif: Cari file build.gradle milik library printer langsung di node_modules dan ganti isinya
  try {
    const printerGradlePath = path.join(
      config._internal?.projectRoot || process.cwd(),
      'node_modules/react-native-bluetooth-escpos-printer/android/build.gradle'
    );

    if (fs.existsSync(printerGradlePath)) {
      let content = fs.readFileSync(printerGradlePath, 'utf8');
      
      // Ubah http ke https atau paksa tambahkan allowInsecureProtocol langsung di file internal library-nya
      if (content.includes('http://jcenter.bintray.com')) {
        content = content.replace(/http:\/\/jcenter\.bintray\.com/g, 'https://jcenter.bintray.com');
        fs.writeFileSync(printerGradlePath, content, 'utf8');
        console.log('[InsecureRepoPlugin] Berhasil mengubah internal http jcenter ke https!');
      }
    }
  } catch (error) {
    console.log('[InsecureRepoPlugin] Gagal memodifikasi node_modules secara langsung:', error);
  }

  // 2. Taktik Pengaman: Tetap pasang fallback global rules di root build.gradle
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const fallbackRule = `
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
      if (!modConfig.modResults.contents.includes('allowInsecureProtocol')) {
        modConfig.modResults.contents += `\n${fallbackRule}\n`;
      }
    }
    return modConfig;
  });
};