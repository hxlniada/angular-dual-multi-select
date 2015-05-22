<div class="dualmultiselect"> 
	<div class="row"> 
		<div class="col-lg-6 col-md-6 col-sm-6"> 
			<label>{{ options.labelAll }}</label> 
			<button class="btn btn-default btn-xs" ng-click="selectAll()"> 全选 </button> 
			<div class="search-wrap">
				<input class="form-control input-sm" ng-model="searchLeft" placeholder="筛选">
			</div>
			<div class="pool"> 
				<tree-view 
				input-model="dataPasser"
				ng-model="ngModel"
				value-property="{{ valueProperty }}"
				display-property="{{ displayProperty }}"
				filter-model="searchLeft"></tree-view>
			</div>
		</div>
		<div class="col-lg-6 col-md-6 col-sm-6"> 
			<label>{{ options.labelSelected }}</label> 
			<button class="btn btn-default btn-xs" ng-click="deSelectAll()"> 全不选 </button> 
			<div class="search-wrap">
				<input class="form-control input-sm" ng-model="searchRight" placeholder="筛选">
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