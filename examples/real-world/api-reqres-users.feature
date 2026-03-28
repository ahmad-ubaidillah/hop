Feature: ReqRes API - User Management
  Real-world API testing using ReqRes (https://reqres.in)
  A hosted REST-API ready to respond to your AJAX requests

  Background:
    Given url 'https://reqres.in/api'
    And header Content-Type = 'application/json'

  @api @reqres @smoke
  Scenario: List users - first page
    Given path '/users'
    And param page = 1
    When method GET
    Then status 200
    And match response.page == 1
    And match response.per_page == 6
    And match response.total == 12
    And match response.total_pages == 2
    And match response.data == '#array'
    And match response.data.length == 6
    And match each response.data[*].id == '#number'
    And match each response.data[*].email == '#string'
    And match each response.data[*].first_name == '#string'
    And match each response.data[*].last_name == '#string'

  @api @reqres @pagination
  Scenario: List users - second page
    Given path '/users'
    And param page = 2
    When method GET
    Then status 200
    And match response.page == 2
    And match response.data.length == 6
    And match response.data[0].id == 7

  @api @reqres @pagination
  Scenario: List users - per page parameter
    Given path '/users'
    And param per_page = 3
    When method GET
    Then status 200
    And match response.per_page == 3
    And match response.data.length == 3

  @api @reqres @users @crud
  Scenario: Get single user
    Given path '/users/2'
    When method GET
    Then status 200
    And match response.data.id == 2
    And match response.data.email == 'janet.weaver@reqres.in'
    And match response.data.first_name == 'Janet'
    And match response.data.last_name == 'Weaver'
    And match response.data.avatar == '#string'
    And match response.support.url == '#string'
    And match response.support.text == '#string'

  @api @reqres @users @negative
  Scenario: Get single user not found
    Given path '/users/23'
    When method GET
    Then status 404
    And match response == {}

  @api @reqres @users @crud
  Scenario: Create user
    Given path '/users'
    And request
      """
      {
        "name": "Hop User",
        "job": "Test Automation Engineer"
      }
      """
    When method POST
    Then status 201
    And match response.name == 'Hop User'
    And match response.job == 'Test Automation Engineer'
    And match response.id == '#string'
    And match response.createdAt == '#string'

  @api @reqres @users @crud
  Scenario: Update user with PUT
    Given path '/users/2'
    And request
      """
      {
        "name": "Updated Hop User",
        "job": "Senior Test Engineer"
      }
      """
    When method PUT
    Then status 200
    And match response.name == 'Updated Hop User'
    And match response.job == 'Senior Test Engineer'
    And match response.updatedAt == '#string'

  @api @reqres @users @crud
  Scenario: Update user with PATCH
    Given path '/users/2'
    And request
      """
      {
        "job": "Lead QA Engineer"
      }
      """
    When method PATCH
    Then status 200
    And match response.job == 'Lead QA Engineer'
    And match response.updatedAt == '#string'

  @api @reqres @users @crud
  Scenario: Delete user
    Given path '/users/2'
    When method DELETE
    Then status 204

  @api @reqres @delay
  Scenario: Delayed response
    Given path '/users'
    And param delay = 3
    When method GET
    Then status 200
    And response time > 3000ms
    And response time < 5000ms
    And match response.data == '#array'

  @api @reqres @auth @register
  Scenario: Register user - successful
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
    And match response.id == '#number'
    And match response.token == '#string'

  @api @reqres @auth @register @negative
  Scenario: Register user - missing password
    Given path '/register'
    And request
      """
      {
        "email": "sydney@fife"
      }
      """
    When method POST
    Then status 400
    And match response.error == 'Missing password'

  @api @reqres @auth @login
  Scenario: Login - successful
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
    And match response.token == '#string'

  @api @reqres @auth @login @negative
  Scenario: Login - missing password
    Given path '/login'
    And request
      """
      {
        "email": "peter@klaven"
      }
      """
    When method POST
    Then status 400
    And match response.error == 'Missing password'

  @api @reqres @unknown
  Scenario: List unknown resources
    Given path '/unknown'
    When method GET
    Then status 200
    And match response.data == '#array'
    And match each response.data[*].id == '#number'
    And match each response.data[*].name == '#string'
    And match each response.data[*].year == '#number'
    And match each response.data[*].color == '#string'

  @api @reqres @unknown
  Scenario: Get single unknown resource
    Given path '/unknown/2'
    When method GET
    Then status 200
    And match response.data.id == 2
    And match response.data.name == 'fuchsia rose'
    And match response.data.year == 2001

  @api @reqres @unknown @negative
  Scenario: Get unknown resource not found
    Given path '/unknown/23'
    When method GET
    Then status 404

  @api @reqres @performance
  Scenario: Measure API response time
    Given path '/users'
    When method GET
    Then status 200
    And response time < 500ms

  @api @reqres @data-driven
  Scenario Outline: Get multiple users by ID
    Given path '/users/<userId>'
    When method GET
    Then status <expectedStatus>
    And match response.data.id == <userId>

    Examples:
      | userId | expectedStatus |
      | 1      | 200            |
      | 2      | 200            |
      | 3      | 200            |
      | 4      | 200            |
      | 5      | 200            |
