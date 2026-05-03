// Debug script to test Midtrans configuration
const { createClient } = require('@supabase/supabase-js');

// Check environment variables
console.log('=== Midtrans Configuration Debug ===');
console.log('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY:', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ? 'Set' : 'Not set');
console.log('MIDTRANS_SERVER_KEY:', process.env.MIDTRANS_SERVER_KEY ? 'Set' : 'Not set');
console.log('MIDTRANS_PRODUCTION:', process.env.MIDTRANS_PRODUCTION);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Try to import midtrans-client
try {
  const MidtransClient = require('midtrans-client');
  console.log('midtrans-client package loaded successfully');
  
  // Try to create instances
  const isProduction = process.env.MIDTRANS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  
  console.log('Creating Midtrans instances...');
  console.log('Server key length:', serverKey.length);
  console.log('Client key length:', clientKey.length);
  console.log('Is production:', isProduction);
  
  if (serverKey && clientKey) {
    const coreApi = new MidtransClient.CoreApi({
      isProduction,
      serverKey,
      clientKey,
    });
    
    const snapApi = new MidtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });
    
    console.log('Midtrans instances created successfully');
  } else {
    console.log('Cannot create Midtrans instances - missing keys');
  }
} catch (error) {
  console.error('Error loading midtrans-client:', error.message);
}
