@env
Feature: Environment Variables

  Background:
    Given url '${BASE_URL}'

  @smoke
  Scenario: Get posts using env variable
    Given path '/posts/1'
    When method GET
    Then status 200
    And match response.id == '#number'
    And match response.title == '#string'

  @smoke  
  Scenario: Verify API key from env
    Given path '/posts'
    And header X-API-Key = '${API_KEY}'
    When method GET
    Then status 200
