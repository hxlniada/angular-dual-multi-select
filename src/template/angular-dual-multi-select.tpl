<div class="dualmultiselect"> 
    <div class="row"> 
        <div class="col-lg-6 col-md-6 col-sm-6"> 
            <label>{{ labelAll }}</label> 
            <button type="button" class="btn btn-default btn-xs" ng-click="selectAll()"> {{buttonCheckAll}} </button> 
            <div class="search-wrap">
                <input class="form-control input-sm" ng-model="searchLeft">
            </div>
            <div class="pool">
                <tree-view
                input-model="dataPasser"
                ng-model="ngModel"
                recursion-check="recursionCheck"
                output-duplicate="outputDuplicate"
                output-all-info="outputAllInfo"
                recursion-expand="recursionExpand"
                options="options"
                transfer-data="true"
                filter-model="searchLeft"></tree-view>
            </div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6"> 
            <label>{{ labelSelected }}</label> 
            <button type="button" class="btn btn-default btn-xs" ng-click="deSelectAll()"> {{buttonDeselectAll}} </button>
            <div class="search-wrap">
                <input class="form-control input-sm" ng-model="searchRight">
            </div>
            <div class="pool">
                <ul>
                    <li ng-repeat="item in helperArray | filter:searchRight" ng-show="isShow(item.id)"> 
                        <a ng-click="deSelect(item.id)">
                            {{ item.text }}
                        </a>
                    </li>
                </ul> 
            </div>
        </div>
    </div>
</div>