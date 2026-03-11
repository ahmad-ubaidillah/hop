Feature: User Management API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  Scenario: Get User Details
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.id == '#number'

  Scenario: Get All Posts
    Given path '/posts'
    When method GET
    Then status 200
    And match response == '#array'
