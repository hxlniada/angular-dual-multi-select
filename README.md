# angular-dual-multi-select
### install
```
bower install angular-dual-multi-select --save
```
### features
* infinite levels
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
<dualmultiselect
    options="options"
    input-model=“inputModel”
    recursion-check="Boolean"
    output-all-info="Boolean"
    output-duplicate="Boolean"
    ng-model="value"></dualmultiselect>
```

### propertys
* ng-model required
 
 just normal ng-model, it's an array of valueProperty
 
    ```
    // result maybe
    undefined // if nothing is checked
    ['1', '2'] // if '1' and '2' is checked
    ```
* recursion-check optional [false]
 
 whether check all/uncheck all

* input-model required

 source array

* output-all-info optional [false]

 whether output the valueProperty or output the full object

* output-duplicate optional [false]

 if all of the child node is checked, whether just output the parent node

* options

listed below

### options

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

