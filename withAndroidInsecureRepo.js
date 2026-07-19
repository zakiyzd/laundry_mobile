const { withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidInsecureRepo(config) {
  try {
    const printerGradlePath = path.join(
      config._internal?.projectRoot || process.cwd(),
      'node_modules/react-native-bluetooth-escpos-printer/android/build.gradle'
    );

    if (fs.existsSync(printerGradlePath)) {
      let content = fs.readFileSync(printerGradlePath, 'utf8');
      
      // 🌟 STRATEGI BARU: Cari SEMUA 'http://' di dalam file build.gradle library tersebut dan ubah paksa menjadi 'https://'
      if (content.includes('http://')) {
        content = content.replace(/http:\/\//g, 'https://');
        fs.writeFileSync(printerGradlePath, content, 'utf8');
        console.log('[InsecureRepoPlugin] Sukses mengubah SEMUA link HTTP internal menjadi HTTPS!');
      }
    }
  } catch (error) {
    console.log('[InsecureRepoPlugin] Gagal menyisir node_modules:', error);
  }

  // Tetap pasang jaring pengaman global di root proyek
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