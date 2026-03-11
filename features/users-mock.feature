@mock
Feature: Users Mock API

Background:
  * def users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
  * def nextId = 3

Scenario: pathMatches('/users') && methodIs('get')
  * def response = users
  * def responseStatus = 200

Scenario: pathMatches('/users') && methodIs('post')
  * def newUser = request
  * eval newUser.id = nextId
  * eval users.push(newUser)
  * def nextId = nextId + 1
  * def response = newUser
  * def responseStatus = 201
