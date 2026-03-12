@ui @failing
Feature: Failing UI Test for Media Verification

  Scenario: This test should fail and capture media
    Given user opens browser
    When user navigates to 'https://example.com'
    Then user should see text 'This Text Does Not Exist'
