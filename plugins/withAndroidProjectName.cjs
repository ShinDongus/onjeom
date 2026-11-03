const { withSettingsGradle } = require("expo/config-plugins");
// Keep the display name “온점.”; Gradle forbids a project name ending in a dot.
module.exports = function withAndroidProjectName(config) {
  return withSettingsGradle(config, (updated) => {
    updated.modResults.contents = updated.modResults.contents.replace(
      /rootProject\.name\s*=\s*(['"]).*?\1/,
      "rootProject.name = 'Onjeom'",
    );
    return updated;
  });
};
