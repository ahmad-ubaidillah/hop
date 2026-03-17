Feature: Product Catalog Management
  As a store administrator
  I want to manage product catalog
  So that customers can browse and purchase products

  Background:
    Given url 'https://api.ecommerce.example.com'
    Given call auth.feature background
    And header Content-Type = 'application/json'

  @smoke @products
  Scenario: Get all products
    Given path '/api/v1/products'
    When method GET
    Then status 200
    And match response.products == '#array'
    And match response.total > 0

  @smoke @products
  Scenario: Get product by ID
    Given path '/api/v1/products/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.name == '#string'
    And match response.price == '#number'

  @products
  Scenario: Create new product
    Given path '/api/v1/products'
    And def product = { name: 'Test Product', price: 99.99, category: 'electronics' }
    And request product
    When method POST
    Then status 201
    And match response.id == '#number'
    And match response.name == 'Test Product'

  @products
  Scenario: Update product
    Given path '/api/v1/products/1'
    And def update = { name: 'Updated Product', price: 149.99 }
    And request update
    When method PUT
    Then status 200
    And match response.name == 'Updated Product'
    And match response.price == 149.99

  @products
  Scenario: Delete product
    Given path '/api/v1/products/999'
    When method DELETE
    Then status 204

  @products
  Scenario: Search products by category
    Given path '/api/v1/products'
    And params { category: 'electronics', page: 1, limit: 10 }
    When method GET
    Then status 200
    And match response.products[0].category == 'electronics'

  @products
  Scenario: Filter products by price range
    Given path '/api/v1/products'
    And params { min_price: 10, max_price: 100 }
    When method GET
    Then status 200
    And match each response.products[*].price >= 10
    And match each response.products[*].price <= 100

  @products
  Scenario: Product inventory check
    Given path '/api/v1/products/1/inventory'
    When method GET
    Then status 200
    And match response.quantity >= 0

  @products
  Scenario Outline: Bulk product operations
    Given path '/api/v1/products/bulk'
    And request { ids: '<ids>', action: '<action>' }
    When method POST
    Then status 200
    And match response.success == true

    Examples:
      | ids | action |
      | 1,2,3 | activate |
      | 4,5,6 | deactivate |

  @products
  Scenario: Product not found
    Given path '/api/v1/products/999999'
    When method GET
    Then status 404
    And match response.error == 'Product not found'
