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
}
