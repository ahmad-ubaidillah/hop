Feature: Shopping Cart Operations
  As a customer
  I want to manage my shopping cart
  So that I can purchase products

  Background:
    Given url 'https://api.ecommerce.example.com'
    Given call auth.feature background

  @cart @smoke
  Scenario: Add item to cart
    Given path '/api/v1/cart'
    And def item = { productId: 1, quantity: 2 }
    And request item
    When method POST
    Then status 201
    And match response.items[0].productId == 1
    And match response.items[0].quantity == 2

  @cart
  Scenario: Update item quantity
    Given path '/api/v1/cart/items/1'
    And request { quantity: 5 }
    When method PUT
    Then status 200
    And match response.items[0].quantity == 5

  @cart
  Scenario: Remove item from cart
    Given path '/api/v1/cart/items/1'
    When method DELETE
    Then status 204

  @cart
  Scenario: Clear cart
    Given path '/api/v1/cart'
    When method DELETE
    Then status 204

  @cart
  Scenario: Apply coupon code
    Given path '/api/v1/cart/coupon'
    And request { code: 'SAVE10' }
    When method POST
    Then status 200
    And match response.discount > 0

  @cart
  Scenario: Calculate shipping
    Given path '/api/v1/cart/shipping'
    And request { address: { zipCode: '10001', country: 'US' } }
    When method POST
    Then status 200
    And match response.cost >= 0

  @cart
  Scenario: Checkout
    Given path '/api/v1/checkout'
    And def order = { payment: { method: 'credit_card' }, address: {} }
    And request order
    When method POST
    Then status 201
    And match response.orderId == '#number'
    And match response.status == 'confirmed'
