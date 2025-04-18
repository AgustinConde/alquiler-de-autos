const path = require('path');
const fs = require('fs');

function prepareSessionStorage({ dataDir, sessionsFile, nodeEnv }) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (nodeEnv !== 'production') {
    if (fs.existsSync(sessionsFile)) {
      fs.unlinkSync(sessionsFile);
      console.log('🗑️ Old sessions cleared');
    }
  }
}

module.exports = { prepareSessionStorage };
