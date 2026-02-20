// Function-based lint-staged config to exclude vendor/ directory
export default {
  "*.{json,md,yml,yaml}": (files) => {
    const filesToFormat = files.filter(
      (f) => !f.replace(/\\/g, "/").includes("/vendor/")
    );
    if (filesToFormat.length === 0) return [];
    return [`prettier --write ${filesToFormat.map((f) => `"${f}"`).join(" ")}`];
  },
};
