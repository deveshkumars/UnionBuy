const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure JSON files are treated as source modules (not assets)
// This allows require() and import to work properly on both web and mobile
config.resolver.sourceExts = [...config.resolver.sourceExts, 'json'];

module.exports = config;
