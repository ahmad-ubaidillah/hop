Feature: JSONPlaceholder API - Posts
  Real-world API testing using JSONPlaceholder (https://jsonplaceholder.typicode.com)
  A free online REST API for testing and prototyping

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @api @jsonplaceholder @smoke
  Scenario: Get all posts
    Given path '/posts'
    When method GET
    Then status 200
    And match response == '#array'
    And match response.length == 100
    And match each response[*].id == '#number'
    And match each response[*].title == '#string'
    And match each response[*].body == '#string'
    And match each response[*].userId == '#number'

  @api @jsonplaceholder @crud
  Scenario: Get single post by ID
    Given path '/posts/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.userId == 1
    And match response.title == '#string'
    And match response.body == '#string'
    And match response contains 'title'
    And match response contains 'body'

  @api @jsonplaceholder @crud
  Scenario: Get post with query parameters
    Given path '/posts'
    And param userId = 1
    When method GET
    Then status 200
    And match response == '#array'
    And match each response[*].userId == 1
    And match response.length == 10

  @api @jsonplaceholder @crud
  Scenario: Create new post
    Given path '/posts'
    And request
      """
      {
        "title": "Hop Test Post",
        "body": "This is a test post created by Hop framework",
        "userId": 1
      }
      """
    When method POST
    Then status 201
    And match response.id == '#number'
    And match response.title == 'Hop Test Post'
    And match response.body == 'This is a test post created by Hop framework'
    And match response.userId == 1

  @api @jsonplaceholder @crud
  Scenario: Update existing post with PUT
    Given path '/posts/1'
    And request
      """
      {
        "id": 1,
        "title": "Updated by Hop",
        "body": "This post was updated by Hop testing framework",
        "userId": 1
      }
      """
    When method PUT
    Then status 200
    And match response.id == 1
    And match response.title == 'Updated by Hop'
    And match response.body == 'This post was updated by Hop testing framework'

  @api @jsonplaceholder @crud
  Scenario: Partially update post with PATCH
    Given path '/posts/1'
    And request
      """
      {
        "title": "Patched Title"
      }
      """
    When method PATCH
    Then status 200
    And match response.id == 1
    And match response.title == 'Patched Title'

  @api @jsonplaceholder @crud
  Scenario: Delete post
    Given path '/posts/1'
    When method DELETE
    Then status 200

  @api @jsonplaceholder @negative
  Scenario: Get non-existent post
    Given path '/posts/99999'
    When method GET
    Then status 404
    And match response == {}

  @api @jsonplaceholder @schema
  Scenario: Validate post response schema
    Given path '/posts/1'
    When method GET
    Then status 200
    And match response.id == '#number'
    And match response.userId == '#number'
    And match response.title == '#string'
    And match response.body == '#string'

  @api @jsonplaceholder @comments
  Scenario: Get comments for a post
    Given path '/posts/1/comments'
    When method GET
    Then status 200
    And match response == '#array'
    And match response.length == 5
    And match each response[*].postId == 1
    And match each response[*].id == '#number'
    And match each response[*].name == '#string'
    And match each response[*].email == '#string'
    And match each response[*].body == '#string'

  @api @jsonplaceholder @comments
  Scenario: Get comments with nested resource path
    Given path '/comments'
    And param postId = 1
    When method GET
    Then status 200
    And match response == '#array'
    And match each response[*].postId == 1

  @api @jsonplaceholder @performance
  Scenario: Measure API response time
    Given path '/posts'
    When method GET
    Then status 200
    And response time < 1000ms

  @api @jsonplaceholder @data-driven
  Scenario Outline: Get posts by different user IDs
    Given path '/posts'
    And param userId = <userId>
    When method GET
    Then status 200
    And match each response[*].userId == <userId>

    Examples:
      | userId |
      | 1      |
      | 2      |
      | 3      |
      | 5      |
      | 10     |

  @api @jsonplaceholder @data-driven
  Scenario Outline: CRUD operations on different posts
    Given path '/posts/<postId>'
    When method GET
    Then status 200
    And match response.id == <postId>

    Examples:
      | postId |
      | 1      |
      | 5      |
      | 10     |
      | 50     |
      | 100    |
