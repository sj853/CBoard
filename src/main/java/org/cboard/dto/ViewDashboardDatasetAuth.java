package org.cboard.dto;

import com.alibaba.fastjson.JSONObject;
import com.google.common.base.Function;
import org.cboard.pojo.DashboardDatasetAuth;

import javax.annotation.Nullable;
import java.util.List;
import java.util.Map;

/**
 * 数据集权限数据
 *
 * @author liaoxx
 */
public class ViewDashboardDatasetAuth {
    /**
     * id
     */
    private Long id;

    /**
     * 数据集id
     */
    private Long datasetId;

    /**
     * 角色id
     */
    private String roleId;

    /**
     * 角色名称
     */
    private String roleName;

    /**
     * 配置
     */
    private Map<String, Object> config;

    /**
     * 创建时间
     */
    private String createTime;

    /**
     * 更新时间
     */
    private String updateTime;

    /**
     * 用户id
     */
    private String userId;

    public static final Function TO = new Function<DashboardDatasetAuth, ViewDashboardDatasetAuth>() {
        @Nullable
        @Override
        public ViewDashboardDatasetAuth apply(@Nullable DashboardDatasetAuth input) {
            return new ViewDashboardDatasetAuth(input);
        }
    };

    public ViewDashboardDatasetAuth(DashboardDatasetAuth datasetAuth) {
        this.id = datasetAuth.getId();
        this.datasetId = datasetAuth.getDatasetId();
        this.roleId = datasetAuth.getRoleId();
        this.roleName = datasetAuth.getRoleName();
        this.config = JSONObject.parseObject(datasetAuth.getConfig());
        this.createTime = datasetAuth.getCreateTime().toString();
        this.updateTime = datasetAuth.getUpdateTime().toString();
        this.userId = datasetAuth.getUserId();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDatasetId() {
        return datasetId;
    }

    public void setDatasetId(Long datasetId) {
        this.datasetId = datasetId;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public Map<String, Object> getConfig() {
        return config;
    }

    public void setConfig(Map<String, Object> config) {
        this.config = config;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
    }

    public String getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(String updateTime) {
        this.updateTime = updateTime;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
