Feature: Data-Driven Testing from External Files

  Scenario Outline: Create users from CSV file
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/posts'
    And request { title: '<title>', body: '<body>', userId: <userId> }
    When method POST
    Then status 201
    And match response.title == '<title>'
    And match response.id == '#number'

    Examples: @file(data/users.csv)

  Scenario Outline: Create users with fuzzy matching and variables
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/posts'
    And def userTitle = '<title>'
    And request { title: '#(userTitle)', body: '<body>', userId: <userId> }
    When method POST
    Then status 201
    And match response.title == '#(userTitle)'
    And match response.id == '#number'
    And match response.userId == <userId>

    Examples:
      | title       | body         | userId |
      | Inline 1    | Inline body  | 100    |

  Scenario: Read file content directly
    Given url 'https://jsonplaceholder.typicode.com'
    And def users = read('data/users.csv')
    And match users.headers[0] == 'title'
    And match users.rows[0][0] == 'Test Post 1'
