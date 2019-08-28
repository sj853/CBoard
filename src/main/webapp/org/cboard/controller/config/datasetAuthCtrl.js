/**
 * 细粒度权限控制
 * Created by liaoxx on 2019/8/23.
 */
cBoard.controller('datasetAuthCtrl', function ($scope, $http, $state, $stateParams, dataService, $uibModal, ModalUtils, $filter, chartService, $timeout, uuid4) {

    var translate = $filter('translate');
    $scope.optFlag = 'none';
    $scope.hierarchy = translate("CONFIG.DATASET.HIERARCHY");
    $scope.uuid4 = uuid4;

    $scope.selectDataset = null;
    $scope.selectDatasetAuth = null;
    $scope.selectRole = null;

    $scope.editRole = null;
    $scope.editRoleId = null;
    $scope.editDataset = null;
    $scope.editDatasetAuth = null;

    $scope.selectNodeType = '';

    var treeID = 'dataSetTreeID'; // Set to a same value with treeDom

    var getRoleList = function () {
        $http.get("admin/getRoleListAll.do").success(function (response) {
            $scope.roleList = response;
        });
    };

    var getDatasetList = function () {
        $http.get("dashboard/getDatasetList.do").success(function (response) {
            $scope.datasetList = response;
            getDatasetAuthList();
        });
    };

    var getDatasetAuthList = function() {
        $http.get("dashboard/datasetAuthList.do").success(function (response) {
            $scope.datasetAuthList = response;
            $scope.searchNode();
            if ($stateParams.id) {
                $scope.editDs(_.find($scope.datasetAuthList, function (ds) {
                    return ds.id == $stateParams.id;
                }));
            }
        });
    };

    getRoleList();
    getDatasetList();

    var findConfigParent = function(config, configId) {
        if (config.type === 'condition' && config.configs && config.configs.length > 0) {
            var c = _.find(config.configs, function (cc) {
                return cc.id === configId;
            });
            if (c != null) {
                return config;
            }
            for (var i = 0; i < config.configs.length; i++) {
                c = findConfigParent(config.configs[i], configId);
                if (c != null) {
                    return config.configs[i];
                }
            }
        }
        return null;
    };

    $scope.toTrash = function (config, index) {
        var parent = findConfigParent($scope.editConfig[0], config.id);
        if (parent != null) {
            parent.configs.splice(index, 1);
        }
    };

    $scope.switchCondition = function(config) {
        if (config.value === 'AND') {
            config.value = "OR";
            config.text = translate("CONFIG.DATASET.AUTH.CONDITION_OR");
            config.switchText = translate("CONFIG.DATASET.AUTH.SWITCH_TO_AND");
        } else {
            config.value = "AND";
            config.text = translate("CONFIG.DATASET.AUTH.CONDITION_AND");
            config.switchText = translate("CONFIG.DATASET.AUTH.SWITCH_TO_OR");
        }
    }

    $scope.newDatasetAuth = function () {
        $scope.alerts = [];
        $scope.optFlag = 'new';
        $scope.editDataset = angular.copy($scope.selectDataset);
        $scope.selects = $scope.editDataset.data.selects;
        $scope.editRole = null;
        if ($scope.roleList && $scope.roleList.length > 0) {
            $scope.editRole = $scope.roleList[0];
            $scope.editRoleId = $scope.editRole.roleId;
        }
        var addCondition = $scope.getAndCondition();
        addCondition.root = true;
        $scope.editConfig = [addCondition];
    };

    $scope.getAndCondition = function() {
        return {
            "type": "condition",
            "value": "AND",
            "text": translate("CONFIG.DATASET.AUTH.CONDITION_AND"),
            "switchText": translate("CONFIG.DATASET.AUTH.SWITCH_TO_OR"),
            "id": uuid4.generate(),
            "configs": []
        };
    };

    $scope.getOrCondition = function() {
        return {
            "type": "condition",
            "value": "OR",
            "text": translate("CONFIG.DATASET.AUTH.CONDITION_OR"),
            "switchText": translate("CONFIG.DATASET.AUTH.SWITCH_TO_AND"),
            "id": uuid4.generate(),
            "configs": []
        };
    };

    $scope.editFilter = function (config) {
        $uibModal.open({
            templateUrl: 'org/cboard/view/config/datasetauth/columnConfig.html',
            windowTemplateUrl: 'org/cboard/view/util/modal/window.html',
            backdrop: false,
            size: 'lg',
            resolve: {
                param: function () {
                    if (config.columnConfig) {
                        return config.columnConfig;
                    }
                    return {col: config.column, type: '=', values: []};
                },
                filter: function () {
                    return true;
                },
                getSelects: function () {
                    return function (byFilter, column, callback) {
                        dataService.getDimensionValues($scope.selectDataset.data.datasource, undefined, $scope.selectDataset.id, column, undefined, function (filtered) {
                            callback(filtered);
                        });
                    };
                },
                ok: function () {
                    return function (param) {
                        config.columnConfig = param;
                    }
                }
            },
            controller: 'columnConfigCtrl'
        });
    };

    $scope.startEditDatasetAuth = function() {
        $scope.alerts = [];
        $scope.optFlag = 'edit';
        $scope.editDataset = angular.copy($scope.selectDataset);
        $scope.selects = $scope.editDataset.data.selects;
        $scope.editRole = $scope.selectRole;
        $scope.editDatasetAuth = angular.copy($scope.selectDatasetAuth);
        var addCondition = angular.copy($scope.editDatasetAuth.config);
        addCondition.root = true;
        $scope.editConfig = [addCondition];
    };

    $scope.deleteDatasetAuth = function () {
        ModalUtils.confirm(translate("COMMON.CONFIRM_DELETE"), "modal-warning", "lg", function () {
            $http.post("dashboard/deleteDatasetAuth.do", {id: $scope.selectDatasetAuth.id}).success(function (serviceStatus) {
                if (serviceStatus.status === '1') {
                    getDatasetList();
                } else {
                    ModalUtils.alert(serviceStatus.msg, "modal-warning", "lg");
                }
                $scope.optFlag = 'none';
            });
        });
    };

    var validate = function () {
        $scope.alerts = [];
        if (!$scope.editConfig || $scope.editConfig.length === 0 || $scope.editConfig[0].configs.length === 0) {
            $scope.alerts = [{msg: translate('CONFIG.DATASET.AUTH.AUTH_CONFIG') + translate('COMMON.NOT_EMPTY'), type: 'danger'}];
            return false;
        }
        return true;
    };

    $scope.save = function () {
        if (!validate()) {
            return;
        }

        if ($scope.optFlag === 'new') {
            $http.post("dashboard/savedDatasetAuth.do", {
                json: angular.toJson({
                    config: $scope.editConfig,
                    roleId: $('#selRole').val(),
                    datasetId: $scope.editDataset.id
                })
            }).success(function (serviceStatus) {
                if (serviceStatus.status === '1') {
                    getDatasetList();
                    ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
                    $scope.optFlag = 'none';
                } else {
                    $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
                }
            });
        } else {
            $http.post("dashboard/updateDatasetAuth.do", {
                json: angular.toJson({
                    config: $scope.editConfig,
                    id: $scope.editDatasetAuth.id
                })}).success(function (serviceStatus) {
                if (serviceStatus.status === '1') {
                    $scope.optFlag = 'edit';
                    getDatasetList();
                    ModalUtils.alert(translate("COMMON.SUCCESS"), "modal-success", "sm");
                } else {
                    $scope.alerts = [{msg: serviceStatus.msg, type: 'danger'}];
                }
            });
        }
    };

    $scope.cancel = function() {
        $scope.optFlag = 'none';
    };

    $scope.createNode = function (item) {
        item.id = uuid4.generate();
        return item;
    };

    $scope.toCondition = function(o) {
        $scope.editConfig[0].configs.push(o);
    };

    /**  js tree related start **/
    $scope.treeConfig = jsTreeConfig1;

    $("#" + treeID).keyup(function (e) {
        if (e.keyCode == 46) {
            $scope.deleteDatasetAuth();
        }
    });

    $scope.searchNode = function () {
        var para = {dsName: '', dsrName: ''};
        //split search keywords
        if ($scope.keywords) {
            if ($scope.keywords.indexOf(' ') === -1 && $scope.keywords.indexOf(':') === -1) {
                para.dsName = $scope.keywords;
            } else {
                var keys = $scope.keywords.split(' ');
                for (var i = 0; i < keys.length; i++) {
                    var w = keys[i].trim();
                    if (w.split(':')[0] === 'ds') {
                        para["dsName"] = w.split(':')[1];
                    }
                    if (w.split(':')[0] === 'dsr') {
                        para["dsrName"] = w.split(':')[1];
                    }
                }
            }
        }
        //map datasetList to list (add datasourceName)
        var treeData = [{
            "id": "root",
            "text": "Root",
            state: {opened: true},
            "parent": "#"
        }];
        _.each($scope.datasetList, function (dataset) {
            var dsr = _.find($scope.datasourceList, function (obj) {
                return obj.id === dataset.data.datasource
            });
            var search = true;
            if (para.dsName) {
                search = search && dataset.name.indexOf(para.dsName) > -1;
            }
            if (para.dsrName) {
                search = search && dsr.name.indexOf(para.dsrName) > -1;
            }
            if (search) {
                var categoryNode;
                if (dataset.categoryName) {
                    var arr = dataset.categoryName.split('/');
                    for (var i = 0; i < arr.length; i++) {
                        var category = {
                            "id": "category_" + arr[i],
                            "text": arr[i],
                            "parent": "root"
                        };
                        if (i > 0) {
                            category.parent = "category_" + arr[i - 1];
                        }
                        if (i === arr.length - 1) {
                            categoryNode = category.id;
                        }
                        var existsNode = (function(categoryId){
                            return _.find(treeData, function (node) {
                                return node.id === categoryId;
                            });
                        })(category.id);
                        if (!existsNode) {
                            treeData.push(category);
                        }
                    }
                }
                treeData.push({
                    "id": "dataset_" + dataset.id,
                    "text": dataset.name,
                    "parent": categoryNode,
                    "icon": 'glyphicon glyphicon-th-large'
                });
                _.each(_.filter($scope.datasetAuthList, function (datasetAuth) {
                    return datasetAuth.datasetId === dataset.id;
                }), function (datasetAuth) {
                    treeData.push({
                        "id": "dataset_auth_" + datasetAuth.id,
                        "text": datasetAuth.roleName,
                        "parent": "dataset_" + dataset.id,
                        "icon": 'glyphicon glyphicon-user'
                    });
                });
            }
        });

        jstree_ReloadTree(treeID, treeData);
    };

    $scope.treeEventsObj = {
        ready: function() {
            $timeout(function() {
                $scope.ignoreChanges = false;
            });
        },
        activate_node: function(obj, e) {
            var myJsTree = jstree_GetWholeTree(treeID);
            var data = myJsTree.get_selected(true)[0];
            if (data.children.length > 0) {
                if (data.id.indexOf('dataset_') < 0) {
                    myJsTree.deselect_node(data);
                    myJsTree.toggle_node(data);
                }
            }
            $scope.refreshToolButtonState(data);
        },
        dblclick: function () {
            var selectedNodes = jstree_GetSelectedNodes(treeID);
            if (selectedNodes.length === 0) return; // Ignore double click folder action
            $scope.refreshToolButtonState(selectedNodes[0]);
            if ($scope.selectNodeType === 'dataset') {
                $scope.newDatasetAuth();
            } else if ($scope.selectNodeType === 'dataset_auth') {
                $scope.startEditDatasetAuth();
            }
        },
        move_node: function (e, data) {
        }
    };

    $scope.refreshToolButtonState = function(node) {
        $scope.selectNodeType = '';
        if (node.id.indexOf('dataset_auth_') >= 0) {
            $scope.selectNodeType = 'dataset_auth';
            var datasetAuthId = parseInt(node.id.replace('dataset_auth_', ''));
            $scope.selectDatasetAuth = _.find($scope.datasetAuthList, function (datasetAuth) {
                return datasetAuth.id === datasetAuthId;
            });
            $scope.selectDataset = _.find($scope.datasetList, function (dataset) {
                return dataset.id === $scope.selectDatasetAuth.datasetId
            });
            $scope.selectRole = _.find($scope.roleList, function (role) {
                return role.roleId === $scope.selectDatasetAuth.roleId;
            });
        } else if (node.id.indexOf('dataset_') >= 0) {
            $scope.selectNodeType = 'dataset';
            $scope.selectDatasetAuth = null;
            $scope.selectRole = null;
            var datasetId = parseInt(node.id.replace('dataset_', ''));
            $scope.selectDataset = _.find($scope.datasetList, function (dataset) {
                return dataset.id === datasetId
            });
        }
    };
});