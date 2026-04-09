# Gherkin Guide

[← Back to Main README](../README.md) | [Getting Started](./getting-started.md)

Learn how to write tests in Gherkin syntax.

---

## Basic Structure

```gherkin
Feature: User Login

  Scenario: User can login with valid credentials
    Given I am on the login page
    When I enter username "admin" and password "secret"
    And I click the login button
    Then I should see the dashboard
```

---

## Feature & Scenario

### Feature

```gherkin
Feature: Shopping Cart

  As a customer
  I want to add items to my cart
  So that I can purchase them
```

### Scenario

```gherkin
Scenario: Add item to cart
  Given I am on the product page
  When I click "Add to Cart"
  Then my cart should have 1 item
```

---

## Steps

### Given - Preconditions

```gherkin
Given I am on the homepage
Given the user "admin" exists
Given the page is loaded
Given I am logged in as "admin"
```

### When - Actions

```gherkin
When I click "#submit"
When I fill "#email" with "test@example.com"
When I select "Option 1" from "#dropdown"
When I press "Enter"
```

### Then - Assertions

```gherkin
Then I should see "#message"
Then the page should have 1 elements matching ".item"
Then the element "#title" should have text "Hello"
```

### And / But - Continue Previous

```gherkin
Given I am on the page
And I fill "#name" with "John"
And I click "#submit"
But I should not see "Error"
```

---

## Background

Run before each scenario:

```gherkin
Feature: Shopping

  Background:
    Given I am on the homepage
    And I am logged in

  Scenario: Add to cart
    When I click "Add to Cart"
    Then I should see "1 item in cart"

  Scenario: Remove from cart
    Given I have 1 item in cart
    When I click "Remove"
    Then cart should be empty
```

---

## Tags

```gherkin
@smoke
Scenario: Quick test
  ...

@regression
Scenario: Full test
  ...

@api
Scenario: API test
  ...
```

Run specific tags:

```bash
hop test --tags "@smoke"
hop test --tags "@regression and not @slow"
```

---

## Data Tables

```gherkin
Scenario: Add multiple items
  When I add the following items:
    | item    | quantity |
    | Apple   | 2        |
    | Banana  | 3        |
  Then cart should have 5 items
```

---

## Examples (Scenario Outline)

```gherkin
Scenario Outline: Login with different users
  Given I am on the login page
  When I login with "<username>" and "<password>"
  Then I should see "<result>"

  Examples:
    | username | password | result    |
    | admin   | secret   | dashboard |
    | guest   | guest123 | guest view|
    | invalid | invalid  | error     |
```

---

## Hooks in Gherkin

Use custom step definitions:

```typescript
// steps/hooks.ts
import { defineBefore, defineAfter } from 'hop';

defineBefore(async () => {
  await hop.launch();
});

defineAfter(async () => {
  await hop.close();
});
```

---

## Mix with Direct Code

You can mix Gherkin with direct hop.* calls:

```gherkin
Feature: Hybrid Test

  Scenario: Use both
    Given I am on the homepage
    When I click "#button"    # Uses step definition
    And hop.get('#result').shouldHave('Success')  # Direct code
    Then I should see "#output"
```

---

## See Also

- [Custom Steps](./custom-steps.md)
- [Hop API Reference](./hop-api.md)
- [Getting Started](./getting-started.md)