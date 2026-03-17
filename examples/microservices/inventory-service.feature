Feature: Inventory Service - Stock Management
  Testing inventory operations in distributed system

  Background:
    Given url 'http://inventory-service:3002'
    And header Content-Type = 'application/json'

  @inventory @smoke
  Scenario: Check product stock
    Given path '/api/inventory/1'
    When method GET
    Then status 200
    And match response.productId == 1
    And match response.quantity >= 0

  @inventory
  Scenario: Reserve stock
    Given path '/api/inventory/reserve'
    And request { productId: 1, quantity: 5 }
    When method POST
    Then status 200
    And match response.reserved == true

  @inventory
  Scenario: Release reserved stock
    Given path '/api/inventory/release'
    And request { productId: 1, quantity: 5 }
    When method POST
    Then status 200

  @inventory
  Scenario: Insufficient stock
    Given path '/api/inventory/reserve'
    And request { productId: 1, quantity: 999999 }
    When method POST
    Then status 400
    And match response.error contains 'insufficient'

  @inventory
  Scenario: Update stock level
    Given path '/api/inventory/1'
    And request { quantity: 100 }
    When method PUT
    Then status 200
    And match response.quantity == 100
