package org.cboard.services;

import com.alibaba.fastjson.JSONObject;
import com.google.common.collect.Lists;
import org.cboard.dao.DatasetAuthDao;
import org.cboard.dto.ViewDashboardDatasetAuth;
import org.cboard.pojo.DashboardDatasetAuth;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;

/**
 * 数据集权限服务
 *
 * @author liaoxx
 */
@Service
public class DatasetAuthService {

    @Autowired
    private DatasetAuthDao datasetAuthDao;

    /**
     * 获取所有数据集权限配置 列表
     *
     * @return 数据集权限配置列表
     */
    public List<ViewDashboardDatasetAuth> getAllDatasetAuthList() {
        return Lists.transform(datasetAuthDao.getAllDatasetAuthList(), ViewDashboardDatasetAuth.TO);
    }

    /**
     * 新增数据
     *
     * @param userId 用户id
     * @param json   json
     * @return 新增结果
     */
    public ServiceStatus save(String userId, String json) {
        JSONObject jsonObject = JSONObject.parseObject(json);
        DashboardDatasetAuth dashboardDatasetAuth = new DashboardDatasetAuth();
        dashboardDatasetAuth.setUserId(userId);
        dashboardDatasetAuth.setDatasetId(jsonObject.getLong("datasetId"));
        dashboardDatasetAuth.setRoleId(jsonObject.getString("roleId"));
        dashboardDatasetAuth.setConfig(JSONObject.parseArray(jsonObject.getString("config")).getJSONObject(0).toJSONString());
        dashboardDatasetAuth.setCreateTime(new Timestamp(System.currentTimeMillis()));
        dashboardDatasetAuth.setUpdateTime(dashboardDatasetAuth.getCreateTime());
        if (datasetAuthDao.getDatasetAuth(dashboardDatasetAuth.getDatasetId(), dashboardDatasetAuth.getRoleId(), 0L) != null) {
            return new ServiceStatus(ServiceStatus.Status.Fail, "该数据集已配置该角色数据权限");
        }
        datasetAuthDao.save(dashboardDatasetAuth);
        return new ServiceStatus(ServiceStatus.Status.Success, "保存成功");
    }

    /**
     * 更新配置
     *
     * @param json 配置
     * @return 更新结果
     */
    public ServiceStatus update(String json) {
        JSONObject jsonObject = JSONObject.parseObject(json);
        DashboardDatasetAuth dashboardDatasetAuth = new DashboardDatasetAuth();
        dashboardDatasetAuth.setId(jsonObject.getLong("id"));
        dashboardDatasetAuth.setConfig(JSONObject.parseArray(jsonObject.getString("config")).getJSONObject(0).toJSONString());
        dashboardDatasetAuth.setUpdateTime(new Timestamp(System.currentTimeMillis()));
        datasetAuthDao.update(dashboardDatasetAuth);
        return new ServiceStatus(ServiceStatus.Status.Success, "保存成功");
    }

    /**
     * 删除配置
     *
     * @param id 配置id
     * @return 删除结果
     */
    public ServiceStatus delete(Long id) {
        datasetAuthDao.delete(id);
        return new ServiceStatus(ServiceStatus.Status.Success, "删除成功");
    }
}
