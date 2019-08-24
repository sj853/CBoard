package org.cboard.dataprovider.util;

import org.apache.commons.lang.StringUtils;
import org.cboard.dataprovider.config.*;

import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.cboard.dataprovider.DataProvider.NULL_STRING;
import static org.cboard.dataprovider.DataProvider.separateNull;


/**
 * Created by zyong on 2017/9/15.
 */
public class SqlHelper {

    private String tableName;
    private boolean isSubquery;
    private SqlSyntaxHelper sqlSyntaxHelper = new SqlSyntaxHelper();

    public SqlHelper() {
    }

    public SqlHelper(String tableName, boolean isSubquery) {
        this.tableName = tableName;
        this.isSubquery = isSubquery;
    }

    public String assembleFilterSql(AggConfig config) {
        String whereStr = null;
        if (config != null) {
            Stream<DimensionConfig> c = config.getColumns().stream();
            Stream<DimensionConfig> r = config.getRows().stream();
            Stream<ConfigComponent> f = config.getFilters().stream();
            Stream<ConfigComponent> filters = Stream.concat(Stream.concat(c, r), f);
            whereStr = filterSql(filters, "WHERE");
        }
        return whereStr;
    }

    public String assembleFilterSql(Stream<ConfigComponent> filters) {
        return filterSql(filters, "WHERE");
    }

    public String assembleAggDataSql(AggConfig config) throws Exception {
        Stream<DimensionConfig> c = config.getColumns().stream();
        Stream<DimensionConfig> r = config.getRows().stream();
        Stream<ConfigComponent> f = config.getFilters().stream();
        Stream<ConfigComponent> filters = Stream.concat(Stream.concat(c, r), f);
        Stream<DimensionConfig> dimStream = Stream.concat(config.getColumns().stream(), config.getRows().stream());

        List<DimensionConfig> dimensionConfigs = dimStream.collect(Collectors.toList());

        String dimColsStr = assembleDimColumns(dimensionConfigs);
        String aggColsStr = assembleAggValColumns(config.getValues().stream());

        String orderByStr = assembleOrderBy(config.getRows().stream());

        String whereStr = filterSql(filters, "WHERE");
        String groupByStr = StringUtils.isBlank(dimColsStr) ? "" : "GROUP BY " + dimColsStr;

        orderByStr = StringUtils.isBlank(orderByStr) ? "" : "ORDER BY " + orderByStr;

        String dimSortColsStr = assembleSortColumns(dimensionConfigs);

        StringJoiner selectColsStr = new StringJoiner(",");
        if (!StringUtils.isBlank(dimColsStr)) {
            selectColsStr.add(dimColsStr);
        }
        if (!StringUtils.isBlank(aggColsStr)) {
            selectColsStr.add(aggColsStr);
        }
        if (!StringUtils.isBlank(dimSortColsStr)) {
            selectColsStr.add(dimSortColsStr);
        }

        String fsql = null;
        if (isSubquery) {
            fsql = "\nSELECT %s \n FROM (\n%s\n) cb_view \n %s \n %s \n %s";
        } else {
            fsql = "\nSELECT %s \n FROM %s \n %s \n %s \n %s";
        }
        String exec = String.format(fsql, selectColsStr, tableName, whereStr, groupByStr, orderByStr);
        return exec;
    }

    private String filterSql(Stream<ConfigComponent> filterStream, String prefix) {
        StringJoiner where = new StringJoiner("\nAND ", prefix + " ", "");
        where.setEmptyValue("");
        filterStream.map(e -> separateNull(e))
                .map(e -> configComponentToSql(e))
                .filter(e -> e != null)
                .forEach(where::add);
        return where.toString();
    }

    private String configComponentToSql(ConfigComponent cc) {
        if (cc instanceof DimensionConfig) {
            return filter2SqlCondtion.apply((DimensionConfig) cc);
        } else if (cc instanceof CompositeConfig) {
            CompositeConfig compositeConfig = (CompositeConfig) cc;
            String sql = compositeConfig.getConfigComponents().stream()
                    .map(e -> separateNull(e))
                    .map(e -> configComponentToSql(e))
                    .collect(Collectors.joining(" " + compositeConfig.getType() + " "));
            return "(" + sql + ")";
        }
        return null;
    }

