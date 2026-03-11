Feature: User Authentication API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @smoke @get
  Scenario: Get User Details
    Given path '/users/1'
    When method GET
    Then status 200
    And match response == { id: '#number', name: '#string', username: '#string', email: '#email' }

  @smoke
  Scenario: Get All Posts
    Given path '/posts'
    When method GET
    Then status 200
    And match response == '#array'

  @post
  Scenario: Create New Post
    Given path '/posts'
    And request { title: 'Test Post', body: 'Test content', userId: 1 }
    When method POST
    Then status 201
    And match response.id == '#number'
    And match response == { id: '#number' }
