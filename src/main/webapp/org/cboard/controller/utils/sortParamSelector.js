/**
 * Created by yfyuan on 2017/5/2.
 */
cBoard.controller('sortParamSelector', function ($scope, $uibModalInstance, dataService, param, filter, getSelects, ok) {
    $scope.currentSelectIndex = -1;
    $scope.param = param;
    $scope.filter = filter;
    $scope.byFilter = {a: false};
    $scope.loadSelect = true;
    $scope.getSelects = function () {
        $scope.loading = true;
        getSelects($scope.byFilter.a, $scope.param.col, function (d) {
            $scope.selects = d;
            $scope.loading = false;
        });
    };
    $scope.dbclickPush = function (o) {
        if ($scope.param.sortValues.length == 1 && (_.isUndefined($scope.param.sortValues[0]) || $scope.param.sortValues[0] == '')) {
            $scope.param.sortValues.length = 0;
        }
        $scope.param.sortValues.push(o);
    };
    $scope.deleteValues = function (array) {
        $scope.param.sortValues = _.difference($scope.param.sortValues, array);
    };
    $scope.pushValues = function (array) {
        if ($scope.param.sortValues.length == 1 && (_.isUndefined($scope.param.sortValues[0]) || $scope.param.sortValues[0] == '')) {
            $scope.param.sortValues.length = 0;
        }
        _.each(array, function (e) {
            $scope.param.sortValues.push(e);
        });
    };

    $scope.updateCurrentIndex = function (index) {
        $scope.currentSelectIndex = index;
    };

    $scope.upTopValue = function (index) {
        if ($scope.param.sortValues && index > 0) {
            let temp = $scope.param.sortValues[index]
            $scope.param.sortValues = _.without($scope.param.sortValues, temp);
            $scope.param.sortValues.unshift(temp)
            $scope.currentSelectIndex = 0
        }

    };

    $scope.downBottomValue = function (index) {
        if ($scope.param.sortValues && index < $scope.param.sortValues.length - 1) {
            let temp = $scope.param.sortValues[index]
            $scope.param.sortValues = _.without($scope.param.sortValues, temp);
            $scope.param.sortValues.push(temp)
            $scope.currentSelectIndex = $scope.param.sortValues.length - 1
        }

    };


    $scope.upValue = function (index) {
        if ($scope.param.sortValues && index > 0) {
            let temp = $scope.param.sortValues[index]
            $scope.param.sortValues[index] = $scope.param.sortValues[index - 1]
            $scope.param.sortValues[index - 1] = temp
            $scope.currentSelectIndex--
        }

    };


    $scope.downValue = function (index) {
        if ($scope.param.sortValues && index < $scope.param.sortValues.length - 1) {
            let temp = $scope.param.sortValues[index]
            $scope.param.sortValues[index] = $scope.param.sortValues[index + 1]
            $scope.param.sortValues[index + 1] = temp
            $scope.currentSelectIndex++
        }
    };


    $scope.selected = function (v) {
        return _.indexOf($scope.param.sortValues, v) == -1;
    };
    $scope.close = function () {
        $uibModalInstance.close();
    };
    $scope.ok = function () {
        $uibModalInstance.close();
        $scope.param.sortValues = _.filter($scope.param.sortValues, function (e) {
                return e != null && !_.isUndefined(e);
            }
        );
        ok($scope.param);
    };

    $scope.initValues = function () {
        if ($scope.param.sortValues.length == 0) {
            $scope.param.sortValues.length = 1;
        }
    };
});