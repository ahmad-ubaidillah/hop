Feature: Database Interaction

  Background:
    * def dbConfig = { url: ':memory:' }
    * db.connect(dbConfig)

  Scenario: Create and verify database state
    # Create table
    Given db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)')
    
    # Insert data
    When db.execute("INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')")
    And db.execute("INSERT INTO users (name, email) VALUES (?, ?)", ['Jane Smith', 'jane@example.com'])
    
    # Query data
    Then def users = db.query('SELECT * FROM users ORDER BY id ASC')
    And match users == [{ id: 1, name: 'John Doe', email: 'john@example.com' }, { id: 2, name: 'Jane Smith', email: 'jane@example.com' }]
    
    # Query specific data
    And def jane = db.query('SELECT * FROM users WHERE name = ?', ['Jane Smith'])
    And match jane[0].email == 'jane@example.com'

  Scenario: Verify database is clean (per-scenario isolation check if needed)
    # Since background runs per scenario, we connect to a NEW :memory: db if we didn't use a shared one.
    # In-memory :memory: is unique per connection.
    Given db.execute('CREATE TABLE orders (id INTEGER PRIMARY KEY, amount REAL)')
    When db.execute('INSERT INTO orders (amount) VALUES (99.99)')
    Then def result = db.query('SELECT amount FROM orders')
    And match result[0].amount == 99.99
