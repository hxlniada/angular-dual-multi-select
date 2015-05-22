angular.module('DualMultiSelect', ['TreeView'])
.directive('dualmultiselect', function($q, $filter) {
	return {
		restrict: 'AE',
		scope: {
			options: '=',
			ngModel: '='
		},
		controller: function($scope) {
			$scope.valueProperty = $scope.options.valueProperty || 'id';
			$scope.displayProperty = $scope.options.displayProperty || 'text';
			$scope.childrenProperty = $scope.options.childrenProperty || 'children';

			var filters = {
				filter: $filter('filter')
			};

			function getHelper(id) {
				return $scope.helperObject[id];
			}

			function initDatas() {
				var deferred = $q.defer();
				if (angular.isFunction($scope.options.items.then)) {
					$scope.options.items.then(function (data) {
						deferred.resolve(data);
					});
				} else {
					deferred.resolve($scope.options.items);
				}

				deferred.promise.then(function (data) {
					$scope.items = angular.copy(data);
					var helpers = createHelpers($scope.items);
					$scope.helperObject = helpers.obj;
					$scope.rootMap = helpers.rootMap;
					$scope.helperArray = helpers.arr;
				});

				return deferred.promise;
			}

			function createHelpers(value) {
                var obj = {};
                var rootMap = [];
                var arr = [];

                function createHelper(value, parent) {
                    if (!angular.isArray(value)) {
                        return;
                    }

                    for (var i = 0; i < value.length; i++) {
                        obj[value[i][$scope.valueProperty]] = {
                            body: value[i],
                            //parent: parent,
                            //children: value[i][$scope.childrenProperty]
                        };
                        arr.push({
                            text: value[i][$scope.displayProperty],
                            id: value[i][$scope.valueProperty]
                        });
                        if (!parent) {
                        	rootMap.push(obj[value[i][$scope.valueProperty]]);
                        }
                        if (value[i][$scope.childrenProperty]) {
                            createHelper(value[i][$scope.childrenProperty], value[i]);
                        }               
                    }
                }

                createHelper(value);

                return {
                	obj: obj,
                	rootMap: rootMap,
                	arr: arr
                };
            }

            $scope.selectAll = function () {
            	var result = [];
            	angular.forEach($scope.rootMap, function (item) {
            		result.push(item.body[$scope.valueProperty]);
            	});

            	if (result.length === 0) {
            		$scope.ngModel = undefined;
            	} else {
            		$scope.ngModel = result;
            	}
            };

            $scope.deSelectAll = function () {
            	$scope.ngModel = undefined;
            };
            $scope.deSelect = function (id) {
            	var result = angular.copy($scope.ngModel);
            	var index = result.indexOf(id);
            	result.splice(index, 1);
            	if (result.length === 0) {
            		$scope.ngModel = undefined;
            	} else {
            		$scope.ngModel = result;
            	}
            };
            $scope.isShow = function (id) {

            	if (!angular.isArray($scope.ngModel)) {
            		return false;
            	}
            	return $scope.ngModel.indexOf(id) !== -1;
            };

            $scope.getData = function (id) {
            	return $scope.helperObject[id].body;
            };

			$scope.dataPasser = initDatas();
		},
		templateUrl: 'angular-dual-multi-select.tpl'
	};
});
;(function(){

'use strict';

angular.module('DualMultiSelect').run(['$templateCache', function($templateCache) {

  $templateCache.put('angular-dual-multi-select.tpl', '<div class="dualmultiselect"> \n	<div class="row"> \n		<div class="col-lg-6 col-md-6 col-sm-6"> \n			<label>{{ options.labelAll }}</label> \n			<button class="btn btn-default btn-xs" ng-click="selectAll()"> 全选 </button> \n			<div class="search-wrap">\n				<input class="form-control input-sm" ng-model="searchLeft" placeholder="筛选">\n			</div>\n			<div class="pool"> \n				<tree-view \n				input-model="dataPasser"\n				ng-model="ngModel"\n				value-property="{{ valueProperty }}"\n				display-property="{{ displayProperty }}"\n				filter-model="searchLeft"></tree-view>\n			</div>\n		</div>\n		<div class="col-lg-6 col-md-6 col-sm-6"> \n			<label>{{ options.labelSelected }}</label> \n			<button class="btn btn-default btn-xs" ng-click="deSelectAll()"> 全不选 </button> \n			<div class="search-wrap">\n				<input class="form-control input-sm" ng-model="searchRight" placeholder="筛选">\n			</div>\n			<div class="pool"> \n				<ul> \n					<li ng-repeat="item in helperArray | filter:searchRight" ng-show="isShow(item.id)"> \n						<a ng-click="deSelect(item.id)">\n							{{ item.text }}\n						</a>\n					</li>\n				</ul> \n			</div>\n		</div>\n	</div>\n</div>');

}]);

})();