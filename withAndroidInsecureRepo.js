const { withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidInsecureRepo(config) {
  const projectRoot = config._internal?.projectRoot || process.cwd();

  // 1. Modifikasi File build.gradle Internal Library Printer
  try {
    const printerGradlePath = path.join(projectRoot, 'node_modules/react-native-bluetooth-escpos-printer/android/build.gradle');
    if (fs.existsSync(printerGradlePath)) {
      let content = fs.readFileSync(printerGradlePath, 'utf8');
      if (content.includes('http://')) content = content.replace(/http:\/\//g, 'https://');
      if (content.includes('compile(') || content.includes('compile ')) {
        content = content.replace(/compile\s*\(/g, 'implementation(');
        content = content.replace(/compile\s+/g, 'implementation ');
      }
      content = content.replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 34');
      content = content.replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 34');
      content = content.replace(/buildToolsVersion\s+['"].*?['"]/g, 'buildToolsVersion "34.0.0"');
      fs.writeFileSync(printerGradlePath, content, 'utf8');
    }
  } catch (e) { console.log(e); }

  // 2. 🌟 SOLUSI BARU: Migrasikan file Java internal printer secara paksa ke AndroidX
  try {
    const javaFilePath = path.join(
      projectRoot, 
      'node_modules/react-native-bluetooth-escpos-printer/android/src/main/java/cn/jystudio/bluetooth/RNBluetoothManagerModule.java'
    );

    if (fs.existsSync(javaFilePath)) {
      let javaContent = fs.readFileSync(javaFilePath, 'utf8');
      
      // Ubah import support lawas ke androidx
      javaContent = javaContent.replace('import android.support.v4.app.ActivityCompat;', 'import androidx.core.app.ActivityCompat;');
      javaContent = javaContent.replace('import android.support.v4.content.ContextCompat;', 'import androidx.core.content.ContextCompat;');
      
      fs.writeFileSync(javaFilePath, javaContent, 'utf8');
      console.log('[InsecureRepoPlugin] Sukses mengubah kode Java internal printer ke AndroidX!');
    }
  } catch (e) { console.log(e); }

  // 3. Jaring Pengaman Global (Tetap biarkan untuk mencegah duplikasi class di level sub-project)
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents) {
      const exclusionRule = `
        allprojects {
            configurations.all {
                exclude group: 'com.android.support', module: 'support-compat'
                exclude group: 'com.android.support', module: 'support-media-compat'
            }
        }
      `;
      if (!modConfig.modResults.contents.includes('exclude group: \'com.android.support\'')) {
        modConfig.modResults.contents += `\n${exclusionRule}\n`;
      }
    }
    return modConfig;
  });
};