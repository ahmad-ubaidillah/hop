Feature: JSONPlaceholder API - Users
  Real-world API testing for user endpoints
  https://jsonplaceholder.typicode.com

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @api @jsonplaceholder @users @smoke
  Scenario: Get all users
    Given path '/users'
    When method GET
    Then status 200
    And match response == '#array'
    And match response.length == 10
    And match each response[*].id == '#number'
    And match each response[*].name == '#string'
    And match each response[*].username == '#string'
    And match each response[*].email == '#string'

  @api @jsonplaceholder @users
  Scenario: Get single user by ID
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.name == 'Leanne Graham'
    And match response.username == 'Bret'
    And match response.email == 'Sincere@april.biz'
    And match response.phone == '#string'
    And match response.website == '#string'

  @api @jsonplaceholder @users @nested
  Scenario: Validate user address structure
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.address.street == '#string'
    And match response.address.suite == '#string'
    And match response.address.city == '#string'
    And match response.address.zipcode == '#string'
    And match response.address.geo.lat == '#string'
    And match response.address.geo.lng == '#string'

  @api @jsonplaceholder @users @nested
  Scenario: Validate user company structure
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.company.name == '#string'
    And match response.company.catchPhrase == '#string'
    And match response.company.bs == '#string'

  @api @jsonplaceholder @users @search
  Scenario: Search users by username
    Given path '/users'
    And param username = 'Bret'
    When method GET
    Then status 200
    And match response.length == 1
    And match response[0].username == 'Bret'

  @api @jsonplaceholder @users @search
  Scenario: Search users by email domain
    Given path '/users'
    When method GET
    Then status 200
    And def userEmails = $[?(@.email contains '.biz')]
    And match userEmails.length >= 1

  @api @jsonplaceholder @users @filter
  Scenario: Filter users by city
    Given path '/users'
    When method GET
    Then status 200
    And def users = response
    And def cityUsers = users[?(@.address.city == 'Gwenborough')]
    And match cityUsers.length >= 1

  @api @jsonplaceholder @users @crud
  Scenario: Create new user
    Given path '/users'
    And request
      """
      {
        "name": "Hop Test User",
        "username": "hoptest",
        "email": "hop@test.com",
        "address": {
          "street": "Test Street",
          "suite": "Apt. 1",
          "city": "Test City",
          "zipcode": "12345",
          "geo": {
            "lat": "0.0000",
            "lng": "0.0000"
          }
        },
        "phone": "1-234-567-8900",
        "website": "hop.test",
        "company": {
          "name": "Hop Test Company",
          "catchPhrase": "Testing made easy",
          "bs": "testing frameworks"
        }
      }
      """
    When method POST
    Then status 201
    And match response.id == '#number'
    And match response.name == 'Hop Test User'
    And match response.username == 'hoptest'

  @api @jsonplaceholder @users @crud
  Scenario: Update user with PUT
    Given path '/users/1'
    And request
      """
      {
        "id": 1,
        "name": "Updated Name",
        "username": "updateduser",
        "email": "updated@test.com"
      }
      """
    When method PUT
    Then status 200
    And match response.name == 'Updated Name'

  @api @jsonplaceholder @users @negative
  Scenario: Get non-existent user
    Given path '/users/999'
    When method GET
    Then status 404

  @api @jsonplaceholder @users @todos
  Scenario: Get todos for user
    Given path '/users/1/todos'
    When method GET
    Then status 200
    And match response == '#array'
    And match each response[*].userId == 1
    And match each response[*].id == '#number'
    And match each response[*].title == '#string'
    And match each response[*].completed == '#boolean'

  @api @jsonplaceholder @users @albums
  Scenario: Get albums for user
    Given path '/users/1/albums'
    When method GET
    Then status 200
    And match response == '#array'
    And match each response[*].userId == 1
    And match each response[*].id == '#number'
    And match each response[*].title == '#string'

  @api @jsonplaceholder @users @posts
  Scenario: Get posts by user
    Given path '/users/1/posts'
    When method GET
    Then status 200
    And match response == '#array'
    And match each response[*].userId == 1
