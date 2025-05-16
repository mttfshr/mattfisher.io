
const Vimeo = require('vimeo');
const fs = require('fs');
const path = require('path');

// Create an instance of the Vimeo client
let client;

try {
  if (typeof Vimeo === 'function') {
    client = new Vimeo({
      clientId: 'afef10f3566a0cef02225dcfad0a5e4670d0efaa',
      clientSecret: 'IDGAN+oVSabci0BcD5hSRJRj+Id7qMvaI8ahXCWGy0882kezKvI2l3+1rDzCbqds63NzzlQpB2GSOJru9RzpEP3ThI6vXFz7DDoYYmkZunHCBRW53yza72vTkExka7Zv',
      accessToken: '0e7f3705cdb7fb3dafb85a9bd4cc4cf8'
    });
  } else if (Vimeo.Client) {
    client = new Vimeo.Client({
      clientId: 'afef10f3566a0cef02225dcfad0a5e4670d0efaa',
      clientSecret: 'IDGAN+oVSabci0BcD5hSRJRj+Id7qMvaI8ahXCWGy0882kezKvI2l3+1rDzCbqds63NzzlQpB2GSOJru9RzpEP3ThI6vXFz7DDoYYmkZunHCBRW53yza72vTkExka7Zv',
      accessToken: '0e7f3705cdb7fb3dafb85a9bd4cc4cf8'
    });
  } else if (Vimeo.default && typeof Vimeo.default === 'function') {
    client = new Vimeo.default({
      clientId: 'afef10f3566a0cef02225dcfad0a5e4670d0efaa',
      clientSecret: 'IDGAN+oVSabci0BcD5hSRJRj+Id7qMvaI8ahXCWGy0882kezKvI2l3+1rDzCbqds63NzzlQpB2GSOJru9RzpEP3ThI6vXFz7DDoYYmkZunHCBRW53yza72vTkExka7Zv',
      accessToken: '0e7f3705cdb7fb3dafb85a9bd4cc4cf8'
    });
  } else if (Vimeo.default && Vimeo.default.Client) {
    client = new Vimeo.default.Client({
      clientId: 'afef10f3566a0cef02225dcfad0a5e4670d0efaa',
      clientSecret: 'IDGAN+oVSabci0BcD5hSRJRj+Id7qMvaI8ahXCWGy0882kezKvI2l3+1rDzCbqds63NzzlQpB2GSOJru9RzpEP3ThI6vXFz7DDoYYmkZunHCBRW53yza72vTkExka7Zv',
      accessToken: '0e7f3705cdb7fb3dafb85a9bd4cc4cf8'
    });
  } else {
    console.error('Unable to initialize Vimeo client with any method');
    process.exit(1);
  }
  
  // First fetch user info
  client.request({
    method: 'GET',
    path: '/me'
  }, (userError, userInfo) => {
    if (userError) {
      console.error(JSON.stringify({ error: userError.message }));
      process.exit(1);
    }
    
    // Then fetch likes
    client.request({
      method: 'GET',
      path: '/me/likes',
      query: {
        per_page: 1
      }
    }, (likesError, likesResponse) => {
      if (likesError) {
        console.error(JSON.stringify({ 
          error: likesError.message,
          userInfo: userInfo
        }));
        process.exit(1);
      }
      
      // Output combined response
      console.log(JSON.stringify({
        user: userInfo,
        likes: likesResponse
      }));
      
      process.exit(0);
    });
  });
} catch (error) {
  console.error(JSON.stringify({ error: error.message }));
  process.exit(1);
}
    