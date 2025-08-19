// Moved from root: test_archive_api.js
const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/archive/health');
    console.log(res.data);
  } catch (e) {
    console.error('Archive API test failed:', e.message);
  }
})();
