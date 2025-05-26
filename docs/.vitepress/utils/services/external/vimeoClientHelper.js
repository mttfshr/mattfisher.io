// docs/.vitepress/utils/connectors/vimeoClientHelper.js
/**
 * Helper function to create a Vimeo client, handling different export formats
 * @param {string} clientId - Vimeo client ID
 * @param {string} clientSecret - Vimeo client secret
 * @param {string} accessToken - Vimeo access token
 * @returns {Object} - Vimeo client instance
 */
export async function createVimeoClient(clientId, clientSecret, accessToken) {
  try {
    const vimeoModule = await import('vimeo');
    
    // Try different ways to initialize the client based on the export structure
    try {
      // First attempt: Standard export
      if (vimeoModule.Client) {
        return new vimeoModule.Client({
          clientId,
          clientSecret,
          accessToken
        });
      }
      
      // Second attempt: Default export
      if (vimeoModule.default && vimeoModule.default.Client) {
        return new vimeoModule.default.Client({
          clientId,
          clientSecret,
          accessToken
        });
      }
      
      // Third attempt: Direct module export
      if (typeof vimeoModule === 'function') {
        return new vimeoModule({
          clientId,
          clientSecret,
          accessToken
        });
      }
      
      // Fourth attempt: Access by bracket notation
      const Vimeo = vimeoModule['default'] || vimeoModule;
      if (Vimeo.Client) {
        return new Vimeo.Client({
          clientId,
          clientSecret,
          accessToken
        });
      } else if (typeof Vimeo === 'function') {
        return new Vimeo({
          clientId,
          clientSecret,
          accessToken
        });
      }
      
      // If we reach here, we couldn't create a client
      throw new Error(`Unable to initialize Vimeo client. Import structure: ${JSON.stringify(Object.keys(vimeoModule))}`);
    } catch (initError) {
      console.error('Error initializing Vimeo client:', initError.message);
      
      // Last attempt: Directly require the library
      try {
        const Vimeo = require('vimeo');
        if (Vimeo.Client) {
          return new Vimeo.Client({
            clientId,
            clientSecret,
            accessToken
          });
        } else if (typeof Vimeo === 'function') {
          return new Vimeo({
            clientId,
            clientSecret,
            accessToken
          });
        }
      } catch (requireError) {
        throw new Error(`Failed to create Vimeo client: ${initError.message}`);
      }
    }
  } catch (error) {
    throw new Error(`Error importing Vimeo library: ${error.message}`);
  }
  
  throw new Error('Unable to initialize Vimeo client after multiple attempts');
}
