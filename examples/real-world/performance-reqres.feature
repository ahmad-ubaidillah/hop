Feature: Performance Testing - ReqRes API
  Load and performance testing for ReqRes API
  Target: https://reqres.in

  Background:
    Given url 'https://reqres.in/api'
    And header Content-Type = 'application/json'

  @load @performance @reqres @smoke
  Scenario: Smoke test - API availability
    Given path '/users/1'
    When method GET
    Then status 200
    And response time < 1000ms

  @load @performance @reqres @baseline
  Scenario: Baseline - List users
    Given path '/users'
    And param page = 1
    When method GET
    Then status 200
    And response time < 500ms
    And match response.data.length == 6

  @load @performance @reqres @throughput
  Scenario: Throughput - Multiple page requests
    Given path '/users'
    And param page = 2
    When method GET
    Then status 200
    And response time < 500ms
    And match response.page == 2

  @load @performance @reqres @write
  Scenario: Write - Create user
    Given path '/users'
    And request
      """
      {
        "name": "Load Test User",
        "job": "Performance Tester"
      }
      """
    When method POST
    Then status 201
    And response time < 1000ms
    And match response.name == 'Load Test User'

  @load @performance @reqres @write
  Scenario: Write - Update user
    Given path '/users/2'
    And request
      """
      {
        "name": "Updated Load User",
        "job": "Senior Tester"
      }
      """
    When method PUT
    Then status 200
    And response time < 1000ms

  @load @performance @reqres @auth
  Scenario: Auth - Login performance
    Given path '/login'
    And request
      """
      {
        "email": "eve.holt@reqres.in",
        "password": "cityslicka"
      }
      """
    When method POST
    Then status 200
    And response time < 800ms
    And match response.token == '#string'

  @load @performance @reqres @auth
  Scenario: Auth - Register performance
    Given path '/register'
    And request
      """
      {
        "email": "eve.holt@reqres.in",
        "password": "pistol"
      }
      """
    When method POST
    Then status 200
    And response time < 800ms

  @load @performance @reqres @delay
  Scenario: Delayed response handling
    Given path '/users'
    And param delay = 1
    When method GET
    Then status 200
    And response time > 1000ms
    And response time < 2000ms

  @load @performance @reqres @delete
  Scenario: Delete operation performance
    Given path '/users/2'
    When method DELETE
    Then status 204
    And response time < 500ms

  @load @performance @reqres @mixed
  Scenario: Mixed operations - CRUD cycle
    # Create
    Given path '/users'
    And request
      """
      {
        "name": "Mixed Test User",
        "job": "Mixed Test"
      }
      """
    When method POST
    Then status 201
    And def userId = response.id
    
    # Read
    Given path '/users/2'
    When method GET
    Then status 200
    
    # Update
    Given path '/users/2'
    And request
      """
      {
        "name": "Updated Mixed User"
      }
      """
    When method PUT
    Then status 200

  @load @performance @reqres @data-driven
  Scenario Outline: Multiple resource performance
    Given path '<resource>'
    When method GET
    Then status <expectedStatus>
    And response time < <maxTime>ms

    Examples:
      | resource       | expectedStatus | maxTime |
      | /users         | 200            | 500     |
      | /users/1       | 200            | 300     |
      | /unknown       | 200            | 500     |
      | /unknown/2     | 200            | 300     |

  @load @performance @reqres @negative
  Scenario: Error handling performance - 404
    Given path '/users/23'
    When method GET
    Then status 404
    And response time < 500ms

  @load @performance @reqres @negative
  Scenario: Error handling performance - Bad request
    Given path '/login'
    And request
      """
      {
        "email": "test@test.com"
      }
      """
    When method POST
    Then status 400
    And response time < 500ms
