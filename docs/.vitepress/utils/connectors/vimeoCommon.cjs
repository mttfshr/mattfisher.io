// docs/.vitepress/utils/connectors/vimeoCommon.cjs
const Vimeo = require('vimeo');

/**
 * Creates a Vimeo client using CommonJS require
 * @param {Object} config - Configuration object
 * @param {string} config.clientId - Vimeo client ID
 * @param {string} config.clientSecret - Vimeo client secret
 * @param {string} config.accessToken - Vimeo access token
 * @returns {Object} - Vimeo client instance
 */
function createVimeoClient(config) {
  try {
    console.log('Creating Vimeo client with CommonJS require...');
    console.log('Vimeo module type:', typeof Vimeo);
    console.log('Vimeo module keys:', Object.keys(Vimeo));
    
    // Try different initialization methods
    if (Vimeo.Client) {
      console.log('Using Vimeo.Client constructor');
      return new Vimeo.Client(config);
    }
    
    // If Vimeo is a constructor itself
    if (typeof Vimeo === 'function') {
      console.log('Using Vimeo as constructor');
      return new Vimeo(config);
    }
    
    // Check if there's a default export
    if (Vimeo.default) {
      console.log('Using Vimeo.default');
      if (Vimeo.default.Client) {
        return new Vimeo.default.Client(config);
      }
      return new Vimeo.default(config);
    }
    
    throw new Error('Unable to find a valid Vimeo client constructor');
  } catch (error) {
    console.error('Error creating Vimeo client:', error.message);
    throw error;
  }
}

module.exports = { createVimeoClient };
