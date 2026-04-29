const appJson = require('./app.json');

const projectId = process.env.EAS_PROJECT_ID;

module.exports = () => {
  const config = appJson.expo;

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      eas: {
        ...(config.extra?.eas || {}),
        projectId,
      },
    },
  };
};
