const base = 'http://localhost:3001';

(async () => {
  // Test Case 1: Bad smell in Faculty of Engineering
  console.log('\n=== TEST CASE 1: BAD SMELL IN FACULTY OF ENGINEERING ===');
  const test1 = {
    subject: 'there is a bad smell in faculty of engineering',
    description: 'There is an unpleasant odor in the engineering building that is affecting students studying',
    email: 'test1@posta.mu.edu.tr'
  };
  
  try {
    const r1 = await fetch(base + '/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test1)
    });
    const j1 = await r1.json();
    console.log('Complaint 1 Routed:');
    console.log('  1st Tier:', j1.complaint.facultyUnitDisplayName);
    console.log('  2nd Tier:', j1.complaint.serviceUnitDisplayName);
    console.log('  Expected: Faculty of Engineering → Dept. of Construction and Technical Services');
    console.log('  Status:', j1.complaint.status);
    console.log('  Routed To:', j1.complaint.routedTo);
    
    // Wait for messages to be sent
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.error('Test 1 Error:', e.message);
  }
  
  // Test Case 2: WiFi issue at Department of Informatics
  console.log('\n=== TEST CASE 2: WIFI ISSUE AT DEPARTMENT OF INFORMATICS ===');
  const test2 = {
    subject: 'wifi issue internet connection loss at Department Of Informatics',
    description: 'Internet and WiFi connection is down at the Department of Informatics building. Students cannot access online systems.',
    email: 'test2@posta.mu.edu.tr'
  };
  
  try {
    const r2 = await fetch(base + '/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test2)
    });
    const j2 = await r2.json();
    console.log('Complaint 2 Routed:');
    console.log('  1st Tier:', j2.complaint.facultyUnitDisplayName);
    console.log('  2nd Tier:', j2.complaint.serviceUnitDisplayName);
    console.log('  Expected: Faculty of Engineering → Department of IT Services');
    console.log('  Status:', j2.complaint.status);
    console.log('  Routed To:', j2.complaint.routedTo);
  } catch (e) {
    console.error('Test 2 Error:', e.message);
  }
  
  // Get all complaints and show routing
  console.log('\n=== ALL COMPLAINTS (Last 2) ===');
  try {
    await new Promise(r => setTimeout(r, 1000));
    const allComplaints = await fetch(base + '/api/admin/complaints').then(r => r.json());
    allComplaints.slice(-2).forEach((c, i) => {
      console.log(`\nComplaint ${i+1}: ${c.subject}`);
      console.log('  Routed To:', c.routedTo || [c.facultyUnitDisplayName, c.serviceUnitDisplayName]);
      console.log('  Confidence:', c.llmConfidence);
      console.log('  Status:', c.status);
      console.log('  History:');
      c.history.forEach(h => console.log(`    - ${h.status} (${h.actor}): ${h.note}`));
    });
  } catch (e) {
    console.error('Error fetching complaints:', e.message);
  }
  
  console.log('\n=== TESTING FEEDBACK/ESCALATION ===');
  try {
    // Get the first complaint
    const allComplaints = await fetch(base + '/api/admin/complaints').then(r => r.json());
    if (allComplaints.length > 0) {
      const complaintId = allComplaints[allComplaints.length - 1].id;
      
      // Submit negative feedback to trigger escalation
      console.log(`\nSubmitting negative feedback (2/5 stars) with comment to escalate complaint...`);
      const feedbackRes = await fetch(`${base}/api/complaints/${complaintId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 2,
          comment: 'The issue is still not resolved. The complaint needs immediate attention from the responsible unit.'
        })
      });
      const feedbackData = await feedbackRes.json();
      
      console.log('Feedback Response:');
      console.log('  Status:', feedbackData.status);
      console.log('  Message:', feedbackData.message);
      console.log('  Updated History:');
      feedbackData.history.forEach(h => console.log(`    - ${h.status} (${h.actor}): ${h.note}`));
    }
  } catch (e) {
    console.error('Feedback test error:', e.message);
  }
})();
