@ui
Feature: UI Testing with Playwright

  @smoke
  Scenario: Open browser and navigate to page
    Given user opens browser
    When user navigates to 'https://example.com'
    Then user should see element 'h1'

  Scenario: Navigate to example and check title
    Given user opens browser
    When user navigates to 'https://example.com'
    Then user should see text 'Example Domain'
