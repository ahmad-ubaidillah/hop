# API Testing Guide

## 基本 HTTP 请求

```gherkin
Feature: 用户管理

  Scenario: 获取用户详情
    Given url 'https://jsonplaceholder.typicode.com'
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.name != null
```

## POST 请求与请求体

```gherkin
Scenario: 创建新用户
  Given path '/posts'
  And request
    """
    {
      "title": "测试文章",
      "body": "内容",
      "userId": 1
    }
    """
  When method POST
  Then status 201
  And match response.id == '#number'
```

## 请求头与认证

```gherkin
Scenario: 授权请求
  Given url 'https://api.example.com'
  And header Authorization = 'Bearer token123'
  And header Content-Type = 'application/json'
  Given path '/protected'
  When method GET
  Then status 200
```

## 查询参数

```gherkin
Scenario: 带查询参数
  Given url 'https://jsonplaceholder.typicode.com'
  Given path '/posts'
  And param userId = '1'
  And param _limit = '5'
  When method GET
  Then status 200
  And match response == '#array'
```

## 使用变量

```gherkin
Scenario: 使用变量
  # 设置变量
  Given def userId = '123'
  
  # 在路径中使用
  Given path '/users/' + userId
  
  # 在请求体中使用
  And request { userId: '#(userId)', action: 'update' }
  
  # 存储响应
  When method GET
  Then status 200
  And def savedUser = response
```

## 模糊匹配

```gherkin
Scenario: 验证响应结构
  When method GET
  Then status 200
  And match response == 
    """
    {
      "id": '#number',
      "name": '#string',
      "email": '#string',
      "active": '#boolean'
    }
    """
```

## 数据表

```gherkin
Scenario Outline: 创建多个用户
  Given path '/users'
  And request
    """
    {
      "name": "<name>",
      "email": "<email>"
    }
    """
  When method POST
  Then status 201

  Examples:
    | name          | email                 |
    | John Doe      | john@example.com      |
    | Jane Smith    | jane@example.com      |
```

## CSV 数据加载

```gherkin
Scenario: 从 CSV 加载数据
  Given url 'https://api.example.com'
  And def users = read('data/users.csv')
  Then match users[0].name == 'John'
```

## GraphQL

```gherkin
Scenario: GraphQL 查询
  Given url 'https://api.example.com/graphql'
  And request
    """
    {
      query {
        user(id: 1) {
          name
          email
        }
      }
    }
    """
  When method POST
  Then status 200
  And match response.data.user.name == '#string'
```

## 重试机制

```gherkin
Scenario: 带重试的请求
  Given url 'https://api.example.com'
  Given path '/slow-endpoint'
  And retry 3 times
  When method GET
  Then status 200
```

## 文件上传

```gherkin
Scenario: 上传文件
  Given url 'https://api.example.com/upload'
  And multipart field file = read('data/test.pdf')
  When method POST
  Then status 201
```

## 内置关键字

| 关键字 | 描述 |
|--------|------|
| `url` | 设置基础 URL |
| `path` | 设置请求路径 |
| `method` | HTTP 方法 (GET/POST/PUT/DELETE) |
| `header` | 设置请求头 |
| `param` | 查询参数 |
| `request` | 请求体 |
| `status` | 验证状态码 |
| `match` | 响应匹配 |
| `def` | 定义变量 |
| `set` | 设置变量 |
