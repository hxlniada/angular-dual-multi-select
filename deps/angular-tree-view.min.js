/**
 * @file treeViewItem directive
 * @author 862802759@qq.com
 */
angular.module('TreeView', ['RecursionHelper']).directive('treeViewItem',
function (RecursionHelper) {

    return {
        replace: true,
        templateUrl: 'angular-tree-view-item.tpl',
        controller: function ($scope, $attrs) {
            $scope.$watch(function () {
                return $scope.$eval($attrs.datas);
            }, function (value) {
                $scope.datas = value;
            });
        },
        compile: function (element) {
            return RecursionHelper.compile(element);
        }
    };
});

/**
 * @file tree-view组件
 * @author 862802759@qq.com
 */
angular.module('TreeView').directive('treeView',
function (RecursionHelper, $q, $filter) {
    var filters = {
        filter: $filter('filter')
    };

    return {
        templateUrl: 'angular-tree-view.tpl',
        scope: {
            outputAllInfo: '=',
            datas: '=inputModel',
            ngModel: '=',
            filterModel: '=',
            multipleSelect: '=',
            recursionCheck: '=',
            recursionExpand: '=',
            outputDuplicate: '=',
            singleMode: '=',
            outputType: '=',
            options: '=',
            transferData: '='
        },
        controller: function ($scope, $element, $attrs) {
            var id = 0;
            // modelId表示值
            // checkId表示要将model更新的动作
            // 如果modelId与checkId相等，则表示此次操作model已经更新过了
            // 在操作的最后需要将modelId和checkId重新弄成不相等的情况
            // 以方便下次更新
            var modelId = 1;
            var checkId = 0;

            $scope.options = $scope.options || {};
            $scope.displayProperty = $scope.options.displayProperty || 'text';
            $scope.valueProperty = $scope.options.valueProperty || 'id';
            $scope.childrenProperty = $scope.options.childrenProperty || 'children';

            $scope.iconLeaf = $scope.options.iconLeaf || 'glyphicon glyphicon-file fa fa-file';
            $scope.iconExpand = $scope.options.iconExpand || 'glyphicon glyphicon-minus fa fa-minus';
            $scope.iconCollapse = $scope.options.iconCollapse || 'glyphicon glyphicon-plus fa fa-plus';

            var utils = {
                // 数组减法
                arrayMinus: function (source, target) {
                    source = source || [];
                    target = target || [];
                    var result = [];
                    for (var i = 0; i < source.length; i++) {
                        if (this.find(target, source[i]) === -1) {
                            result.push(source[i]);
                        }
                    }
                    return result;
                },
                find: function (source, target) {
                    if (angular.isObject(target)) {
                        for (var i = 0; i < source.length; i++) {
                            if (target.body[$scope.valueProperty] === source[i].body[$scope.valueProperty]) {
                                return i;
                            }
                        }
                        return -1;
                    }
                    return source.indexOf(target);
                }
            };

            var treeView = {
                status: 'pending',
                init: function () {
                    var self = this;
                    $element.addClass('tree-view');
                    this.bindEvents();
                    this.initDatas().then(function (data) {
                        $scope.showDatas = $scope.transferData ? data : angular.copy(data);
                        var helpers = self.createHelpers($scope.showDatas);
                        $scope.helperObject = helpers.obj;
                        if ($attrs.filterModel) {
                            $scope.helperArray = helpers.arr;
                        }
                        self.updateHelperByInput();
                        self.status = 'success';
                    });
                },
                initDatas: function () {
                    var deferred = $q.defer();

                    if (angular.isDefined($scope.datas) && angular.isFunction($scope.datas.then)) {
                        $scope.datas.then(function (response) {
                            deferred.resolve(response.data);
                        });
                    }
                    else {
                        deferred.resolve($scope.datas);
                    }
                    return deferred.promise;
                },
                // added 添加的内容
                // deleted删除的内容
                updateHelperByInput: function (added, deleted) {
                    var self = this;
                    if (added) {
                        deleted.forEach(function (value) {
                            self.changeStateById(angular.isObject(value)
                                ? value.body[$scope.valueProperty] : value, false, true);
                        });
                        added.forEach(function (value) {
                            self.changeStateById(angular.isObject(value)
                                ? value.body[$scope.valueProperty] : value, true, true);
                        });
                    }
                    else {
                        angular.forEach($scope.ngModel, function (value) {
                            self.changeStateById(angular.isObject(value)
                                ? value.body[$scope.valueProperty] : value, true, true);
                        });
                    }
                    // 在计算过后更新model，以防漏网之鱼
                    self.updateModelByCheck(true);
                },
                changeStateById: function (id, value, isNgModelChange) {
                    $scope.helperObject[id].checked = value;
                    if ($scope.recursionCheck) {
                        this.calculateChecked($scope.helperObject[id].body);
                    }
                    if (value && $scope.recursionExpand) {
                        this.expandUp(id);
                    }
                    if (!value && $scope.recursionExpand && isNgModelChange) {
                        this.collapseDown(id);
                    }
                },
                // isFromModel 是否是因为model的变化而导致整个节点需要重新计算
                updateModelByCheck: function (isFromModel) {
                    checkId = modelId;
                    var result = [];
                    angular.forEach($scope.helperObject, function (item) {
                        if (item.checked) {
                            if ($scope.outputAllInfo) {
                                result.push(item);
                            }
                            else {
                                result.push(item.body[$scope.valueProperty]);
                            }
                        }
                    });
                    if (!$scope.outputDuplicate) {
                        result = this.deleteDuplicated(result);
                    }
                    if (result.length === 0) {
                        // 如果是因为model的变化而导致整个节点更新，并且model在节点更新后未改变
                        // 则手动将modelId自增
                        if (isFromModel && (!$scope.ngModel || !$scope.ngModel.length)) {
                            modelId++;
                        }
                        $scope.ngModel = undefined;
                    }
                    else {
                        if (isFromModel && ($scope.ngModel && ($scope.ngModel.length === result.length))) {
                            console.log('modelId++');
                            modelId++;
                        }
                        $scope.ngModel = $scope.singleMode ? result[0] : result;
                    }
                },
                changeStateByModelChange: function (newValue, oldValue) {
                    // checkId = modelId说明model已经更新过了，不需要再重复计算
                    if ((newValue === oldValue && angular.isUndefined(newValue))
                            || (this.status !== 'success')
                            || (checkId === modelId)) {
                        modelId++;
                        return;
                    }
                    modelId++;
                    if ($scope.singleMode) {
                        if (angular.isDefined(newValue)) {
                            this.changeStateById(angular.isObject(newValue)
                                ? newValue.body[$scope.valueProperty] : newValue, true, true);
                        }
                        else {
                            this.changeStateById(angular.isObject(oldValue)
                                ? oldValue.body[$scope.valueProperty] : oldValue, false, true);
                        }
                    }
                    else {
                        var deletedValues = utils.arrayMinus(oldValue, newValue);
                        var addedValues = utils.arrayMinus(newValue, oldValue);

                        this.updateHelperByInput(addedValues, deletedValues);
                    }
                },
                bindEvents: function () {
                    var self = this;

                    if ($scope.singleMode) {
                        $scope.$watch('ngModel', function (newValue, oldValue) {
                            self.changeStateByModelChange(newValue, oldValue);
                        });
                    }
                    else {
                        $scope.$watchCollection('ngModel', function (newValue, oldValue) {
                            self.changeStateByModelChange(newValue, oldValue);
                        });
                    }

                    $scope.$watch('filterModel', function (newValue, oldValue) {
                        if ((newValue === oldValue) || (self.status !== 'success')) {
                            return;
                        }
                        angular.forEach($scope.helperObject, function (item, key) {
                            item.filtered = false;
                        });
                        var result = filters.filter($scope.helperArray, {
                            text: newValue
                        });
                        result.forEach(function (value) {
                            self.getHelper(value.id).filtered = true;
                            self.filtUp(value.id);
                            self.expandUp(value.id);
                        });
                    });
                },
                // 上层的全部为筛选状态
                filtUp: function (id) {
                    var helper = this.getHelper(id);
                    if (helper.parent) {
                        var parentId = this.getParentId(id);
                        this.getHelper(parentId).filtered = true;
                        this.filtUp(parentId);
                    }
                },
                // 将上层的全部展开
                expandUp: function (id) {
                    var helper = this.getHelper(id);
                    if (helper.parent) {
                        this.getHelper(helper.parent).expanded = true;
                        this.expandUp(this.getParentId(id));
                    }
                },
                collapseDown: function (id) {
                    var helper = this.getHelper(id);
                    helper.expanded = false;
                    if (helper.children) {
                        for (var i = 0; i < helper.children.length; i++) {
                            this.collapseDown(helper.children[i][$scope.valueProperty]);
                        }
                    }
                },
                deleteDuplicated: function (result) {
                    var itemsHaveParent = [];
                    // 找出有父层在内的
                    for (var i = 0; i < result.length; i++) {
                        var currentId = angular.isObject(result[i])
                            ? result[i].body[$scope.valueProperty] : result[i];
                        var parentId = this.getParentId(currentId);
                        var itemTofind = parentId;
                        if ($scope.outputAllInfo) {
                            itemTofind = {body: {}};
                            itemTofind.body[$scope.valueProperty] = parentId;
                        }
                        if (angular.isDefined(parentId) && (utils.find(result, itemTofind) !== -1)) {
                            itemsHaveParent.push(result[i]);
                        }
                    }
                    // 删除这些包含父元素的
                    return utils.arrayMinus(result, itemsHaveParent);
                },
                initCheck: function () {
                    angular.forEach($scope.helperObject, function (value) {
                        value.checked = false;
                    });
                },
                calculateChecked: function (data) {
                    var helper = this.getHelper(data);

                    this.calculateDown(helper);
                    this.calculateUp(helper);
                },
                calculateDown: function (helper) {
                    if (helper.children) {
                        for (var i = 0; i < helper.children.length; i++) {
                            this.getHelper(helper.children[i]).checked = helper.checked;
                            this.calculateDown(this.getHelper(helper.children[i]));
                        }
                    }
                },
                calculateUp: function (helper) {
                    if (helper.parent) {
                        var checked = 0;
                        for (var i = 0; i < helper.parent.children.length; i++) {
                            if (this.getHelper(helper.parent.children[i]).checked) {
                                checked++;
                            }
                        }
                        this.getHelper(helper.parent).checked = (checked === helper.parent.children.length);

                        this.calculateUp(this.getHelper(helper.parent));
                    }
                },
                getParentId: function (id) {
                    var helper = this.getHelper(id);
                    if (!helper.parent) {
                        return false;
                    }
                    return this.getHelper(helper.parent).body[$scope.valueProperty];
                },
                getHelper: function (input) {
                    var id = input;
                    if (angular.isObject(input)) {
                        id = input[$scope.valueProperty];
                    }
                    return $scope.helperObject[id];
                },
                // 递归推入所有对象建立双链表，并建立数组方便筛选
                createHelpers: function (value) {
                    var obj = {};
                    var arr = [];

                    function createHelper(value, parent) {
                        if (!angular.isArray(value)) {
                            return;
                        }
                        for (var i = 0; i < value.length; i++) {
                            if (!value[i].hasOwnProperty($scope.valueProperty)) {
                                value[i][$scope.valueProperty] = id++;
                            }

                            obj[value[i][$scope.valueProperty]] = {
                                body: value[i],
                                parent: parent,
                                children: value[i][$scope.childrenProperty]
                            };
                            if ($attrs.filterModel) {
                                arr.push({
                                    text: value[i][$scope.displayProperty],
                                    id: value[i][$scope.valueProperty]
                                });
                            }
                            if (value[i][$scope.childrenProperty] && value[i][$scope.childrenProperty].length) {
                                createHelper(value[i][$scope.childrenProperty], value[i]);
                            }
                        }
                    }
                    createHelper(value);

                    return {
                        obj: obj,
                        arr: arr
                    };
                }
            };

            $scope.getIcon = function (data) {
                if (!data[$scope.childrenProperty] || !data[$scope.childrenProperty].length) {
                    return $scope.iconLeaf;
                }
                if ($scope.helperObject[data[$scope.valueProperty]].expanded === true) {
                    return $scope.iconExpand;
                }
                return $scope.iconCollapse;
            };

            $scope.toggleExpanded = function (data, event) {
                $scope.helperObject[data[$scope.valueProperty]].expanded = !$scope.isExpanded(data);
                event.stopPropagation();
            };

            $scope.isExpanded = function (data) {
                return $scope.helperObject[data[$scope.valueProperty]].expanded;
            };

            $scope.isChecked = function (data) {
                return $scope.helperObject[data[$scope.valueProperty]].checked;
            };

            $scope.toggleChecked = function (data) {
                var preValue = $scope.isChecked(data);
                if ($scope.singleMode) {
                    treeView.initCheck();
                }
                $scope.helperObject[data[$scope.valueProperty]].checked = !preValue;

                if ($scope.recursionCheck) {
                    treeView.calculateChecked(data);
                }
                treeView.updateModelByCheck();
            };

            $scope.isFiltered = function (data) {
                return treeView.getHelper(data).filtered !== false;
            };

            treeView.init();
        }
    };
});

;(function(){

'use strict';

angular.module('TreeView').run(['$templateCache', function($templateCache) {

  $templateCache.put('angular-tree-view-item.tpl', '<ul class="tree-view-group">\n    <li ng-repeat="data in datas" ng-class="{expanded: isExpanded(data)}" ng-show="isFiltered(data)">\n        <a ng-class="{checked: isChecked(data)}" ng-click="toggleChecked(data, $event)">\n            <span ng-class="getIcon(data)" ng-click="toggleExpanded(data, $event)"></span>\n            {{ data[displayProperty] }}\n        </a>\n        <tree-view-item\n        ng-if="data[childrenProperty]"\n        datas="data[childrenProperty]"\n        ></tree-view-item>\n    </li>\n</ul>');

  $templateCache.put('angular-tree-view.tpl', '<tree-view-item \n    datas="showDatas" \n    value-property="{{ valueProperty }}"\n    display-property="{{ displayProperty }}"\n    icon-leaf="{{ iconLeaf }}"\n    icon-expand="{{ iconExpand }}"\n    icon-collapse="{{ iconCollapse }}"\n    helper-object="helperObject"\n    ></tree-view-item>');

}]);

})();