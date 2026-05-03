// Test script to validate Midtrans configuration
console.log('=== Midtrans Configuration Test ===');

// Load environment variables (Next.js does this automatically)
const isProduction = process.env.MIDTRANS_PRODUCTION === 'true';
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
const serverKey = process.env.MIDTRANS_SERVER_KEY;

console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MIDTRANS_PRODUCTION:', process.env.MIDTRANS_PRODUCTION);
console.log('- isProduction:', isProduction);
console.log('- NEXT_PUBLIC_MIDTRANS_CLIENT_KEY exists:', !!clientKey);
console.log('- MIDTRANS_SERVER_KEY exists:', !!serverKey);

if (clientKey) {
  console.log('- Client key format:', clientKey.startsWith('SB-Mid-client-') ? 'Sandbox' : clientKey.startsWith('Mid-client-') ? 'Production' : 'Unknown');
  console.log('- Client key length:', clientKey.length);
}

if (serverKey) {
  console.log('- Server key format:', serverKey.startsWith('SB-Mid-server-') ? 'Sandbox' : serverKey.startsWith('Mid-server-') ? 'Production' : 'Unknown');
  console.log('- Server key length:', serverKey.length);
}

// Test Midtrans connection
try {
  const MidtransClient = require('midtrans-client');
  
  if (clientKey && serverKey) {
    const snapApi = new MidtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });
    
    console.log('\n=== Midtrans Connection Test ===');
    console.log('Creating test transaction...');
    
    const testTransaction = {
      transaction_details: {
        order_id: 'TEST-' + Date.now(),
        gross_amount: 10000,
      },
      item_details: [{
        id: 'test-item',
        name: 'Test Item',
        price: 10000,
        quantity: 1,
      }],
      customer_details: {
        first_name: 'Test',
        email: 'test@example.com',
      },
    };
    
    snapApi.createTransaction(testTransaction)
      .then(result => {
        console.log('✅ SUCCESS: Midtrans connection working');
        console.log('Token generated:', !!result.token);
        console.log('Redirect URL:', !!result.redirect_url);
      })
      .catch(error => {
        console.log('❌ ERROR: Midtrans connection failed');
        console.log('Error:', error.message);
        
        if (error.message.includes('401') || error.message.includes('Access denied')) {
          console.log('\n🔧 SOLUTION: Check your API keys');
          console.log('- Ensure you are using Sandbox keys for development');
          console.log('- Verify keys are copied correctly from Midtrans dashboard');
          console.log('- Check for extra spaces or characters');
        }
      });
  } else {
    console.log('\n❌ ERROR: Missing API keys');
    console.log('Please set NEXT_PUBLIC_MIDTRANS_CLIENT_KEY and MIDTRANS_SERVER_KEY in .env.local');
  }
} catch (error) {
  console.log('❌ ERROR: Failed to load midtrans-client package');
  console.log('Run: npm install midtrans-client');
}
