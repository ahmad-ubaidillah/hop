Feature: User Creation API

  Scenario Outline: Create multiple users
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/posts'
    And request { title: '<title>', body: '<body>', userId: <userId> }
    When method POST
    Then status 201
    And match response.id == '#number'

    Examples:
      | title              | body                    | userId |
      | Test Post 1        | This is body 1          | 1      |
      | Test Post 2        | This is body 2          | 1      |
      | Test Post 3        | This is body 3          | 2      |
