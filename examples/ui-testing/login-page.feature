Feature: Login Page UI Tests
  Testing login page interactions and validations

  Background:
    Given I open browser to 'http://app.example.com'
    And I maximize the window

  @ui @login @smoke
  Scenario: Successful login
    Given I am on the login page
    When I enter 'admin@example.com' in '#email'
    And I enter 'password123' in '#password'
    And I click '#login-button'
    Then I should see '#dashboard'
    And the URL should contain '/dashboard'

  @ui @login
  Scenario: Invalid credentials
    Given I am on the login page
    When I enter 'invalid@example.com' in '#email'
    And I enter 'wrongpassword' in '#password'
    And I click '#login-button'
    Then I should see '.error-message'
    And the element '#error-message' should contain 'Invalid credentials'

  @ui @login
  Scenario: Empty fields validation
    Given I am on the login page
    When I click '#login-button'
    Then the element '#email-error' should be visible
    And the element '#email-error' should contain 'Email is required'

  @ui @login
  Scenario: Invalid email format
    Given I am on the login page
    When I enter 'not-an-email' in '#email'
    And I click '#login-button'
    Then the element '#email-error' should contain 'Invalid email'

  @ui @login
  Scenario: Remember me checkbox
    Given I am on the login page
    When I check '#remember-me'
    And I enter credentials and login
    Then the remember me cookie should be set

  @ui @login
  Scenario: Forgot password link
    Given I am on the login page
    When I click '#forgot-password'
    Then I should see '#reset-password-form'
    And the URL should contain '/forgot-password'

  @ui @login
  Scenario: Password visibility toggle
    Given I am on the login page
    And I enter 'secretpassword' in '#password'
    When I click '#toggle-password'
    Then the input '#password' should have type 'text'

  @ui @login
  Scenario: Login form layout
    Given I am on the login page
    Then the element '#login-form' should be centered
    And the button '#login-button' should be enabled
