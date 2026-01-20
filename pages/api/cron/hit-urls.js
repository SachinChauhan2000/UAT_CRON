async function hit30MinUrl() {
  const response = await fetch('http://3.111.163.115/sub-d/Import_ordercsv');
  console.log(`30min URL hit: ${response.status} ${response.statusText}`);
  return {
    type: '30min',
    success: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: 'http://3.111.163.115/sub-d/Import_ordercsv'
  };
}

async function hit60MinUrl() {
  const response = await fetch('https://prodcampaigns.com/sub-d/OrderdetailsWebApp');
  console.log(`60min URL hit: ${response.status} ${response.statusText}`);
  return {
    type: '60min',
    success: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: 'https://prodcampaigns.com/sub-d/OrderdetailsWebApp'
  };
}

async function hitMorningUrls() {
  const urls = [
    "http://3.111.163.115/sub-d/import_scheme_holder_csv",
    "http://3.111.163.115/sub-d/import_for_sku_groups",
    "http://3.111.163.115/sub-d/import_group_levels_csv",
    "http://3.111.163.115/sub-d/import_scheme_master_csv",
    "http://3.111.163.115/sub-d/import_pjp",
    "http://3.111.163.115/sub-d/import_areas_master_csv",
    "http://3.111.163.115/sub-d/import_batch_master_csv",
    "http://3.111.163.115/sub-d/import_beat_details_csv",
    "http://3.111.163.115/sub-d/import_margin_csv",
    "http://3.111.163.115/sub-d/import_product",
    "http://3.111.163.115/sub-d/import_outlet_master",
    "http://3.111.163.115/sub-d/import_schemeslab",
    "http://3.111.163.115/sub-d/import_user_master",
    "http://3.111.163.115/sub-d/import_distributor_master_csv",
    "https://prodcampaigns.com/haleonwebapp/check_scheme_eligibility_for_cb_group",
    "https://prodcampaigns.com/haleonwebapp/check_scheme_eligibility_for_cb_group_cash"
  ];

  const results = [];
  
  // Process URLs in sequence to avoid overwhelming the server
  for (const url of urls) {
    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result = {
        url,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        success: response.ok
      };
      
      results.push(result);
      console.log(`[${new Date().toISOString()}] ${url} - ${response.status} (${duration}ms)`);
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error hitting ${url}:`, error.message);
      results.push({
        url,
        error: error.message,
        success: false
      });
    }
  }

  return {
    type: 'morning',
    results,
    success: results.every(r => r.success),
    successCount: results.filter(r => r.success).length,
    failedCount: results.filter(r => !r.success).length
  };
}

export default async function handler(req, res) {
  // Only allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use GET or POST' });
  }

  // Verify the cron secret for security
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.CRON_SECRET) {
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }

  // Get scheduleType from query parameters
  const { scheduleType } = req.query;
  const currentTime = new Date().toISOString();
  console.log(`[${currentTime}] Processing ${scheduleType} job`);

  try {
    if (scheduleType === '30min') {
      const result = await hit30MinUrl();
      return res.status(200).json({
        ...result,
        message: `30min URL hit ${result.success ? 'successfully' : 'failed'}`
      });
    } 
    else if (scheduleType === '60min') {
      const result = await hit60MinUrl();
      return res.status(200).json({
        ...result,
        message: `60min URL hit ${result.success ? 'successfully' : 'failed'}`
      });
    }
    else if (scheduleType === 'morning') {
      const result = await hitMorningUrls();
      return res.status(200).json({
        ...result,
        message: `Morning URLs processed: ${result.successCount} succeeded, ${result.failedCount} failed`
      });
    }
    else if (scheduleType === 'daily') {
      console.log('Starting daily job sequence...');
      
      // Run all jobs in sequence
      const results = {
        thirtyMin: await hit30MinUrl(),
        sixtyMin: await hit60MinUrl(),
        morning: await hitMorningUrls()
      };
      
      const allSuccessful = [
        results.thirtyMin.success,
        results.sixtyMin.success,
        results.morning.success
      ].every(success => success === true);
      
      return res.status(200).json({
        success: allSuccessful,
        message: `Daily job sequence completed: ${allSuccessful ? 'All jobs succeeded' : 'Some jobs failed'}`,
        timestamp: new Date().toISOString(),
        results
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Invalid schedule type',
      validTypes: ['30min', '60min', 'morning']
    });
    
  } catch (error) {
    console.error('Error in cron job:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

