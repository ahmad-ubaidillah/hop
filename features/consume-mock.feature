Feature: Consume Mock API

Background:
  * start mock 'users-mock' on port 8080
  * url 'http://localhost:8080'

Scenario: Get users from mock
  Given path '/users'
  When method GET
  Then status 200
  And match response == [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]

Scenario: Create user in mock
  Given path '/users'
  And request { name: 'Charlie' }
  When method POST
  Then status 201
  And match response.name == 'Charlie'
  And match response.id == 3

Scenario: Verify persistence of created user
  Given path '/users'
  When method GET
  Then status 200
  And match response contains { id: 3, name: 'Charlie' }
