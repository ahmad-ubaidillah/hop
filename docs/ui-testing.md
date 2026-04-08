# UI Testing dengan Playwright

## Dasar Browser Automation

```gherkin
Feature: Login Page

  Scenario: User can login
    Given user opens browser
    And user navigates to 'https://example.com/login'
    And user types 'admin' into 'input[name="username"]'
    And user types 'password123' into 'input[name="password"]'
    And user clicks 'button[type="submit"]'
    Then user should see element '.dashboard'
    And user should see text 'Welcome'
```

## Navigasi dan URL

```gherkin
Scenario: Navigate to page
  Given user opens browser
  And user navigates to 'https://example.com'
  Then user should see element 'h1'
```

## Interaksi Elemen

```gherkin
Scenario: Fill form
  Given user opens browser
  And user navigates to 'https://example.com/form'
  And user types 'John' into '#name'
  And user types 'john@example.com' into '#email'
  And user clicks '#submit'
  Then user should see '.success-message'
```

### Jenis Interaksi

| Keyword | Deskripsi |
|---------|-----------|
| `clicks` | Klik element |
| `double clicks` | Double click |
| `right clicks` | Right click |
| `types` | Input teks |
| `selects` | Select option |
| `checks` | Check checkbox |
| `unchecks` | Uncheck checkbox |
| `hovers` | Hover element |

## Assertion

```gherkin
Scenario: Verify element
  Then user should see element '.header'
  Then user should not see element '.error'
  Then user should see text 'Welcome'
  Then user should not see text 'Error'
  Then user should see input '#email' with value 'test@example.com'
  Then user should see element '.hidden' in hidden state
```

## Screenshot

```gherkin
Scenario: Take screenshot
  Given user opens browser
  And user navigates to 'https://example.com'
  And user takes screenshot 'homepage'
  Then user should see element '.content'
```

Screenshot akan disimpan di folder `reports/screenshots/`.

## Video Recording

```bash
hop test --video
```

## Wait dan Timeout

```gherkin
Scenario: Wait for element
  And user waits for element '.loading' to disappear
  And user waits for element '#result' for 5 seconds
  And user waits for text 'Success' for 10 seconds
```

## Multiple Tabs

```gherkin
Scenario: Handle tabs
  Given user opens browser
  And user navigates to 'https://example.com'
  And user clicks 'a[target="_blank"]'
  And user switches to new tab
  Then user should see element '.new-page-content'
  And user switches back to previous tab
```

## iFrame

```gherkin
Scenario: Interact with iframe
  Given user opens browser
  And user navigates to 'https://example.com'
  And user switches to iframe '#iframe-container'
  And user types 'test' into '#input'
  And user switches to main frame
```

## Keyboard Shortcuts

```gherkin
Scenario: Keyboard actions
  And user presses 'Enter'
  And user presses 'Control+a' in '#input'
  And user presses 'Control+c'
  And user presses 'Control+v' in '#output'
```

## Drag and Drop

```gherkin
Scenario: Drag element
  And user drags '#source' to '#target'
```

## Popup dan Dialog

```gherkin
Scenario: Handle dialog
  And user accepts dialog
  And user dismisses dialog
  And user enters 'answer' in dialog
```

## Network Interception

```gherkin
Scenario: Mock API response
  Given user opens browser
  And user mocks '/api/users' with
    """
    [{ "id": 1, "name": "Mock User" }]
    """
  And user navigates to 'https://example.com/users'
  Then user should see text 'Mock User'
```
