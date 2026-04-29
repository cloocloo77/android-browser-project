const appJson = require('./app.json');

const projectId = process.env.EAS_PROJECT_ID;

module.exports = () => {
  const config = appJson.expo;

  const easExtra = {
    ...(config.extra?.eas || {}),
    ...(projectId ? { projectId } : {}),
  };

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      ...(Object.keys(easExtra).length ? { eas: easExtra } : {}),
    },
  };
};
