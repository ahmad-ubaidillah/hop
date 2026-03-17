Feature: Order Service - Microservices Testing
  Testing order creation and management in distributed system

  Background:
    Given url 'http://order-service:3001'
    And header Content-Type = 'application/json'

  @orders @smoke
  Scenario: Create order
    Given path '/api/orders'
    And def order = { customerId: 1, items: [{ productId: 1, quantity: 2 }] }
    And request order
    When method POST
    Then status 201
    And match response.orderId == '#string'
    And match response.status == 'PENDING'

  @orders
  Scenario: Get order by ID
    Given path '/api/orders/ORD-123'
    When method GET
    Then status 200
    And match response.id == 'ORD-123'

  @orders
  Scenario: Update order status
    Given path '/api/orders/ORD-123/status'
    And request { status: 'CONFIRMED' }
    When method PATCH
    Then status 200
    And match response.status == 'CONFIRMED'

  @orders
  Scenario: Cancel order
    Given path '/api/orders/ORD-123/cancel'
    When method POST
    Then status 200
    And match response.status == 'CANCELLED'

  @orders
  Scenario: Order validation - empty items
    Given path '/api/orders'
    And request { customerId: 1, items: [] }
    When method POST
    Then status 400
    And match response.error contains 'items'

  @orders
  Scenario: Order not found
    Given path '/api/orders/INVALID'
    When method GET
    Then status 404

  @orders
  Scenario: Order history
    Given path '/api/orders/customer/1'
    When method GET
    Then status 200
    And match response.orders == '#array'
