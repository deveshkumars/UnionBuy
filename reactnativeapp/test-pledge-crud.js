/**
 * Test script for Pledge CRUD operations in DynamoDB
 * Run: node test-pledge-crud.js
 * 
 * NOTE: Make sure `npx ampx sandbox` is running first!
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');

// Load Amplify config
let outputs;
try {
  outputs = require('./amplify_outputs.json');
} catch (e) {
  console.error('❌ amplify_outputs.json not found!');
  console.error('   Run `npx ampx sandbox` first to generate it.');
  process.exit(1);
}

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient({ authMode: 'apiKey' });

// Test user ID
const TEST_USER_ID = 'test-user-123';

// Sample product snapshot
const sampleProductSnapshot = {
  id: 'prod-test-1',
  name: 'Test Organic Eggs',
  category: 'dairy',
  description: 'Free-range organic eggs for testing',
  unit: 'dozen',
  retailPrice: 7.99,
  bulkPrice: 5.49,
  bulkMinimum: 5,
  store: {
    id: 'store-test',
    name: 'Test Store',
    type: 'wholesale',
    location: { latitude: 41.8, longitude: -71.4 }
  },
  available: true
};

async function listAllPledges() {
  console.log('\n📋 Listing all pledges...');
  const { data: pledges, errors } = await client.models.Pledge.list();
  
  if (errors?.length) {
    console.error('❌ Error listing pledges:', errors[0].message);
    return [];
  }
  
  console.log(`   Found ${pledges.length} pledges:`);
  pledges.forEach((p, i) => {
    console.log(`   ${i + 1}. ID: ${p.id}`);
    console.log(`      User: ${p.userId}`);
    console.log(`      Product: ${p.productId}`);
    console.log(`      Quantity: ${p.quantity}`);
    console.log(`      Status: ${p.status}`);
    console.log(`      Created: ${p.createdAt}`);
    console.log('');
  });
  
  return pledges;
}

async function createPledge(quantity = 2) {
  console.log('\n✨ Creating a new pledge...');
  
  const { data: created, errors } = await client.models.Pledge.create({
    userId: TEST_USER_ID,
    productId: sampleProductSnapshot.id,
    productSnapshotJson: JSON.stringify(sampleProductSnapshot),
    quantity: quantity,
    unitPrice: sampleProductSnapshot.bulkPrice * 1.1,
    totalAmount: sampleProductSnapshot.bulkPrice * 1.1 * quantity,
    maxAmount: sampleProductSnapshot.retailPrice * quantity,
    status: 'locked',
  });
  
  if (errors?.length) {
    console.error('❌ Error creating pledge:', errors[0].message);
    return null;
  }
  
  console.log('✅ Created pledge:');
  console.log(`   ID: ${created.id}`);
  console.log(`   User: ${created.userId}`);
  console.log(`   Product: ${created.productId}`);
  console.log(`   Quantity: ${created.quantity}`);
  console.log(`   Status: ${created.status}`);
  
  return created;
}

async function updatePledgeStatus(pledgeId, newStatus) {
  console.log(`\n🔄 Updating pledge ${pledgeId} to status: ${newStatus}...`);
  
  const { data: updated, errors } = await client.models.Pledge.update({
    id: pledgeId,
    status: newStatus,
  });
  
  if (errors?.length) {
    console.error('❌ Error updating pledge:', errors[0].message);
    return null;
  }
  
  console.log('✅ Updated pledge:');
  console.log(`   ID: ${updated.id}`);
  console.log(`   New Status: ${updated.status}`);
  
  return updated;
}

async function deletePledge(pledgeId) {
  console.log(`\n🗑️  Deleting pledge ${pledgeId}...`);
  
  const { data: deleted, errors } = await client.models.Pledge.delete({ id: pledgeId });
  
  if (errors?.length) {
    console.error('❌ Error deleting pledge:', errors[0].message);
    return false;
  }
  
  console.log('✅ Deleted pledge:', deleted.id);
  return true;
}

async function deleteAllPledges() {
  console.log('\n🧹 Deleting ALL pledges...');
  
  const { data: pledges } = await client.models.Pledge.list();
  
  for (const pledge of pledges) {
    await deletePledge(pledge.id);
  }
  
  console.log(`✅ Deleted ${pledges.length} pledges`);
}

async function runDemo() {
  console.log('========================================');
  console.log('   Pledge CRUD Demo');
  console.log('========================================');
  
  // 1. List existing pledges
  await listAllPledges();
  
  // 2. Create a few pledges
  const pledge1 = await createPledge(3);
  const pledge2 = await createPledge(5);
  const pledge3 = await createPledge(1);
  
  // 3. List pledges again
  await listAllPledges();
  
  // 4. Update one pledge to cancelled
  if (pledge2) {
    await updatePledgeStatus(pledge2.id, 'cancelled');
  }
  
  // 5. Delete one pledge
  if (pledge1) {
    await deletePledge(pledge1.id);
  }
  
  // 6. List final state
  await listAllPledges();
  
  console.log('\n========================================');
  console.log('   Demo Complete!');
  console.log('========================================');
}

// Interactive mode - run different actions based on command line args
const args = process.argv.slice(2);
const command = args[0] || 'demo';

async function main() {
  try {
    switch (command) {
      case 'list':
        await listAllPledges();
        break;
        
      case 'create':
        const qty = parseInt(args[1]) || 1;
        await createPledge(qty);
        break;
        
      case 'delete':
        if (!args[1]) {
          console.error('❌ Please provide pledge ID: node test-pledge-crud.js delete <pledge-id>');
          process.exit(1);
        }
        await deletePledge(args[1]);
        break;
        
      case 'delete-all':
        await deleteAllPledges();
        break;
        
      case 'cancel':
        if (!args[1]) {
          console.error('❌ Please provide pledge ID: node test-pledge-crud.js cancel <pledge-id>');
          process.exit(1);
        }
        await updatePledgeStatus(args[1], 'cancelled');
        break;
        
      case 'demo':
      default:
        await runDemo();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('\n📝 Commands:');
console.log('   node test-pledge-crud.js demo          - Run full demo');
console.log('   node test-pledge-crud.js list          - List all pledges');
console.log('   node test-pledge-crud.js create [qty]  - Create a pledge');
console.log('   node test-pledge-crud.js delete <id>   - Delete a pledge');
console.log('   node test-pledge-crud.js delete-all    - Delete ALL pledges');
console.log('   node test-pledge-crud.js cancel <id>   - Cancel a pledge\n');

main();
