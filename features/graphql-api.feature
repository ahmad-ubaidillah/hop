Feature: GraphQL API Testing
  Testing GraphQL endpoints with queries and mutations

  Background:
    Given url 'https://api.example.com/graphql'
    And header Content-Type = 'application/json'

  @graphql @smoke
  Scenario: Execute GraphQL query
    Given def query = '{ users { id name email } }'
    And request { query: query }
    When method POST
    Then status 200
    And match response.data.users != null
    And match each response.data.users[*].id == '#number'

  @graphql
  Scenario: Execute GraphQL mutation
    Given def mutation = 'mutation { createUser(input: { name: "John" email: "john@test.com" }) { id name } }'
    And request { query: mutation }
    When method POST
    Then status 200
    And match response.data.createUser.id != null
    And match response.data.createUser.name == 'John'

  @graphql
  Scenario: Query with variables
    Given def query = 'query GetUser($id: ID!) { user(id: $id) { id name } }'
    And def variables = { id: 1 }
    And request { query: query, variables: variables }
    When method POST
    Then status 200
    And match response.data.user.id == 1

  @graphql
  Scenario: Nested query
    Given def query = '{ users { id name posts { title } } }'
    And request { query: query }
    When method POST
    Then status 200
    And match response.data.users[0].posts != null

  @graphql
  Scenario: GraphQL validation error
    Given def query = '{ invalidField }'
    And request { query: query }
    When method POST
    Then status 200
    And match response.errors != null
    And match response.errors[0] != null

  @graphql
  Scenario: Fragment usage
    Given def query = '{ users { ...UserFields } } fragment UserFields on User { id name email }'
    And request { query: query }
    When method POST
    Then status 200
    And match response.data.users != null
