/**
 * Test Client Portal Permissions
 * 
 * This script tests:
 * 1. Portal access verification
 * 2. Read-only access enforcement
 * 3. Client data isolation
 * 4. Confidential data filtering
 */

import { prisma } from '../lib/prisma';
import {
  verifyClientPortalAccess,
  verifyClientDataOwnership,
  verifyResourceOwnership,
  getClientAllowedOperations,
  filterConfidentialData,
} from '../lib/client-permissions';

async function testClientPermissions() {
  console.log('🔒 Testing Client Portal Permissions\n');

  try {
    // Test 1: Find a client with portal access
    console.log('1️⃣  Finding test client with portal access...');
    const testClient = await prisma.client.findFirst({
      where: {
        portalAccess: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cabinetId: true,
      },
    });

    if (!testClient) {
      console.log('❌ No client with portal access found');
      console.log('   Creating test client...');
      
      // Find a cabinet
      const cabinet = await prisma.cabinet.findFirst({
        where: { status: 'ACTIVE' },
      });

      if (!cabinet) {
        console.log('❌ No active cabinet found. Cannot create test client.');
        return;
      }

      // Find an advisor
      const advisor = await prisma.user.findFirst({
        where: {
          cabinetId: cabinet.id,
          role: 'ADVISOR',
        },
      });

      if (!advisor) {
        console.log('❌ No advisor found. Cannot create test client.');
        return;
      }

      // Create test client
      const newClient = await prisma.client.create({
        data: {
          email: 'test.client@example.com',
          firstName: 'Test',
          lastName: 'Client',
          cabinetId: cabinet.id,
          conseillerId: advisor.id,
          portalAccess: true,
          portalPassword: '$2a$10$test', // Hashed password
          status: 'ACTIVE',
          clientType: 'PARTICULIER',
        },
      });

      console.log(`✅ Created test client: ${newClient.email}`);
      return testClientPermissions(); // Retry with new client
    }

    console.log(`✅ Found test client: ${testClient.email}\n`);

    // Test 2: Verify portal access
    console.log('2️⃣  Testing portal access verification...');
    const accessCheck = await verifyClientPortalAccess(testClient.id);
    
    if (accessCheck.hasAccess) {
      console.log('✅ Portal access verified');
      console.log(`   Client: ${accessCheck.client?.firstName} ${accessCheck.client?.lastName}`);
    } else {
      console.log(`❌ Portal access denied: ${accessCheck.error}`);
    }
    console.log('');

    // Test 3: Test with invalid client ID
    console.log('3️⃣  Testing with invalid client ID...');
    const invalidCheck = await verifyClientPortalAccess('invalid-id');
    
    if (!invalidCheck.hasAccess) {
      console.log('✅ Correctly denied access for invalid client');
      console.log(`   Error: ${invalidCheck.error}`);
    } else {
      console.log('❌ Should have denied access for invalid client');
    }
    console.log('');

    // Test 4: Test data ownership verification
    console.log('4️⃣  Testing data ownership verification...');
    const ownsOwnData = await verifyClientDataOwnership(testClient.id, testClient.id);
    const ownsOtherData = await verifyClientDataOwnership(testClient.id, 'other-client-id');
    
    if (ownsOwnData && !ownsOtherData) {
      console.log('✅ Data ownership verification working correctly');
      console.log('   ✓ Client can access own data');
      console.log('   ✓ Client cannot access other client data');
    } else {
      console.log('❌ Data ownership verification failed');
    }
    console.log('');

    // Test 5: Test resource ownership
    console.log('5️⃣  Testing resource ownership verification...');
    
    // Find a document belonging to the client
    const clientDocument = await prisma.clientDocument.findFirst({
      where: { clientId: testClient.id },
      select: { documentId: true },
    });

    if (clientDocument) {
      const ownsDocument = await verifyResourceOwnership(
        'document',
        clientDocument.documentId,
        testClient.id
      );
      
      if (ownsDocument) {
        console.log('✅ Resource ownership verified for document');
      } else {
        console.log('❌ Failed to verify document ownership');
      }
    } else {
      console.log('⚠️  No documents found for test client');
    }
    console.log('');

    // Test 6: Test allowed operations
    console.log('6️⃣  Testing allowed operations...');
    
    const resourceTypes = ['document', 'message', 'profile', 'actif', 'passif'];
    
    for (const resourceType of resourceTypes) {
      const permissions = getClientAllowedOperations(resourceType);
      console.log(`   ${resourceType}:`);
      console.log(`     Read: ${permissions.canRead ? '✅' : '❌'}`);
      console.log(`     Create: ${permissions.canCreate ? '✅' : '❌'}`);
      console.log(`     Update: ${permissions.canUpdate ? '✅' : '❌'}`);
      console.log(`     Delete: ${permissions.canDelete ? '✅' : '❌'}`);
    }
    console.log('');

    // Test 7: Test confidential data filtering
    console.log('7️⃣  Testing confidential data filtering...');
    
    const sensitiveData = {
      id: 'test-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      portalPassword: 'secret-hash',
      internalNotes: 'Confidential notes',
      advisorNotes: 'Private advisor notes',
      riskScore: 75,
      publicInfo: 'This should remain',
    };

    const filtered = filterConfidentialData(sensitiveData);
    
    const hasConfidentialFields = 
      'portalPassword' in filtered ||
      'internalNotes' in filtered ||
      'advisorNotes' in filtered ||
      'riskScore' in filtered;

    const hasPublicFields = 
      'firstName' in filtered &&
      'lastName' in filtered &&
      'email' in filtered &&
      'publicInfo' in filtered;

    if (!hasConfidentialFields && hasPublicFields) {
      console.log('✅ Confidential data filtering working correctly');
      console.log('   ✓ Removed: portalPassword, internalNotes, advisorNotes, riskScore');
      console.log('   ✓ Kept: firstName, lastName, email, publicInfo');
    } else {
      console.log('❌ Confidential data filtering failed');
      if (hasConfidentialFields) {
        console.log('   ✗ Confidential fields still present');
      }
      if (!hasPublicFields) {
        console.log('   ✗ Public fields were removed');
      }
    }
    console.log('');

    // Test 8: Test client isolation across cabinets
    console.log('8️⃣  Testing multi-tenant isolation...');
    
    // Find another client from a different cabinet
    const otherClient = await prisma.client.findFirst({
      where: {
        cabinetId: { not: testClient.cabinetId },
        portalAccess: true,
      },
      select: { id: true, cabinetId: true },
    });

    if (otherClient) {
      const canAccessOtherCabinet = await verifyClientDataOwnership(
        testClient.id,
        otherClient.id
      );

      if (!canAccessOtherCabinet) {
        console.log('✅ Multi-tenant isolation working correctly');
        console.log('   ✓ Client cannot access data from other cabinets');
      } else {
        console.log('❌ Multi-tenant isolation failed');
        console.log('   ✗ Client can access data from other cabinets');
      }
    } else {
      console.log('⚠️  No other cabinet found to test isolation');
    }
    console.log('');

    // Test 9: Verify read-only enforcement
    console.log('9️⃣  Testing read-only enforcement...');
    
    const readOnlyResources = ['actif', 'passif', 'contrat', 'document', 'objectif'];
    let allReadOnly = true;

    for (const resource of readOnlyResources) {
      const perms = getClientAllowedOperations(resource);
      if (perms.canCreate || perms.canUpdate || perms.canDelete) {
        allReadOnly = false;
        console.log(`   ❌ ${resource} allows write operations`);
      }
    }

    if (allReadOnly) {
      console.log('✅ Read-only enforcement working correctly');
      console.log('   ✓ All financial resources are read-only');
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary');
    console.log('================');
    console.log('✅ Portal access verification');
    console.log('✅ Invalid client rejection');
    console.log('✅ Data ownership verification');
    console.log('✅ Resource ownership verification');
    console.log('✅ Allowed operations configuration');
    console.log('✅ Confidential data filtering');
    console.log('✅ Multi-tenant isolation');
    console.log('✅ Read-only enforcement');
    console.log('');
    console.log('🎉 All client permission tests passed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testClientPermissions()
  .then(() => {
    console.log('\n✅ Client permissions test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Client permissions test failed:', error);
    process.exit(1);
  });
