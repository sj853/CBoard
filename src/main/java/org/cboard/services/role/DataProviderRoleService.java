package org.cboard.services.role;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.cboard.dao.*;
import org.cboard.dataprovider.config.AggConfig;
import org.cboard.dataprovider.config.CompositeConfig;
import org.cboard.dataprovider.config.ConfigComponent;
import org.cboard.dataprovider.config.DimensionConfig;
import org.cboard.pojo.DashboardDatasetAuth;
import org.cboard.pojo.DashboardUserRole;
import org.cboard.services.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Repository;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Created by yfyuan on 2016/12/23.
 */
@Repository
@Aspect
@Order(2)
public class DataProviderRoleService {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private DatasourceDao datasourceDao;

    @Autowired
    private DatasetDao datasetDao;

    @Autowired
    private DatasetAuthDao datasetAuthDao;

    @Autowired
    private UserDao userDao;

    @Value("${admin_user_id}")
    private String adminUserId;

    @Around("execution(* org.cboard.services.DataProviderService.getDimensionValues(..)) ||" +
            "execution(* org.cboard.services.DataProviderService.getColumns(..)) ||" +
            "execution(* org.cboard.services.DataProviderService.queryAggData(..)) ||" +
            "execution(* org.cboard.services.DataProviderService.viewAggDataQuery(..))")
    public Object query(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        Long datasourceId = (Long) proceedingJoinPoint.getArgs()[0];
        Long datasetId = (Long) proceedingJoinPoint.getArgs()[2];
        String userid = authenticationService.getCurrentUser().getUserId();
        if (datasetId != null) {
            /**
             * 数据集细粒度权限控制
             * 2019.08.27 liaoxx
             */
            if (datasetDao.checkDatasetRole(userid, datasetId, RolePermission.PATTERN_READ) > 0) {
                MethodSignature signature = (MethodSignature) proceedingJoinPoint.getSignature();
                Method method = signature.getMethod();
                AggConfig config = null;
                if (method.getName().equals("getDimensionValues")) {
                    config = (AggConfig) proceedingJoinPoint.getArgs()[4];
                } else if (method.getName().equals("queryAggData") || method.getName().equals("viewAggDataQuery")) {
                    config = (AggConfig) proceedingJoinPoint.getArgs()[3];
                }
                if (config != null) {
                    List<String> roles = userDao.getUserRoleListByUserId(userid).stream().map(DashboardUserRole::getRoleId).collect(Collectors.toList());
                    List<DashboardDatasetAuth> datasetAuthList = datasetAuthDao.getDatasetAuthList(datasetId, roles);
                    if (config.getFilters() == null) {
                        config.setFilters(new ArrayList<>());
                    }
                    CompositeConfig authConfig = new CompositeConfig();
                    authConfig.setType("OR");
                    authConfig.setConfigComponents(getDatasetAuthConfig(datasetAuthList));
                    config.getFilters().add(authConfig);
                }
                return proceedingJoinPoint.proceed();
            }
        } else {
            if (datasourceDao.checkDatasourceRole(userid, datasourceId, RolePermission.PATTERN_READ) > 0) {
                return proceedingJoinPoint.proceed();
            }
        }
        return null;
    }

    /**
     * 获取权限配置过滤条件
     *
     * @param datasetAuthList 权限配置列表
     * @return 过滤条件列表
     */
    private ArrayList<ConfigComponent> getDatasetAuthConfig(List<DashboardDatasetAuth> datasetAuthList) {
        ArrayList<ConfigComponent> configList = new ArrayList<>();
        for (DashboardDatasetAuth datasetAuth : datasetAuthList) {
            JSONObject jsonObject = JSONObject.parseObject(datasetAuth.getConfig());
            CompositeConfig config = new CompositeConfig();
            config.setType(jsonObject.getString("value"));
            config.setConfigComponents(getDataAuthColumnConfig(jsonObject.getJSONArray("configs")));
            configList.add(config);
        }
        return configList;
    }

    /**
     * 解析数据集权限具体配置
     *
     * @param configs 数据集权限具体配置
     * @return 过滤条件列表
     */
    private ArrayList<ConfigComponent> getDataAuthColumnConfig(JSONArray configs) {
        ArrayList<ConfigComponent> configList = new ArrayList<>();
        for (Object obj : configs) {
            JSONObject config = (JSONObject) obj;
            if (config.getString("type").equals("condition")) {
                CompositeConfig subConfig = new CompositeConfig();
                subConfig.setType(config.getString("value"));
                subConfig.setConfigComponents(getDataAuthColumnConfig(config.getJSONArray("configs")));
                configList.add(subConfig);
            } else {
                DimensionConfig dimensionConfig = new DimensionConfig();
                dimensionConfig.setColumnName(config.getString("column"));
                JSONObject columnConfig = config.getJSONObject("columnConfig");
                dimensionConfig.setValues(columnConfig.getJSONArray("values").toJavaList(String.class));
                dimensionConfig.setFilterType(columnConfig.getString("type"));
                configList.add(dimensionConfig);
            }
        }
        return configList;
    }
}
