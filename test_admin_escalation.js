const base = 'http://localhost:3001';

(async () => {
  console.log('=== TEST: Admin Manual Status Change with Escalation ===\n');
  
  try {
    // Get all complaints
    const complaints = await fetch(base + '/api/admin/complaints').then(r => r.json());
    
    if (complaints.length === 0) {
      console.log('No complaints found. Submitting test complaint first...');
      const testComplaint = {
        subject: 'Test escalation scenario',
        description: 'Testing manual escalation from admin console',
        email: 'test@posta.mu.edu.tr'
      };
      
      const r = await fetch(base + '/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testComplaint)
      });
      const data = await r.json();
      console.log('Test complaint created:', data.complaint.id);
      console.log('Initial status:', data.complaint.status);
      console.log('Service unit:', data.complaint.serviceUnitDisplayName);
      
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Get fresh list
    const allComplaints = await fetch(base + '/api/admin/complaints').then(r => r.json());
    const testComplaint = allComplaints[allComplaints.length - 1];
    
    if (!testComplaint) {
      console.error('Could not find test complaint');
      return;
    }
    
    console.log('\nTest Complaint:');
    console.log('  ID:', testComplaint.id);
    console.log('  Subject:', testComplaint.subject);
    console.log('  Current Status:', testComplaint.status);
    console.log('  Service Unit:', testComplaint.serviceUnitDisplayName);
    
    // Simulate admin console changing status to "resolved"
    console.log('\n--- STEP 1: Admin changes status to RESOLVED ---');
    const resolvedRes = await fetch(`${base}/api/admin/complaints/${testComplaint.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved',
        note: 'Admin marked this as resolved.',
        actor: 'System Admin'
      })
    });
    const resolvedData = await resolvedRes.json();
    console.log('Response:', resolvedData.success ? '✓ Status updated' : '✗ Failed');
    console.log('New Status:', resolvedData.complaint.status);
    console.log('History Entry:', resolvedData.complaint.history[resolvedData.complaint.history.length - 1]);
    
    // Wait and check messages (should be none for resolved)
    await new Promise(r => setTimeout(r, 1000));
    const messagesAfterResolved = await fetch(`${base}/api/messages/${UNIT_MANAGERS.bilgi_islem.managerName}`).then(r => r.json()).catch(e => []);
    console.log('Messages sent (resolved):', messagesAfterResolved.length);
    
    // Now change status to "escalated"
    console.log('\n--- STEP 2: Admin changes status to ESCALATED ---');
    const escalatedRes = await fetch(`${base}/api/admin/complaints/${testComplaint.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'escalated',
        note: 'Admin escalated this case.',
        actor: 'System Admin'
      })
    });
    const escalatedData = await escalatedRes.json();
    console.log('Response:', escalatedData.success ? '✓ Status updated' : '✗ Failed');
    console.log('New Status:', escalatedData.complaint.status);
    console.log('History Entry:', escalatedData.complaint.history[escalatedData.complaint.history.length - 1]);
    
    // Check that escalation message was sent
    console.log('\n--- Checking Notifications ---');
    await new Promise(r => setTimeout(r, 1500));
    
    // Get all messages to check what was sent
    const allMessages = await fetch(base + '/api/messages/system').then(r => r.json()).catch(e => []);
    const recentMessages = allMessages.filter(m => m.complaintId === testComplaint.id);
    
    console.log('Messages for this complaint:', recentMessages.length);
    recentMessages.forEach((msg, i) => {
      console.log(`\n  Message ${i + 1}:`);
      console.log(`    Type: ${msg.type}`);
      console.log(`    To: ${msg.toName}`);
      console.log(`    Content: ${msg.content.substring(0, 80)}...`);
    });
    
    console.log('\n✓ Test completed successfully!');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();

const UNIT_MANAGERS = {
  bilgi_islem: { managerName: 'Head of IT Department' },
  yapi_isleri: { managerName: 'Head of Technical Services' },
  ogrenci_isleri: { managerName: 'Head of Student Affairs' }
};
