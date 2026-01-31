/**
 * Seed test data to DynamoDB via AppSync
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');
const outputs = require('./amplify_outputs.json');

Amplify.configure(outputs);
const client = generateClient({ authMode: 'apiKey' });

const testProducts = [
  {
    name: 'Organic Whole Milk',
    category: 'dairy',
    description: 'Fresh organic whole milk, locally sourced',
    unit: 'gallon',
    retailPrice: 5.99,
    bulkPrice: 4.49,
    bulkMinimum: 10,
    storeJson: JSON.stringify({
      id: 'store-001',
      name: 'Whole Foods Market',
      type: 'retail',
      location: { latitude: 40.7589, longitude: -73.9851 },
    }),
    available: true,
    image: 'https://example.com/milk.jpg',
  },
  {
    name: 'Free-Range Eggs',
    category: 'dairy',
    description: 'Farm fresh eggs from free-range chickens',
    unit: 'dozen',
    retailPrice: 6.99,
    bulkPrice: 5.49,
    bulkMinimum: 8,
    storeJson: JSON.stringify({
      id: 'store-001',
      name: 'Whole Foods Market',
      type: 'retail',
      location: { latitude: 40.7589, longitude: -73.9851 },
    }),
    available: true,
  },
  {
    name: 'Organic Brown Rice',
    category: 'pantry',
    description: 'Long grain organic brown rice',
    unit: '5lb bag',
    retailPrice: 12.99,
    bulkPrice: 9.99,
    bulkMinimum: 5,
    storeJson: JSON.stringify({
      id: 'store-002',
      name: 'Costco Wholesale',
      type: 'warehouse',
      location: { latitude: 40.7614, longitude: -73.9776 },
    }),
    available: true,
  },
  {
    name: 'Extra Virgin Olive Oil',
    category: 'pantry',
    description: 'Cold-pressed EVOO from Italy',
    unit: '1L bottle',
    retailPrice: 18.99,
    bulkPrice: 14.99,
    bulkMinimum: 6,
    storeJson: JSON.stringify({
      id: 'store-001',
      name: 'Whole Foods Market',
      type: 'retail',
      location: { latitude: 40.7589, longitude: -73.9851 },
    }),
    available: true,
  },
  {
    name: 'Organic Bananas',
    category: 'produce',
    description: 'Fresh organic bananas',
    unit: 'lb',
    retailPrice: 0.79,
    bulkPrice: 0.59,
    bulkMinimum: 20,
    storeJson: JSON.stringify({
      id: 'store-001',
      name: 'Whole Foods Market',
      type: 'retail',
      location: { latitude: 40.7589, longitude: -73.9851 },
    }),
    available: true,
  },
];

async function seedProducts() {
  console.log('🌱 Seeding products to DynamoDB...\n');

  for (const product of testProducts) {
    try {
      const result = await client.models.Product.create(product);
      console.log(`✅ Created: ${product.name} (ID: ${result.data?.id})`);
    } catch (error) {
      console.error(`❌ Failed to create ${product.name}:`, error.errors?.[0]?.message || error.message);
    }
  }

  console.log('\n✨ Seeding complete!');
}

seedProducts().catch(console.error);
