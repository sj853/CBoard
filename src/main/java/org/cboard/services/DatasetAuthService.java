package org.cboard.services;

import com.google.common.collect.Lists;
import org.cboard.dao.DatasetAuthDao;
import org.cboard.dto.ViewDashboardDatasetAuth;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}
