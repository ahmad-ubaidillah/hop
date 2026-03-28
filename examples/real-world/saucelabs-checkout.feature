Feature: Sauce Labs Demo - Checkout Flow
  Real-world end-to-end testing for complete purchase flow
  https://www.saucedemo.com

  Background:
    Given I open browser to 'https://www.saucedemo.com'
    And I maximize the window
    And I login as 'standard_user'

  @ui @saucelabs @checkout @smoke @e2e
  Scenario: Complete checkout flow with single item
    Given I am on inventory page
    When I add 'Sauce Labs Backpack' to cart
    And I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | John |
      | last-name | Doe |
      | postal-code | 12345 |
    And I continue checkout
    And I finish checkout
    Then I should see checkout complete message
    And the order should be confirmed
    And I should see 'THANK YOU FOR YOUR ORDER'

  @ui @saucelabs @checkout @e2e
  Scenario: Complete checkout flow with multiple items
    Given I am on inventory page
    When I add products to cart:
      | product_name |
      | Sauce Labs Backpack |
      | Sauce Labs Bike Light |
      | Sauce Labs Bolt T-Shirt |
    And I go to cart
    Then the cart should contain 3 items
    When I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | Jane |
      | last-name | Smith |
      | postal-code | 90210 |
    And I continue checkout
    Then I should see order summary with 3 items
    When I finish checkout
    Then I should see checkout complete message

  @ui @saucelabs @cart
  Scenario: View cart contents
    Given I am on inventory page
    And I have added products to cart:
      | product_name |
      | Sauce Labs Backpack |
      | Sauce Labs Fleece Jacket |
    When I go to cart
    Then I should see '.cart_item' count == 2
    And the cart should contain 'Sauce Labs Backpack'
    And the cart should contain 'Sauce Labs Fleece Jacket'

  @ui @saucelabs @cart
  Scenario: Remove item from cart
    Given I am on inventory page
    And I have added products to cart:
      | product_name |
      | Sauce Labs Backpack |
      | Sauce Labs Bike Light |
    When I go to cart
    And I remove 'Sauce Labs Backpack' from cart
    Then the cart should contain 1 item
    And the cart should not contain 'Sauce Labs Backpack'
    And the cart should contain 'Sauce Labs Bike Light'

  @ui @saucelabs @cart
  Scenario: Continue shopping from cart
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I click '#continue-shopping'
    Then I should be on inventory page
    And the cart badge should show '1'

  @ui @saucelabs @checkout @validation
  Scenario: Checkout with missing first name
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | |
      | last-name | Doe |
      | postal-code | 12345 |
    And I continue checkout
    Then I should see error message 'Error: First Name is required'

  @ui @saucelabs @checkout @validation
  Scenario: Checkout with missing last name
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | John |
      | last-name | |
      | postal-code | 12345 |
    And I continue checkout
    Then I should see error message 'Error: Last Name is required'

  @ui @saucelabs @checkout @validation
  Scenario: Checkout with missing postal code
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | John |
      | last-name | Doe |
      | postal-code | |
    And I continue checkout
    Then I should see error message 'Error: Postal Code is required'

  @ui @saucelabs @checkout @validation
  Scenario: Checkout with all fields empty
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I continue checkout
    Then I should see error message containing 'required'

  @ui @saucelabs @checkout
  Scenario: Verify checkout overview information
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | John |
      | last-name | Doe |
      | postal-code | 12345 |
    And I continue checkout
    Then I should see payment information
    And I should see shipping information
    And I should see item total
    And I should see tax
    And I should see total price
    And the total should be greater than item total

  @ui @saucelabs @checkout
  Scenario: Cancel checkout and return to inventory
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I click '#cancel'
    Then I should be on inventory page
    And the cart badge should show '1'

  @ui @saucelabs @checkout @cancel
  Scenario: Cancel from checkout step two
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | John |
      | last-name | Doe |
      | postal-code | 12345 |
    And I continue checkout
    And I click '#cancel'
    Then I should be on inventory page
    And the cart should be empty

  @ui @saucelabs @price
  Scenario: Verify price calculations in checkout
    Given I am on inventory page
    When I add products to cart:
      | product_name |
      | Sauce Labs Backpack |
      | Sauce Labs Bike Light |
    And I go to cart
    And I proceed to checkout
    And I fill checkout information:
      | field | value |
      | first-name | Test |
      | last-name | User |
      | postal-code | 10001 |
    And I continue checkout
    Then the item total should be $39.98
    And the tax should be $3.20
    And the total should be $43.18
