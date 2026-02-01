/**
 * Script to clear Pledges and BulkOrders tables
 * Run with: node clear-tables.js
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
  process.exit(1);
}

const APPSYNC_URL = outputs.data.url;
const API_KEY = outputs.data.api_key;

// GraphQL queries and mutations
const LIST_PLEDGES_QUERY = `
  query ListPledges($nextToken: String) {
    listPledges(limit: 1000, nextToken: $nextToken) {
      items {
        id
      }
      nextToken
    }
  }
`;

const DELETE_PLEDGE_MUTATION = `
  mutation DeletePledge($input: DeletePledgeInput!) {
    deletePledge(input: $input) {
      id
    }
  }
`;

const LIST_BULK_ORDERS_QUERY = `
  query ListBulkOrders($nextToken: String) {
    listBulkOrders(limit: 1000, nextToken: $nextToken) {
      items {
        id
      }
      nextToken
    }
  }
`;

const DELETE_BULK_ORDER_MUTATION = `
  mutation DeleteBulkOrder($input: DeleteBulkOrderInput!) {
    deleteBulkOrder(input: $input) {
      id
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

async function getAllPledges() {
  const allPledges = [];
  let nextToken = null;
  
  do {
    const data = await graphqlRequest(LIST_PLEDGES_QUERY, { nextToken });
    allPledges.push(...(data.listPledges?.items || []));
    nextToken = data.listPledges?.nextToken;
  } while (nextToken);
  
  return allPledges;
}

async function getAllBulkOrders() {
  const allOrders = [];
  let nextToken = null;
  
  do {
    const data = await graphqlRequest(LIST_BULK_ORDERS_QUERY, { nextToken });
    allOrders.push(...(data.listBulkOrders?.items || []));
    nextToken = data.listBulkOrders?.nextToken;
  } while (nextToken);
  
  return allOrders;
}

async function clearPledges() {
  console.log('🗑️  Clearing Pledges table...');
  
  const pledges = await getAllPledges();
  console.log(`   Found ${pledges.length} pledges to delete`);
  
  let deleted = 0;
  for (const pledge of pledges) {
    try {
      await graphqlRequest(DELETE_PLEDGE_MUTATION, { input: { id: pledge.id } });
      deleted++;
      process.stdout.write(`\r   Deleted ${deleted}/${pledges.length} pledges`);
    } catch (e) {
      console.error(`\n   ❌ Failed to delete pledge ${pledge.id}: ${e.message}`);
    }
  }
  
  console.log(`\n   ✅ Deleted ${deleted} pledges`);
  return deleted;
}

async function clearBulkOrders() {
  console.log('🗑️  Clearing BulkOrders table...');
  
  const orders = await getAllBulkOrders();
  console.log(`   Found ${orders.length} bulk orders to delete`);
  
  let deleted = 0;
  for (const order of orders) {
    try {
      await graphqlRequest(DELETE_BULK_ORDER_MUTATION, { input: { id: order.id } });
      deleted++;
      process.stdout.write(`\r   Deleted ${deleted}/${orders.length} bulk orders`);
    } catch (e) {
      console.error(`\n   ❌ Failed to delete bulk order ${order.id}: ${e.message}`);
    }
  }
  
  console.log(`\n   ✅ Deleted ${deleted} bulk orders`);
  return deleted;
}

async function main() {
  console.log('🧹 Table Cleanup Script\n');
  console.log(`   AppSync URL: ${APPSYNC_URL}`);
  console.log(`   API Key: ${API_KEY.slice(0, 8)}...`);
  console.log('');
  
  const pledgesDeleted = await clearPledges();
  console.log('');
  const ordersDeleted = await clearBulkOrders();
  
  console.log('\n📊 Summary:');
  console.log(`   Pledges deleted: ${pledgesDeleted}`);
  console.log(`   BulkOrders deleted: ${ordersDeleted}`);
  console.log('\n✨ Done!');
}

main().catch(console.error);