    /**
     * Parser a single filter configuration to sql syntax
     */
    private Function<DimensionConfig, String> filter2SqlCondtion = (config) -> {
        if (config.getValues().size() == 0) {
            return null;
        }

        String fieldName = sqlSyntaxHelper.getColumnNameInFilter(config);
        String v0 = sqlSyntaxHelper.getDimMemberStr(config, 0);
        String v1 = null;
        if (config.getValues().size() == 2) {
            v1 = sqlSyntaxHelper.getDimMemberStr(config, 1);
        }

        if (NULL_STRING.equals(config.getValues().get(0))) {
            switch (config.getFilterType()) {
                case "=":
                case "≠":
                    return config.getColumnName() + ("=".equals(config.getFilterType()) ? " IS NULL" : " IS NOT NULL");
            }
        }

        switch (config.getFilterType()) {
            case "=":
            case "eq":
                return fieldName + " IN (" + valueList(config) + ")";
            case "≠":
            case "ne":
                return fieldName + " NOT IN (" + valueList(config) + ")";
            case "like %a%":
                return fieldName + " like '%" + config.getValues().get(0) + "%'";
            case "like %a":
                return fieldName + " like '%" + config.getValues().get(0) + "'";
            case "like a%":
                return fieldName + " like '" + config.getValues().get(0) + "%'";
            case ">":
                return rangeQuery(fieldName, v0, null);
            case "<":
                return rangeQuery(fieldName, null, v0);
            case "≥":
                return rangeQuery(fieldName, v0, null, true, true);
            case "≤":
                return rangeQuery(fieldName, null, v0, true, true);
            case "(a,b]":
                return rangeQuery(fieldName, v0, v1, false, true);
            case "[a,b)":
                return rangeQuery(fieldName, v0, v1, true, false);
            case "(a,b)":
                return rangeQuery(fieldName, v0, v1, false, false);
            case "[a,b]":
                return rangeQuery(fieldName, v0, v1, true, true);
        }
        return null;
    };

    private String valueList(DimensionConfig config) {
        String resultList = IntStream.range(0, config.getValues().size())
                .boxed()
                .map(i -> sqlSyntaxHelper.getDimMemberStr(config, i))
                .collect(Collectors
                        .joining(","));
        return resultList;
    }

    private String rangeQuery(String fieldName, Object from, Object to, boolean includeLower, boolean includeUpper) {
        StringBuffer result = new StringBuffer();
        result.append("(");
        final String gt = ">",
                gte = ">=",
                lt = "<",
                lte = "<=";
        if (from != null) {
            String op = includeLower ? gte : gt;
            result.append(fieldName + op + from);
        }
        if (to != null) {
            if (from != null) {
                result.append(" AND ");
            }
            String op = includeUpper ? lte : lt;
            result.append(fieldName + op + to);
        }
        result.append(")");
        return result.toString();
    }

    private String rangeQuery(String fieldName, Object from, Object to) {
        return rangeQuery(fieldName, from, to, false, false);
    }

    public static String surround(String text, String quta) {
        return quta + text + quta;
    }

    private String assembleAggValColumns(Stream<ValueConfig> selectStream) {
        StringJoiner columns = new StringJoiner(", ", "", " ");
        columns.setEmptyValue("");
        selectStream.map(vc -> sqlSyntaxHelper.getAggStr(vc)).filter(e -> e != null).forEach(columns::add);
        return columns.toString();
    }

    private String assembleDimColumns(List<DimensionConfig> dimensionConfigs) {
        StringJoiner columns = new StringJoiner(", ", "", " ");
        columns.setEmptyValue("");
        dimensionConfigs.stream().map(g -> sqlSyntaxHelper.getProjectStr(g)).distinct().filter(Objects::nonNull).forEach(columns::add);

        return columns.toString();
    }


    /**
     * 组装排序字段
     *
     * @param dimensionConfigs
     * @return
     */
    private String assembleSortColumns(List<DimensionConfig> dimensionConfigs) {
        StringJoiner columns = new StringJoiner(", ", "", " ");
        columns.setEmptyValue("");
        dimensionConfigs.stream().filter(c -> c != null && c.getSort() != null).forEach(col -> {
            if ("custom".equalsIgnoreCase(col.getSort()) && Optional.ofNullable(col.getSortValues()).orElse(Collections.emptyList()).size() > 0) {
                StringBuilder sb = new StringBuilder();
                sb.append(String.format(" CASE %s", col.getColumnName()));

                AtomicReference<Integer> i = new AtomicReference<>(col.getSortValues().size());
                col.getSortValues().forEach(c -> sb.append(String.format(" WHEN '%s' THEN %d ", c, i.getAndSet(i.get() - 1))));

                sb.append(String.format(" ELSE 0 END as %s_sort", col.getColumnName()));

                columns.add(sb.toString());
            }
        });
        return columns.toString();
    }

    /**
     * 组装orderby 语句
     *
     * @param rowStream
     * @return
     */
    private String assembleOrderBy(Stream<DimensionConfig> rowStream) {
        StringJoiner columns = new StringJoiner(", ", "", " ");
        columns.setEmptyValue("");
        rowStream.distinct().filter(c -> c != null && c.getSort() != null).forEach(col -> {
            if (!"custom".equalsIgnoreCase(col.getSort())) {
                columns.add(String.format("%s %s", col.getColumnName(), col.getSort()));
            } else {
//                if ("desc".equalsIgnoreCase(col.getOtherSort())) {
                columns.add(String.format(" %s_sort desc , %s %s", col.getColumnName(), col.getColumnName(), col.getOtherSort()));
//                } else {
//
//                }
            }
        });
        return columns.toString();
    }

    public SqlHelper setSqlSyntaxHelper(SqlSyntaxHelper sqlSyntaxHelper) {
        this.sqlSyntaxHelper = sqlSyntaxHelper;
        return this;
    }

    public SqlSyntaxHelper getSqlSyntaxHelper() {
        return this.sqlSyntaxHelper;
    }
}
