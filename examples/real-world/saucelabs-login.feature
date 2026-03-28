Feature: Sauce Labs Demo - Login Tests
  Real-world UI automation testing using Sauce Labs demo application
  https://www.saucedemo.com

  Background:
    Given I open browser to 'https://www.saucedemo.com'
    And I maximize the window
    And I set viewport size to 1280x720

  @ui @saucelabs @smoke @login
  Scenario: Successful login with standard user
    Given I am on the login page
    When I enter 'standard_user' in '#user-name'
    And I enter 'secret_sauce' in '#password'
    And I click '#login-button'
    Then I should see '.inventory_list'
    And the URL should contain '/inventory'
    And the element '.app_logo' should be visible
    And the page title should contain 'Swag Labs'

  @ui @saucelabs @login
  Scenario: Successful login with problem user
    Given I am on the login page
    When I enter 'problem_user' in '#user-name'
    And I enter 'secret_sauce' in '#password'
    And I click '#login-button'
    Then I should see '.inventory_list'
    And the URL should contain '/inventory'

  @ui @saucelabs @login
  Scenario: Successful login with performance glitch user
    Given I am on the login page
    When I enter 'performance_glitch_user' in '#user-name'
    And I enter 'secret_sauce' in '#password'
    And I click '#login-button'
    Then I should see '.inventory_list'
    And response time < 5000ms

  @ui @saucelabs @login @negative
  Scenario: Login with locked out user
    Given I am on the login page
    When I enter 'locked_out_user' in '#user-name'
    And I enter 'secret_sauce' in '#password'
    And I click '#login-button'
    Then I should see '.error-message-container'
    And the element '.error-message' should contain 'locked out'

  @ui @saucelabs @login @negative
  Scenario: Login with invalid credentials
    Given I am on the login page
    When I enter 'invalid_user' in '#user-name'
    And I enter 'wrong_password' in '#password'
    And I click '#login-button'
    Then I should see '.error-message-container'
    And the element '.error-message' should be visible

  @ui @saucelabs @login @validation
  Scenario: Login with empty username
    Given I am on the login page
    When I enter '' in '#user-name'
    And I enter 'secret_sauce' in '#password'
    And I click '#login-button'
    Then I should see '.error-message-container'
    And the element '.error-message' should contain 'Username is required'

  @ui @saucelabs @login @validation
  Scenario: Login with empty password
    Given I am on the login page
    When I enter 'standard_user' in '#user-name'
    And I enter '' in '#password'
    And I click '#login-button'
    Then I should see '.error-message-container'
    And the element '.error-message' should contain 'Password is required'

  @ui @saucelabs @login @validation
  Scenario: Login with empty fields
    Given I am on the login page
    When I click '#login-button'
    Then I should see '.error-message-container'
    And the element '.error-message' should be visible

  @ui @saucelabs @login @accessibility
  Scenario: Login form accessibility
    Given I am on the login page
    Then the input '#user-name' should have attribute 'placeholder'
    And the input '#password' should have attribute 'placeholder'
    And the button '#login-button' should be enabled
    And the input '#user-name' should be focusable
