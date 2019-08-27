package org.cboard.dao;

import org.cboard.pojo.DashboardDatasetAuth;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 数据集数据访问对象
 *
 * @author liaoxx
 */
@Repository
public interface DatasetAuthDao {

    /**
     * 获取所有数据集权限配置列表
     *
     * @return 数据集权限配置列表
     */
    List<DashboardDatasetAuth> getAllDatasetAuthList();

    /**
     * 保存数据集权限配置
     *
     * @param dashboardDatasetAuth 数据集权限配置
     * @return 保存结果
     */
    int save(DashboardDatasetAuth dashboardDatasetAuth);

    /**
     * 更新数据集权限配置
     *
     * @param dashboardDatasetAuth 数据集权限配置
     * @return 更新结果
     */
    int update(DashboardDatasetAuth dashboardDatasetAuth);

    /**
     * 删除数据集权限配置
     *
     * @param id 数据集权限配置id
     * @return 删除结果
     */
    int delete(Long id);

    /**
     * 获取数据集权限
     *
     * @param datasetId 数据集id
     * @param roleId    角色id
     * @param id id
     * @return 数据集权限
     */
    DashboardDatasetAuth getDatasetAuth(Long datasetId, String roleId, Long id);
}
