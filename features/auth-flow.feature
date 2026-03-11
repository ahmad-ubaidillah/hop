@auth
Feature: Authentication Flow

  Background:
    Given url 'https://jsonplaceholder.typicode.com'

  @smoke
  Scenario: Save auth after login
    # Simulate login by making a request
    Given path '/posts/1'
    When method GET
    Then status 200
    # Save the response as auth (for demo purposes - normally would be login response)
    Given save auth to '.hop/my-auth.json'
    And def authToken = 'test-token-123'
    And def userId = 1

  @smoke
  Scenario: Load saved auth and use it
    # First load the saved auth
    Given load auth from '.hop/my-auth.json'
    # Auth should now be in headers
    And header Authorization = 'Bearer test-token-123'
    Given path '/posts/2'
    When method GET
    Then status 200

  Scenario: Clear auth
    Given clear auth
    Given path '/posts/3'
    When method GET
    Then status 200
