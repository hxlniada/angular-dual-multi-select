/**
 * @file tree-view组件
 * @author 862802759@qq.com
 */
angular.module('TreeView', [])
.provider('treeViewConfig', function () {
    var self = this;
    this.options = {
        iconLeaf: 'fa fa-file glyphicon glyphicon-file',
        iconExpand: 'fa fa-minus glyphicon glyphicon-minus',
        iconCollapse: 'fa fa-plus glyphicon glyphicon-plus',
        template: [
            '<ul class="tree-view-group">',
                '<li ng-repeat="data in data[children]"',
                    'ng-class="{expanded: isExpanded(data)}"',
                    'ng-if="!filterModel || isFiltered(data)">',
                    '<span class="tree-icon" ng-class="getExpandIcon(data)" ng-click="toggleExpanded(data, $event)"></span>',
                    '<a ng-class="{checked: isChecked(data), indetermine: !isChecked(data) && childrenChecked(data)}"',
                        'ng-click="toggleChecked(data, $event)">',
                        '{{ data[displayProperty] }}',
                    '</a>',
                    '<tree-view-item',
                        'ng-if="data[children] && isExpanded(data)"',
                    '></tree-view-item>',
                '</li>',
            '</ul>'
        ].join(' ')
    };

    this.$get = function () {
        return self.options;
    };
})
.directive('treeViewItem', function () {
    return {
        require: '^treeView',
        link: function (scope, element, attrs, treeViewCtrl) {
            treeViewCtrl.template(scope, function (clone) {
                element.empty().append(clone);
            });
        }
    };
})
.directive('treeView', function ($q, treeViewConfig) {
    return {
        scope: {
            outputAllInfo: '=',
            datas: '=inputModel',
            ngModel: '=',
            filterModel: '=',
            recursionCheck: '=',
            recursionExpand: '=',
            outputDuplicate: '=',
            singleMode: '=',
            options: '=',
            transferData: '=',
            hashObject: '='
        },
        link: function (scope, element, attrs, treeCtrl, childTranscludeFn) {
            treeCtrl.template(scope, function (clone) {
                element.empty().append(clone);
            });

            scope.$treeTransclude = childTranscludeFn;
        },
        controller: function ($scope, $element, $attrs, $compile) {
            var id = 0;

            $scope.options = $scope.options || {};
            $scope.displayProperty = $scope.options.displayProperty || 'text';
            $scope.valueProperty = $scope.options.valueProperty || 'id';
            $scope.children = $scope.options.childrenProperty || 'children';

            $scope.iconLeaf = $scope.options.iconLeaf || treeViewConfig.iconLeaf;
            $scope.iconExpand = $scope.options.iconExpand || treeViewConfig.iconExpand;
            $scope.iconCollapse = $scope.options.iconCollapse || treeViewConfig.iconCollapse;
            $scope.iconCheck = $scope.options.iconCheck || treeViewConfig.iconCheck;
            $scope.iconUnCheck = $scope.options.iconUnCheck || treeViewConfig.iconUnCheck;

            this.template = $compile(treeViewConfig.template);

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
                            if (target[$scope.valueProperty] === source[i][$scope.valueProperty]) {
                                return i;
                            }
                        }
                        return -1;
                    }
                    return source.indexOf(target);
                },
                shallowMinus: function (source, target) {
                    for (var i = 0; i < source.length; i++) {
                        if (target.indexOf(source[i]) !== -1) {
                            source.splice(i, 1);
                            i--;
                        }
                    }
                }
            };

            var treeView = {
                modelInited: false,
                inited: false,
                init: function (value) {
                    $element.addClass('tree-view');
                    this.transformDataToTree(value);
                    $scope.data = {};
                    $scope.data[$scope.children] = value;
                    if (!this.inited) {
                        this.bindEvents();
                    }
                    this.inited = true;
                    this.modelInited = false;
                },
                // 如果结果只需要id，剥掉object外壳
                unwrap: function (rawObjects) {
                    for (var i = 0; i < rawObjects.length; i++) {
                        rawObjects[i] = rawObjects[i][$scope.valueProperty];
                    }
                },
                // isFromModel 是否是因为model的变化而导致整个节点需要重新计算
                updateModelByCheck: function (changedItems, changeToResult, isFromModel) {
                    // 如果输出结果不是输出所有(只输出id)
                    if (!$scope.outputAllInfo) {
                        this.unwrap(changedItems);
                    }
                    // 更新model
                    if (changeToResult === true) {
                        $scope.ngModel = $scope.ngModel || [];
                        Array.prototype.push.apply($scope.ngModel, changedItems);
                    }
                    else {
                        utils.shallowMinus($scope.ngModel, changedItems);
                    }
                    // 如果父层选择后不需要子层的结果
                    // 则去掉重复结果
                    if (!$scope.outputDuplicate) {
                        if (changeToResult === true) {
                            this.deleteDuplicated($scope.ngModel);
                        }
                        if (changeToResult === false) {
                            this.fillResult($scope.ngModel, changedItems);
                        }
                    }
                },
                // 在不允许重复模式中
                // 多选的复层被去掉后，子层剩余的要被选中
                fillResult: function (result, deleted) {
                    var pairs = [];
                    // 最底层的节点
                    var bottomChild;
                    // 第一步，找出自己以及父层同时被删除的节点对(可能是三个以上)
                    for (var i = 0; i < deleted.length; i++) {
                        var parentItem = this.getParentItem(deleted[i]);
                        if (deleted.indexOf(parentItem) !== -1) {
                            if (pairs.indexOf(parentItem) === -1) {
                                pairs.push(parentItem);
                            }
                            bottomChild = deleted[i];
                            pairs.push(deleted[i]);
                        }
                    }
                    if (!pairs.length) {
                        return;
                    }

                    // 根据底层节点以及父层节点，将底层节点的相邻节点选中
                    var parentObject = $scope.outputAllInfo
                        ? bottomChild.$treeView.parentData
                        : this.hashObject[bottomChild].$treeView.parentData;

                    // 如果是反选或者不存在这样的对
                    if (pairs.length >= parentObject[$scope.children].length) {
                        return;
                    }

                    var childObject = $scope.outputAllInfo ? bottomChild : this.hashObject[bottomChild];
                    var resultToConcat = [].concat(parentObject[$scope.children]);
                    resultToConcat.splice(resultToConcat.indexOf(childObject), 1);
                    if (!$scope.outputAllInfo) {
                        this.unwrap(resultToConcat);
                    }
                    Array.prototype.push.apply(result, resultToConcat);
                },
                // 在不允许重复模式中
                // 父层被选择后，子层的值需要去掉
                deleteDuplicated: function (result) {
                    for (var i = 0; i < result.length; i++) {
                        var parentItem;
                        if (!$scope.outputAllInfo) {
                            parentItem = this.hashObject[result[i]].$treeView.parentData;
                            parentItem = parentItem && parentItem[$scope.valueProperty];
                        }
                        else {
                            parentItem = result[i].$treeView.parentData;
                        }
                        if (result.indexOf(parentItem) !== -1) {
                            result.splice(i, 1);
                            i--;
                        }
                    }
                },
                // 与手动点击相对，这是值变化的时候，状态改变
                // 注意：值的变化不会引起复杂计算
                updateStateByModelChange: function (newValue, oldValue) {
                    var added;
                    if (this.modelInited) {
                        added = utils.arrayMinus(newValue, oldValue);
                    }
                    else {
                        added = newValue;
                        this.modelInited = true;
                    }
                    var deleted = utils.arrayMinus(oldValue, newValue);
                    for (var i = 0; i < added.length; i++) {
                        var currentData = $scope.outputAllInfo ? added[i] : this.hashObject[added[i]];
                        currentData.$treeView.isChecked = true;
                        this.expandUp(currentData);
                    }
                    for (i = 0; i < deleted.length; i++) {
                        currentData = $scope.outputAllInfo ? deleted[i] : this.hashObject[deleted[i]];

                        // 这里是为了防止不允许重复(outputDuplicate为false时)
                        // 父层被选中，子层被deleteDuplicate后，出现的混乱情况
                        if (!$scope.outputDuplicate
                                && currentData.$treeView.parentData
                                && currentData.$treeView.parentData.$treeView.isChecked) {
                            continue;
                        }
                        currentData.$treeView.isChecked = false;
                        // 推拉框优化，右边只有一个选项时（全选）
                        // 因为只有一个选项，所以deleted.length === 1
                        // 并且没有added
                        // 或者反选的时候，此时newValue为空
                        if (!$scope.outputDuplicate
                                && (!newValue.length
                                        || (deleted.length === 1 && !added.length))) {
                            this.calculateDown(currentData);
                        }
                    }
                    // 推拉框优化
                    // 全选时，去掉重复
                    if (!$scope.outputDuplicate && newValue.length === this.currentLength) {
                        this.deleteDuplicated($scope.ngModel);
                    }
                },
                expandUp: function (data) {
                    var parentItem = data.$treeView.parentData;
                    if (parentItem && !parentItem.$treeView.isExpanded) {
                        if (parentItem.$treeView.isChecked) {
                            this.expandUp(parentItem);
                        }
                        else {
                            parentItem.$treeView.isExpanded = true;
                            this.expandUp(parentItem);
                        }
                    }
                },
                getParentItem: function (data) {
                    var parentItem;
                    if (!$scope.outputAllInfo) {
                        parentItem = this.hashObject[data].$treeView.parentData;
                        parentItem = parentItem && parentItem[$scope.valueProperty];
                    }
                    else {
                        parentItem = data.$treeView.parentData;
                    }
                    return parentItem;
                },
                calculateChecked: function (data, valueChangedItems) {
                    this.calculateDown(data, valueChangedItems);
                    this.calculateUp(data, valueChangedItems);
                },
                calculateDown: function (data, valueChangedItems) {
                    if (data[$scope.children]) {
                        for (var i = 0; i < data[$scope.children].length; i++) {
                            if (data[$scope.children][i].$treeView.isChecked !== data.$treeView.isChecked) {
                                valueChangedItems && valueChangedItems.push(data.children[i]);
                                data.children[i].$treeView.isChecked = data.$treeView.isChecked;
                                // 如果父子状态一样就没必要往下检测了
                                // 只有全选的时候才有可能一样
                                this.calculateDown(data.children[i]);
                            }
                        }
                    }
                },
                calculateUp: function (data, valueChangedItems) {
                    if (data.$treeView.parentData
                            && data.$treeView.parentData.$treeView.isChecked !== data.$treeView.isChecked) {
                        var preValue = !!data.$treeView.parentData.$treeView.isChecked;
                        var checked = 0;
                        for (var i = 0; i < data.$treeView.parentData.children.length; i++) {
                            if (data.$treeView.parentData.children[i].$treeView.isChecked) {
                                checked++;
                            }
                        }
                        // 所有子孙节点都被全选
                        data.$treeView.parentData.$treeView.isChecked = (checked === i);
                        if (data.$treeView.parentData.$treeView.isChecked !== preValue) {
                            valueChangedItems && valueChangedItems.push(data.$treeView.parentData);
                            // 如果父子状态一样就没必要往上检测了
                            // 只有不选择的时候才有可能一样
                            this.calculateUp(data.$treeView.parentData);
                        }
                    }
                },
                hashObject: {},
                currentLength: 0,
                transformDataToTree: function (data) {
                    var stack = [];
                    this.hashObject = {};
                    // 一个迭代，将$treeView的一些属性加进去
                    for (var i = 0; i < data.length; i++) {
                        data[i].$treeView = data[i].$treeView || {};
                        if (!($scope.valueProperty in data[i])) {
                            data[i][$scope.valueProperty] = id++;
                        }
                        this.currentLength++;
                        this.hashObject[data[i][$scope.valueProperty]] = data[i];
                        stack.push(data[i]);
                    }
                    while (stack.length) {
                        var tempData = stack.pop();
                        if (tempData[$scope.children] && tempData[$scope.children].length) {
                            for (i = 0; i < tempData[$scope.children].length; i++) {
                                var tempChild = tempData[$scope.children][i];
                                tempChild.$treeView = tempChild.$treeView || {};
                                tempChild.$treeView.parentData = tempData;
                                if (!($scope.valueProperty in tempChild)) {
                                    tempChild[$scope.valueProperty] = id++;
                                }
                                this.currentLength++;
                                this.hashObject[tempChild[$scope.valueProperty]] = tempChild;
                                stack.push(tempChild);
                            }
                        }
                    }
                    if ($attrs.hashObject) {
                        $scope.hashObject = this.hashObject;
                    }
                },
                bindEvents: function () {
                    var self = this;

                    if ($scope.singleMode) {
                        $scope.$watch('ngModel', function (newValue, oldValue) {
                            self.updateStateByModelChange(newValue, oldValue);
                        });
                    }
                    else {
                        $scope.$watchCollection('ngModel', function (newValue, oldValue) {
                            newValue = newValue || [];
                            oldValue = oldValue || [];
                            self.updateStateByModelChange(newValue, oldValue);
                        });
                    }

                    $scope.$watch('filterModel', function (newValue, oldValue) {
                        if (!newValue) {
                            return;
                        }
                        var result = [];
                        angular.forEach(self.hashObject, function (item, key) {
                            if (item[$scope.displayProperty].toString().indexOf(newValue) !== -1) {
                                result.push(item);
                            }
                            else {
                                item.$treeView.isFiltered = false;
                            }
                        });

                        for (var i = 0; i < result.length; i++) {
                            result[i].$treeView.isFiltered = true;
                            self.filtUp(result[i]);
                            self.expandUp(result[i]);
                        }
                    });
                },
                filtUp: function (data) {
                    if (data.$treeView.parentData && !data.$treeView.parentData.isFiltered) {
                        data.$treeView.parentData.isFiltered = true;
                        this.filtUp(data.$treeView.parentData);
                    }
                }
            };

            $scope.getExpandIcon = function (data) {
                if (!(data[$scope.children] && data[$scope.children].length)) {
                    return $scope.iconLeaf;
                }
                if (data.$treeView.isExpanded) {
                    return $scope.iconExpand;
                }
                return $scope.iconCollapse;
            };

            $scope.toggleExpanded = function (data, event) {
                data.$treeView.isExpanded = !data.$treeView.isExpanded;
                event.stopPropagation();
            };

            $scope.isExpanded = function (data) {
                return !!data.$treeView.isExpanded;
            };

            $scope.isChecked = function (data) {
                return !!data.$treeView.isChecked;
            };

            $scope.childrenChecked = function (data) {
                if (!data[$scope.children] || !data[$scope.children].length) {
                    return false;
                }
                var stack = [];
                var children = data[$scope.children];
                for (var i = 0; i < children.length; i++) {
                    if (children[i].$treeView.isChecked) {
                        return true;
                    }
                    stack.push(children[i]);
                }
                while (stack.length) {
                    var tempData = stack.pop();
                    if (!tempData.children || !tempData.children.length) {
                        continue;
                    }
                    for (i = 0; i < tempData.children.length; i++) {
                        if (tempData.children[i].$treeView.isChecked) {
                            return true;
                        }
                        stack.push(tempData.children[i]);
                    }
                }
                return false;
            };

            $scope.toggleChecked = function (data) {
                var preValue = $scope.isChecked(data);
                var valueChangedItems = [data];
                if ($scope.singleMode) {
                    treeView.initCheck();
                }
                data.$treeView.isChecked = !preValue;
                // 如果需要递归check，则递归check
                // 并且每次check的结果传入下一次check
                if ($scope.recursionCheck) {
                    treeView.calculateChecked(data, valueChangedItems);
                }
                treeView.updateModelByCheck(valueChangedItems, data.$treeView.isChecked, false);
            };

            $scope.isFiltered = function (data) {
                return !!data.$treeView.isFiltered;
            };

            $scope.$watch('datas', function (newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                    treeView.init(newValue);
                }
            });
        }
    };
});
