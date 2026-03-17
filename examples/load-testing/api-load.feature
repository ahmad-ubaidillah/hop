Feature: Load Testing - API Performance
  Testing API performance under load

  Background:
    Given url 'https://api.example.com'

  @load @api
  Scenario: Concurrent API requests
    Given path '/api/users'
    When method GET
    Then status 200
    And response time < 500ms

  @load @api
  Scenario: High volume POST requests
    Given path '/api/users'
    And request { name: 'LoadTest', email: 'load@test.com' }
    When method POST
    Then status 201
    And response time < 1000ms

  @load @api
  Scenario: Database query performance
    Given path '/api/reports'
    When method GET
    Then status 200
    And response time < 2000ms
    And match response.data == '#array'

  @load
  Scenario: Concurrent user login
    Given path '/api/auth/login'
    And request { email: 'user@test.com', password: 'pass' }
    When method POST
    Then status 200
    And response time < 800ms
