/**
 * Seed script for DynamoDB Product table
 * Run with: node seed-dynamo.js
 * 
 * Prerequisites:
 * 1. Run `npx ampx sandbox` from the project root
 * 2. Copy amplify_outputs.json to this folder if needed
 */

const fs = require('fs');
const path = require('path');

// Load amplify outputs
let outputs;
try {
  const outputsPath = path.join(__dirname, 'amplify_outputs.json');
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (e) {
  console.error('❌ Could not load amplify_outputs.json');
  console.error('   Make sure to run `npx ampx sandbox` first and copy the outputs here.');
  process.exit(1);
}

if (!outputs.data?.url || !outputs.data?.api_key) {
  console.error('❌ amplify_outputs.json is missing data configuration.');
  console.error('   Make sure the Amplify sandbox is running.');
  process.exit(1);
}

const APPSYNC_URL = outputs.data.url;
const API_KEY = outputs.data.api_key;

// Mock stores data
const mockStores = [
  {
    id: 'store-1',
    name: 'Costco Wholesale',
    type: 'wholesale',
    location: {
      latitude: 41.8268,
      longitude: -71.4025,
      address: '2 Mystic View Rd, Everett, MA',
    },
  },
  {
    id: 'store-2',
    name: "BJ's Wholesale",
    type: 'wholesale',
    location: {
      latitude: 41.8189,
      longitude: -71.3912,
      address: '175 Highland Ave, Seekonk, MA',
    },
  },
  {
    id: 'store-3',
    name: 'Restaurant Depot',
    type: 'wholesale',
    location: {
      latitude: 41.8456,
      longitude: -71.4234,
      address: '55 Providence Hwy, Dedham, MA',
    },
  },
];

// Mock products data (from mockData.ts)
const mockProducts = [
  {
    id: 'prod-1',
    name: 'Jasmine Rice',
    category: 'grains',
    description: 'Premium Thai jasmine rice, long grain',
    unit: 'lb',
    retailPrice: 1.89,
    bulkPrice: 0.79,
    bulkMinimum: 50,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-2',
    name: 'Extra Virgin Olive Oil',
    category: 'pantry',
    description: 'First cold pressed, Mediterranean blend',
    unit: 'oz',
    retailPrice: 0.42,
    bulkPrice: 0.24,
    bulkMinimum: 128,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-3',
    name: 'Organic Eggs',
    category: 'dairy',
    description: 'Cage-free, organic large eggs',
    unit: 'dozen',
    retailPrice: 6.99,
    bulkPrice: 4.49,
    bulkMinimum: 15,
    store: mockStores[1],
    available: true,
  },
  {
    id: 'prod-4',
    name: 'Chicken Breast',
    category: 'meat',
    description: 'Boneless, skinless chicken breast',
    unit: 'lb',
    retailPrice: 4.99,
    bulkPrice: 2.89,
    bulkMinimum: 40,
    store: mockStores[2],
    available: true,
  },
  {
    id: 'prod-5',
    name: 'All-Purpose Flour',
    category: 'pantry',
    description: 'Unbleached all-purpose flour',
    unit: 'lb',
    retailPrice: 0.89,
    bulkPrice: 0.42,
    bulkMinimum: 50,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-6',
    name: 'Canned Black Beans',
    category: 'pantry',
    description: 'Low sodium black beans',
    unit: 'can',
    retailPrice: 1.29,
    bulkPrice: 0.68,
    bulkMinimum: 24,
    store: mockStores[1],
    available: true,
  },
  {
    id: 'prod-7',
    name: 'Paper Towels',
    category: 'household',
    description: '2-ply, select-a-size rolls',
    unit: 'roll',
    retailPrice: 1.99,
    bulkPrice: 0.89,
    bulkMinimum: 30,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-8',
    name: 'Whole Milk',
    category: 'dairy',
    description: 'Grade A whole milk',
    unit: 'gallon',
    retailPrice: 4.29,
    bulkPrice: 3.19,
    bulkMinimum: 12,
    store: mockStores[1],
    available: true,
  },
  {
    id: 'prod-9',
    name: 'Ground Beef 80/20',
    category: 'meat',
    description: 'Fresh ground beef, 80% lean',
    unit: 'lb',
    retailPrice: 5.99,
    bulkPrice: 3.79,
    bulkMinimum: 30,
    store: mockStores[2],
    available: true,
  },
  {
    id: 'prod-10',
    name: 'Bananas',
    category: 'produce',
    description: 'Fresh yellow bananas',
    unit: 'lb',
    retailPrice: 0.69,
    bulkPrice: 0.39,
    bulkMinimum: 40,
    store: mockStores[0],
    available: true,
  },
];

// GraphQL mutation for creating a product
const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      category
    }
  }
`;

// GraphQL query to list existing products
const LIST_PRODUCTS_QUERY = `
  query ListProducts {
    listProducts {
      items {
        id
        name
      }
    }
  }
`;

async function graphqlRequest(query, variables = {}) {
  const response = await fetch(APPSYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  return result.data;
}

async function listExistingProducts() {
  try {
    const data = await graphqlRequest(LIST_PRODUCTS_QUERY);
    return data.listProducts?.items || [];
  } catch (e) {
    console.error('Error listing products:', e.message);
    return [];
  }
}

async function createProduct(product) {
  const input = {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    unit: product.unit,
    retailPrice: product.retailPrice,
    bulkPrice: product.bulkPrice,
    bulkMinimum: product.bulkMinimum,
    storeJson: JSON.stringify(product.store),
    available: product.available,
    image: product.image || null,
  };

  try {
    const data = await graphqlRequest(CREATE_PRODUCT_MUTATION, { input });
    return { success: true, product: data.createProduct };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function seedProducts() {
  console.log('🌱 Starting Product seeding...\n');
  console.log(`   AppSync URL: ${APPSYNC_URL}`);
  console.log(`   API Key: ${API_KEY.slice(0, 8)}...`);
  console.log('');

  // Check existing products
  const existing = await listExistingProducts();
  const existingIds = new Set(existing.map(p => p.id));
  
  if (existing.length > 0) {
    console.log(`📦 Found ${existing.length} existing products:`);
    existing.forEach(p => console.log(`   - ${p.name} (${p.id})`));
    console.log('');
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of mockProducts) {
    if (existingIds.has(product.id)) {
      console.log(`⏭️  Skipping ${product.name} (already exists)`);
      skipped++;
      continue;
    }

    const result = await createProduct(product);
    if (result.success) {
      console.log(`✅ Created: ${product.name}`);
      created++;
    } else {
      console.log(`❌ Failed: ${product.name} - ${result.error}`);
      failed++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed:  ${failed}`);
  console.log('\n✨ Done!');
}

// Run the seeder
seedProducts().catch(console.error);

