Feature: Performance Testing - JSONPlaceholder
  Load and performance testing using k6-compatible scenarios
  Target: https://jsonplaceholder.typicode.com

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @load @performance @smoke
  Scenario: Smoke test - Basic API health check
    Given path '/posts/1'
    When method GET
    Then status 200
    And response time < 1000ms

  @load @performance @baseline
  Scenario: Baseline test - Single request performance
    Given path '/users'
    When method GET
    Then status 200
    And response time < 500ms
    And match response.length == 10

  @load @performance @throughput
  Scenario: Throughput test - GET posts
    Given path '/posts'
    When method GET
    Then status 200
    And response time < 800ms
    And match response.length == 100

  @load @performance @throughput
  Scenario: Throughput test - GET comments
    Given path '/comments'
    When method GET
    Then status 200
    And response time < 1000ms
    And match response.length == 500

  @load @performance @write
  Scenario: Write test - POST create post
    Given path '/posts'
    And request
      """
      {
        "title": "Load Test Post",
        "body": "Performance testing with Hop",
        "userId": 1
      }
      """
    When method POST
    Then status 201
    And response time < 1000ms

  @load @performance @write
  Scenario: Write test - PUT update post
    Given path '/posts/1'
    And request
      """
      {
        "id": 1,
        "title": "Updated Load Test",
        "body": "Updated by performance test",
        "userId": 1
      }
      """
    When method PUT
    Then status 200
    And response time < 1000ms

  @load @performance @mixed
  Scenario: Mixed workload - Read after write
    Given path '/posts'
    And request
      """
      {
        "title": "Mixed Test Post",
        "body": "Testing mixed workload",
        "userId": 1
      }
      """
    When method POST
    Then status 201
    And def postId = response.id
    Given path '/posts/' + postId
    When method GET
    Then status 200
    And response time < 500ms

  @load @performance @stress
  Scenario: Stress test target - Complex query
    Given path '/posts'
    And param userId = 1
    When method GET
    Then status 200
    And response time < 1500ms
    And match response.length == 10

  @load @performance @latency
  Scenario: Latency measurement - User details
    Given path '/users/1'
    When method GET
    Then status 200
    And response time < 300ms
    And match response.id == 1

  @load @performance @data-driven
  Scenario Outline: Multiple endpoint performance
    Given path '<endpoint>'
    When method GET
    Then status 200
    And response time < <maxTime>ms

    Examples:
      | endpoint        | maxTime |
      | /posts          | 1000    |
      | /users          | 500     |
      | /comments       | 1000    |
      | /albums         | 800     |
      | /photos         | 1500    |
      | /todos          | 800     |

  @load @performance @spike
  Scenario: Spike test - Large response
    Given path '/photos'
    When method GET
    Then status 200
    And response time < 2000ms
    And match response.length == 5000
