Feature: Component Testing with Hop

  Background:
    Given component tester for react with rootDir "./examples/react-app"

  Scenario: Test button component
    When I mount "./components/Button.jsx" with props { "label": "Click me", "onClick": "handleClick" }
    Then I query "button" should have text "Click me"
    When I click "button"
    And I wait for "#counter" for 1000 ms
    Then I query "#counter" should have text "1"

  Scenario: Test input component
    When I mount "./components/TextInput.jsx" with props { "placeholder": "Enter text", "value": "" }
    Then I query "input" should have placeholder "Enter text"
    When I type "Hello World" into "input"
    Then I query "input" should have value "Hello World"
    When I trigger "blur" on "input"
    And I get prop "value" and store it as inputValue
    Then assert inputValue == "Hello World"

  Scenario: Test Vue component
    Given component tester for vue with rootDir "./examples/vue-app"
    When I mount "./components/Counter.vue" with props { "initialCount": 5 }
    Then I query ".count" should have text "5"
    When I click ".increment-btn"
    Then I query ".count" should have text "6"

  Scenario: Test Angular component
    Given component tester for angular with rootDir "./examples/angular-app"
    When I mount "app-user-profile" with props { "user": { "name": "John Doe", "email": "john@example.com" } }
    Then I query "h2" should have text "John Doe"
    And I query "p" should have text "john@example.com"