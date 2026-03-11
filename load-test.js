import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Export options
export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

// Default function
export default function() {

  // Get User Details
  const res0 = http.get('/users/1');
  
  check(res0, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res0.status !== 200);
  
  sleep(1);

  // Get All Posts
  const res1 = http.get('/posts');
  
  check(res1, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res1.status !== 200);
  
  sleep(1);

  // Create New Post
  const res2 = http.post('/posts',
    body: JSON.stringify("{ title: 'Test Post', body: 'Test content', userId: 1 }"));
  
  check(res2, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res2.status !== 200);
  
  sleep(1);

  // Get posts using env variable
  const res3 = http.get('/posts/1');
  
  check(res3, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res3.status !== 200);
  
  sleep(1);

  // Verify API key from env
  const res4 = http.get('/posts',
    headers: {"X-API-Key":"${API_KEY}"});
  
  check(res4, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res4.status !== 200);
  
  sleep(1);

  // Create multiple users
  const res5 = http.post('https://jsonplaceholder.typicode.com/posts',
    body: JSON.stringify("{ title: '<title>', body: '<body>', userId: <userId> }"));
  
  check(res5, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res5.status !== 200);
  
  sleep(1);

  // Get User Details
  const res6 = http.get('/users/1');
  
  check(res6, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res6.status !== 200);
  
  sleep(1);

  // Get All Posts
  const res7 = http.get('/posts');
  
  check(res7, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(res7.status !== 200);
  
  sleep(1);
}

// Helper functions

function getBaseUrl() {
  return __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';
}
