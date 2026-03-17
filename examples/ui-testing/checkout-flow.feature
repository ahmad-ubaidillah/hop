Feature: Checkout Flow UI Tests
  Testing end-to-end checkout process

  Background:
    Given I open browser to 'http://app.example.com'
    And I am logged in

  @ui @checkout @smoke
  Scenario: Add product to cart
    Given I am on the product page '/product/1'
    When I click '#add-to-cart'
    Then I should see '#cart-count' with text '1'
    And a success notification should appear

  @ui @checkout
  Scenario: Update cart quantity
    Given I have '2' items in cart
    When I change quantity to '5' in cart
    Then I should see '#cart-total' updated
    And the quantity should be '5'

  @ui @checkout
  Scenario: Remove item from cart
    Given I have items in cart
    When I click remove on first item
    Then the item should be removed
    And cart should update accordingly

  @ui @checkout
  Scenario: Apply discount code
    Given I have items in cart
    When I enter 'SAVE10' in '#discount-code'
    And I click '#apply-discount'
    Then discount should be applied
    And total should reflect discount

  @ui @checkout
  Scenario: Shipping address form
    Given I am on checkout page
    When I fill shipping address:
      | field | value |
      | name | John Doe |
      | address | 123 Main St |
      | city | New York |
      | zip | 10001 |
    And I click '#continue-shipping'
    Then I should be on payment section

  @ui @checkout
  Scenario: Payment method selection
    Given I am on payment section
    When I select 'credit-card' payment
    Then credit card form should appear

  @ui @checkout
  Scenario: Complete checkout
    Given I am ready to complete order
    When I click '#place-order'
    Then I should see confirmation page
    And order number should be displayed

  @ui @checkout
  Scenario: Checkout validation
    Given I am on checkout page
    When I click '#place-order' without required fields
    Then validation errors should appear
