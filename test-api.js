async function runTest() {
  try {
    const formData = new FormData();
    const fileContent = new Blob(['%PDF-1.4 dummy content'], { type: 'application/pdf' });
    formData.append('file', fileContent, 'test.pdf');
    
    console.log('Sending request to http://localhost:3000/api/analyze...');
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    console.log('Status Code:', res.status);
    const json = await res.json();
    console.log('Response:', JSON.stringify(json, null, 2));
    
    if (res.status === 200) {
      console.log('\n✅ Test Passed: Received 200 OK (Fallback mock logic seems to be working).');
    } else {
      console.log('\n❌ Test Failed: Did not receive 200 OK.');
    }
  } catch (err) {
    console.error('\n❌ Request failed with error:', err.message);
  }
}

runTest();
