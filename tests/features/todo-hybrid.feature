Feature: Todo Application - Hybrid Testing Demo

  This feature demonstrates mixing Gherkin with custom step definitions
  and direct hop.* API calls

  Background:
    Given the page is loaded

  @smoke
  Scenario: Add a new todo using custom steps
    Given I am on the homepage
    When I fill in ".new-todo" with "Buy groceries"
    And I press "Enter"
    Then I should see "Buy groceries" in the list
    And the page should have 1 elements matching ".todo-list li"

  @smoke
  Scenario: Complete a todo using direct hop.* API
    Given I am on the homepage
    When I fill in ".new-todo" with "Walk the dog"
    And I press "Enter"
    Then I should see "Walk the dog" in the list
    
    When I click the todo "Walk the dog"
    Then the todo "Walk the dog" should be completed

  @regression
  Scenario: Delete a todo
    Given I am on the homepage
    When I fill in ".new-todo" with "Task to delete"
    And I press "Enter"
    Then I should see "Task to delete" in the list
    
    When I wait for 1 seconds
    And I click ".todo-list li .destroy" with force
    Then the page should have 0 elements matching ".todo-list li"

  @regression
  Scenario: Filter todos by status
    Given I am on the homepage
    When I fill in ".new-todo" with "Active task"
    And I press "Enter"
    And I fill in ".new-todo" with "Completed task"
    And I press "Enter"
    And I click ".todo-list li .toggle" with force
    And I wait for 1 seconds
    
    When I click "button:has-text('Completed')"
    Then the page should have 1 elements matching ".todo-list li"

  @api
  Scenario: Mock API response
    Given I am on the homepage
    When I intercept "/api/todos" with status 200 and body:
      """
      [{"id": 1, "title": "Mocked todo", "completed": false}]
      """
    And I reload the page
    And I wait for response "/api/todos"
    Then I should see "Mocked todo" in the list
    And the page should have 1 elements matching ".todo-list li"

  @mobile
  Scenario: Test on mobile device
    Given I set viewport to "iPhone 12"
    When I am on the homepage
    Then I should see ".new-todo"
    And the element ".new-todo" should have attribute "placeholder"

  @storage
  Scenario: Handle localStorage
    Given I am on the homepage
    When I set localStorage "user" to "john.doe"
    And I reload the page
    Then localStorage "user" should be "john.doe"

  @cookies
  Scenario: Handle cookies
    Given I am on the homepage
    When I set cookie "session" to "abc123"
    And I reload the page
    Then cookie "session" should exist

  @position
  Scenario: Click at specific position
    Given I am on the homepage
    When I fill in ".new-todo" with "Position test"
    And I press "Enter"
    Then I click ".todo-list li .toggle" at position 5,5

  @viewport
  Scenario: Resize viewport
    Given I am on the homepage
    When I set viewport size to 800x600
    Then the element ".new-todo" should be visible

  @scroll
  Scenario: Scroll functionality
    Given I am on the homepage
    When I fill in ".new-todo" with "Scroll test"
    And I press "Enter"
    And I scroll to bottom
    Then I should see ".footer"

  @focus
  Scenario: Focus management
    Given I am on the homepage
    When I focus ".new-todo"
    Then the element ".new-todo" should be focused

  @multiple
  Scenario: Handle multiple elements
    Given I am on the homepage
    When I fill in ".new-todo" with "Task 1"
    And I press "Enter"
    And I fill in ".new-todo" with "Task 2"
    And I press "Enter"
    And I fill in ".new-todo" with "Task 3"
    And I press "Enter"
    Then the page should have 3 elements matching ".todo-list li"
    And I get the first ".todo-list li" text and store it as firstTodo
    Then assert firstTodo contains "Task 1"