# angular-dual-multi-select
### install
```
bower install angular-dual-multi-select --save
```
### features
* infinite levels
* support promise data
* check all/uncheck all

### dependencies
* angular 1.3+
* angular-recursion
* angular-tree-view https://github.com/hxlniada/angular-tree-view
* bootstrap.css

### usage
* add it to your module dependence
```javascript
angular.module('yourModule', ['DualMultiSelect']);
```
* in html
```html
<dualmultiselect options="options" ng-model="value"></dualmultiselect>
```

### propertys
* ng-model required
 
 just normal ng-model, it's an array of valueProperty
 
    ```
    // result maybe
    undefined // if nothing is checked
    ['1', '2'] // if '1' and '2' is checked
    ```
* options

listed below

### options

* items (array/promise) required
 
 your data to display, such as
 
    ```javascript
    // array
    $scope.data = [
        {id: '1', text: '1', children: [
            {id: '1-1', text: '1-1', children: [
            ...
            ]},
            {id: '1-2', text: '1-2}
        ]},
        {id: '2', text: '2'},
        {id: '3', text: '3'}
    ]
    // promise
    $scope.data = $http.get('dataLink').then(function(response) {
        // if success
        if (response.data.code === 200) {
            return response.data.data;
        }
        ...
        // if there is no return, will display nothing
    });
    ```
* valueProperty optional
 
 the value property of your data
 
    ```
    default: 'id'
    ```
* displayProperty  optional
 
 the property to display
 
    ```
    default: 'text'
    ```
* labelAll: required

  all text
  
* labelSelected: required

  selected text


