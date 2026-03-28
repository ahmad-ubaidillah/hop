Feature: Sauce Labs Demo - Inventory Tests
  Real-world UI automation testing for product inventory
  https://www.saucedemo.com

  Background:
    Given I open browser to 'https://www.saucedemo.com'
    And I maximize the window
    And I login as 'standard_user'

  @ui @saucelabs @inventory @smoke
  Scenario: View inventory page after login
    Then I should see '.inventory_list'
    And I should see '.inventory_item' count > 0
    And the element '.title' should contain 'Products'

  @ui @saucelabs @inventory
  Scenario: Verify inventory items are displayed
    Then I should see '.inventory_item' count == 6
    And each '.inventory_item' should contain '.inventory_item_name'
    And each '.inventory_item' should contain '.inventory_item_price'
    And each '.inventory_item' should contain '.inventory_item_img'

  @ui @saucelabs @inventory @sorting
  Scenario: Sort products by name A to Z
    Given I am on inventory page
    When I select 'az' from '.product_sort_container'
    Then the products should be sorted alphabetically ascending

  @ui @saucelabs @inventory @sorting
  Scenario: Sort products by name Z to A
    Given I am on inventory page
    When I select 'za' from '.product_sort_container'
    Then the products should be sorted alphabetically descending

  @ui @saucelabs @inventory @sorting
  Scenario: Sort products by price low to high
    Given I am on inventory page
    When I select 'lohi' from '.product_sort_container'
    Then the products should be sorted by price ascending

  @ui @saucelabs @inventory @sorting
  Scenario: Sort products by price high to low
    Given I am on inventory page
    When I select 'hilo' from '.product_sort_container'
    Then the products should be sorted by price descending

  @ui @saucelabs @inventory @product
  Scenario: View product details
    Given I am on inventory page
    When I click first '.inventory_item_name'
    Then I should see '.inventory_details_container'
    And the URL should contain '/inventory-item'
    And I should see '.inventory_details_name'
    And I should see '.inventory_details_desc'
    And I should see '.inventory_details_price'

  @ui @saucelabs @inventory @product
  Scenario: Add single product to cart
    Given I am on inventory page
    When I click first 'button[id*="add-to-cart"]'
    Then the cart badge should show '1'
    And the button text should change to 'Remove'

  @ui @saucelabs @inventory @cart
  Scenario: Add multiple products to cart
    Given I am on inventory page
    When I add products to cart:
      | product_name | quantity |
      | Sauce Labs Backpack | 1 |
      | Sauce Labs Bike Light | 1 |
      | Sauce Labs Bolt T-Shirt | 1 |
    Then the cart badge should show '3'

  @ui @saucelabs @inventory @cart
  Scenario: Remove product from cart on inventory page
    Given I am on inventory page
    And I have added 'Sauce Labs Backpack' to cart
    When I click 'button[data-test="remove-sauce-labs-backpack"]'
    Then the cart badge should not be visible
    And the button text should change to 'Add to cart'

  @ui @saucelabs @inventory @navigation
  Scenario: Navigate back to inventory from product details
    Given I am viewing product details for 'Sauce Labs Backpack'
    When I click '#back-to-products'
    Then I should see '.inventory_list'
    And the URL should be '/inventory'

  @ui @saucelabs @inventory @social
  Scenario: Social media links are present
    Given I am on inventory page
    Then I should see '.social_twitter'
    And I should see '.social_facebook'
    And I should see '.social_linkedin'

  @ui @saucelabs @inventory @menu
  Scenario: Open and close side menu
    Given I am on inventory page
    When I click '#react-burger-menu-btn'
    Then I should see '.bm-menu'
    And I should see '#logout_sidebar_link'
    And I should see '#about_sidebar_link'
    When I click '#react-burger-cross-btn'
    Then I should not see '.bm-menu'

  @ui @saucelabs @inventory @logout
  Scenario: Logout from inventory page
    Given I am on inventory page
    When I open the menu
    And I click '#logout_sidebar_link'
    Then I should be on login page
    And the URL should be '/'
