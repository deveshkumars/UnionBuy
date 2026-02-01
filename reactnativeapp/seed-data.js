/**
 * Seed test data to DynamoDB via AppSync
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');
const outputs = require('./amplify_outputs.json');

Amplify.configure(outputs);
const client = generateClient({ authMode: 'apiKey' });

const testProducts = [
  // ⚡ DEMO TRIGGER ITEM - 1 jar away from activating!
  {
    name: '🍯 Local Honey',
    category: 'pantry',
    description: 'Raw wildflower honey from local apiaries - DEMO: 1 jar away from bulk!',
    unit: 'jar',
    retailPrice: 12.99,
    bulkPrice: 7.49,
    bulkMinimum: 20,
    storeJson: JSON.stringify({
      id: 'store-costco',
      name: 'Costco Wholesale',
      type: 'wholesale',
      location: { latitude: 41.8268, longitude: -71.4025, address: '2 Mystic View Rd, Everett, MA' },
    }),
    available: true,
  },
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

  let honeyProductId = null;
  
  for (const product of testProducts) {
    try {
      const result = await client.models.Product.create(product);
      console.log(`✅ Created: ${product.name} (ID: ${result.data?.id})`);
      
      // Save the honey product ID for bulk order creation
      if (product.name.includes('Honey')) {
        honeyProductId = result.data?.id;
      }
    } catch (error) {
      console.error(`❌ Failed to create ${product.name}:`, error.errors?.[0]?.message || error.message);
    }
  }

  // Create bulk order for Local Honey (19/20 jars - 1 away from triggering!)
  if (honeyProductId) {
    console.log('\n🍯 Creating bulk order for Local Honey...');
    try {
      const honeyProduct = testProducts.find(p => p.name.includes('Honey'));
      const bulkOrder = await client.models.BulkOrder.create({
        productId: honeyProductId,
        productSnapshotJson: JSON.stringify({
          id: honeyProductId,
          name: honeyProduct.name,
          category: honeyProduct.category,
          description: honeyProduct.description,
          unit: honeyProduct.unit,
          retailPrice: honeyProduct.retailPrice,
          bulkPrice: honeyProduct.bulkPrice,
          bulkMinimum: honeyProduct.bulkMinimum,
          store: JSON.parse(honeyProduct.storeJson),
          available: true,
        }),
        totalQuantity: 19, // 1 jar away from bulk minimum of 20!
        targetQuantity: 20,
        pricePerUnit: 7.99,
        status: 'collecting',
        cutoffTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        dropZoneJson: JSON.stringify({
          latitude: 41.8236,
          longitude: -71.4222,
          address: 'East Side Community Hub',
        }),
      });
      console.log(`✅ Created bulk order for Honey (ID: ${bulkOrder.data?.id}) - 19/20 jars pledged!`);
    } catch (error) {
      console.error(`❌ Failed to create bulk order:`, error.errors?.[0]?.message || error.message);
    }
  }

  console.log('\n✨ Seeding complete!');
}

seedProducts().catch(console.error);
