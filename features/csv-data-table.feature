Feature: CSV Data Table Support

  This feature demonstrates loading data from external CSV files
  instead of inline tables - useful for large datasets (1500+ rows)

  Scenario Outline: Create users from CSV file
    Given url 'https://jsonplaceholder.typicode.com'
    And path '/posts'
    And request { title: '<title>', body: '<body>', userId: <userId> }
    When method POST
    Then status 201
    And match response.id == '#number'

    Examples: @file(data/users.csv)

  Scenario: Load CSV and iterate through data
    Given load csv 'features/data/users.csv' into users
    Then print 'Loaded users:'
    Then print 'Total users: '

  Scenario: Use Given, When, And, Then keywords
    Given url 'https://jsonplaceholder.typicode.com'
    When path '/posts/1'
    And method GET
    Then status 200
    And match response.id == 1
