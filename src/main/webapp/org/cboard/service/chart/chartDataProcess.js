/**
 * Created by Fine on 2017/2/11.
 */
'user strict';
var chartDataProcess = function(chartConfig,casted_keys, casted_values, aggregate_data,newValuesConfig) {
    var keysList = casted_keys,
        keyArr = [],
        emptyList = [],
        keyLength = chartConfig.keys.length,
        rowHeaderLength = keysList[0] ? keysList[0].length : 0;
    Array.matrix = function (numrows, numcols, initial) {
        var arr = [];
        for (var a = 0; a < numrows; ++a) {
            var columns = [];
            for (var s = 0; s < numcols; ++s) {
                columns[s] = initial;
            }
            arr[a] = columns;
        }
        return arr;
    };
    var table_data = Array.matrix(keysList.length, rowHeaderLength, 0);
    for (var h = 0; h < rowHeaderLength; h++) {
        for (var k = 0; k < keysList.length; k++) {
            table_data[k][h] = {
                property: 'column_key',
                data: keysList[k][h]
            };
        }
    }

    /******************************
     * liaoxinxing
     * 2019-08-05
     * 交叉表扩展占比、环比、同比
     *******************************/
    var rowRatios = [];
    var lineRatios = [];
    var allRatios = [];
    var yearOnYearRatios = [];
    var quarterOnQuarterRatios = [];
    if (chartConfig.chart_type === 'table') {
        for (var colIndex = 0; colIndex < chartConfig.values[0].cols.length; colIndex++) {
            var valueType = chartConfig.values[0].cols[colIndex].valueType;
            if (valueType && valueType.type !== 'originValue') {
                switch (valueType.type) {
                    case 'rowRatio':
                        var rowRatio = {
                            index: colIndex,
                            totalValues: []
                        };
                        for (var totalKeyIndex = 0; totalKeyIndex < casted_keys.length; totalKeyIndex++) {
                            var totalValue = 0;
                            for (var totalDataIndex = 0; totalDataIndex < aggregate_data.length; totalDataIndex++) {
                                if (totalDataIndex % chartConfig.values[0].cols.length === colIndex) {
                                    var totalRaw = aggregate_data[totalDataIndex][totalKeyIndex];
                                    if (!_.isUndefined(totalRaw)) {
                                        totalValue += numbro(totalRaw).value();
                                    }
                                }
                            }
                            rowRatio.totalValues.push(totalValue);
                        }
                        rowRatios.push(rowRatio);
                        break;
                    case 'lineRatio':
                        var lineRatio = {
                            index: colIndex,
                            totalValues: []
                        };
                        for (var totalLineDataIndex = 0; totalLineDataIndex < aggregate_data.length; totalLineDataIndex++) {
                            if (totalLineDataIndex % chartConfig.values[0].cols.length === colIndex) {
                                lineRatio.totalValues.push(_.reduce(_.map(aggregate_data[totalLineDataIndex], function (data) {
                                    if (_.isUndefined(data)) {
                                        return 0;
                                    }
                                    return numbro(data).value();
                                }), function (memo, num) {
                                    return memo + num;
                                }, 0));
                            }
                        }
                        lineRatios.push(lineRatio);
                        break;
                    case 'allRatio':
                        var allRatio = {
                            index: colIndex,
                            totalValues: 0
                        };
                        for (var totalAllDataIndex = 0; totalAllDataIndex < aggregate_data.length; totalAllDataIndex++) {
                            if (totalAllDataIndex % chartConfig.values[0].cols.length === colIndex) {
                                allRatio.totalValues += _.reduce(_.map(aggregate_data[totalAllDataIndex], function (data) {
                                    if (_.isUndefined(data)) {
                                        return 0;
                                    }
                                    return numbro(data).value();
                                }), function (memo, num) {
                                    return memo + num;
                                }, 0);
                            }
                        }
                        allRatios.push(allRatio);
                        break;
                    case 'yearOnYear':
                        var yearOnYearRatio = {
                            index: colIndex,
                            yearIndex: -1,
                            yearFormat: valueType.date_format,
                            ignoreColumns: [],
                            showType: valueType.show_type
                        };
                        for (var keyIndex = 0; keyIndex < chartConfig.keys.length; keyIndex++) {
                            if (chartConfig.keys[keyIndex].col === valueType.date_column) {
                                yearOnYearRatio.yearIndex = keyIndex;
                            } else if (valueType.ignore_columns && valueType.ignore_columns.length > 0 && _.indexOf(valueType.ignore_columns, chartConfig.keys[keyIndex].col) > -1) {
                                yearOnYearRatio.ignoreColumns.push(keyIndex);
                            }
                        }
                        yearOnYearRatios.push(yearOnYearRatio);
                        break;
                    case 'quarterOnQuarter':
                        quarterOnQuarterRatios.push({
                            index: colIndex,
                            laggingNumber: valueType.lagging_number,
                            showType: valueType.show_type
                        });
                        break;
                }
            }
        }
    }

    var getRatio = function (origin, total) {
        if (total === 0) {
            return null;
        }
        return [numbro(origin / total).format('0.2f%'), numbro(origin / total).value()];
    };

    var getYear = function (year, format) {
        var yearStartIndex = format.indexOf('YYYY');
        if (yearStartIndex === -1 || year.length < yearStartIndex + 4) {
            return null;
        }
        year = numbro(year.substr(yearStartIndex, 4)).value();
        if (!_.isNumber(year) || _.isNaN(year)) {
            return null;
        }
        return year;
    };

    var getCompareResult = function (original, compareData, type, format) {
        var result = null;
        var difference = numbro(original).value() - numbro(compareData).value();
        var rate = difference / numbro(compareData).value();
        switch (type) {
            case 'value':
                result = [format ? numbro(compareData).format(format) : compareData, compareData, rate];
                break;
            case 'difference':
                result = [format ? numbro(difference).format(format) : difference, difference, rate];
                break;
            case 'change_rate':
                result = [numbro(rate).format(format ? format : "0.2f%"), rate, rate];
                break;
        }
        return result;
    };

    var getData = function (raw, configIndex, formatter, rowIndex, lineIndex) {
        var data = {
            property: 'data'
        };
        if (!_.isUndefined(raw)) {
            data.raw = raw;
            var valueType = chartConfig.values[0].cols[configIndex].valueType;
            if (chartConfig.chart_type === 'table' && valueType && valueType.type !== 'originValue') {
                switch (valueType.type) {
                    case 'rowRatio':
                        var total = _.find(rowRatios, function (ratio) {
                            return ratio.index === configIndex;
                        }).totalValues[rowIndex];
                        var rowRatioData = getRatio(numbro(raw), total);
                        if (rowRatioData) {
                            data.data = rowRatioData[0];
                            data.raw = rowRatioData[1];
                            data.bgClass = 'background-color:rgba(0, 255, 0, ' + data.raw + ')';
                        } else {
                            data.data = '';
                        }
                        break;
                    case 'lineRatio':
                        var lineTotalIndex = Math.floor(lineIndex / chartConfig.values[0].cols.length);
                        var lineTotal = _.find(lineRatios, function (lineRatio) {
                            return lineRatio.index === configIndex;
                        }).totalValues[lineTotalIndex];
                        var lineRatioData = getRatio(numbro(raw), lineTotal);
                        if (lineRatioData) {
                            data.data = lineRatioData[0];
                            data.raw = lineRatioData[1];
                            data.bgClass = 'background-color:rgba(0, 255, 0, ' + data.raw + ')';
                        } else {
                            data.data = '';
                        }
                        break;
                    case 'allRatio':
                        var allTotal = _.find(allRatios, function (ratio) {
                            return ratio.index === configIndex;
                        }).totalValues;
                        var allRatioData = getRatio(numbro(raw), allTotal);
                        if (allRatioData) {
                            data.data = allRatioData[0];
                            data.raw = allRatioData[1];
                            data.bgClass = 'background-color:rgba(0, 255, 0, ' + data.raw + ')';
                        } else {
                            data.data = '';
                        }
                        break;
                    case 'yearOnYear':
                        var yearOnYearKey = _.find(yearOnYearRatios, function (ratio) {
                            return ratio.index === configIndex;
                        });
                        if (yearOnYearKey.yearIndex === -1) {
                            data.data = ''
                        } else {
                            var keyData = casted_keys[rowIndex];
                            var keyYear = getYear(keyData[yearOnYearKey.yearIndex], yearOnYearKey.yearFormat);
                            if (!keyYear) {
                                data.data = '';
                            } else {
                                var compareRowIndex = -1;
                                for (var dataRowIndex = 0; dataRowIndex < casted_keys.length; dataRowIndex++) {
                                    if (dataRowIndex !== rowIndex) {
                                        var dataArray = casted_keys[dataRowIndex];
                                        var find = true;
                                        for (var dataIndex = 0; dataIndex < dataArray.length; dataIndex++) {
                                            if (dataIndex === yearOnYearKey.yearIndex) {
                                                var year = getYear(dataArray[yearOnYearKey.yearIndex], yearOnYearKey.yearFormat);
                                                find = find && year && year === keyYear - 1;
                                            }
                                            if (!find) {
                                                break;
                                            }
                                            if (dataIndex !== yearOnYearKey.yearIndex &&
                                                (!yearOnYearKey.ignoreColumns || yearOnYearKey.ignoreColumns.length === 0 || _.indexOf(yearOnYearKey.ignoreColumns, dataIndex) === -1)) {
                                                find = keyData[dataIndex] === dataArray[dataIndex];
                                            }
                                            if (!find) {
                                                break;
                                            }
                                        }
                                        if (find) {
                                            compareRowIndex = dataRowIndex;
                                            break;
                                        }
                                    }
                                }
                                if (compareRowIndex > -1) {
                                    var compareData = getCompareResult(raw, aggregate_data[lineIndex][compareRowIndex], yearOnYearKey.showType, formatter);
                                    if (compareData) {
                                        data.data = compareData[0];
                                        data.raw = compareData[1];
                                        if (compareData[2] > 0) {
                                            data.bgClass = 'background-color:rgba(0, 255, 0, ' + compareData[2] + ')';
                                        } else if (compareData[2] < 0) {
                                            data.bgClass = 'background-color:rgba(255, 0, 0, ' + Math.abs(compareData[2]) + ')';
                                        }
                                    } else {
                                        data.data = '';
                                    }
                                } else {
                                    data.data = '';
                                }
                            }
                        }
                        break;
                    case 'quarterOnQuarter':
                        var quarterOnQuarterKey = _.find(quarterOnQuarterRatios, function (ratio) {
                            return ratio.index === configIndex;
                        });
                        var quarterDataIndex = rowIndex - quarterOnQuarterKey.laggingNumber;
                        if (quarterDataIndex < 0) {
                            data.data = ''
                        } else {
                            var quarterCompareData = getCompareResult(raw, aggregate_data[lineIndex][quarterDataIndex], quarterOnQuarterKey.showType, formatter);
                            if (quarterCompareData) {
                                data.data = quarterCompareData[0];
                                data.raw = quarterCompareData[1];
                                if (quarterCompareData[2] > 0) {
                                    data.bgClass = 'background-color:rgba(0, 255, 0, ' + quarterCompareData[2] + ')';
                                } else if (quarterCompareData[2] < 0) {
                                    data.bgClass = 'background-color:rgba(255, 0, 0, ' + Math.abs(quarterCompareData[2]) + ')';
                                }
                            } else {
                                data.data = '';
                            }
                        }
                        break;
                }
            } else {
                data.data = formatter ? numbro(raw).format(formatter) : raw;
            }
        } else {
            data.data = ''
        }
        return data;
    };

    for (var i = 0; i < casted_values.length; i++) {
        var joined_values = casted_values[i].join('-');
        var formatter = newValuesConfig[joined_values].formatter;
        var index = i % chartConfig.values[0].cols.length;
        for (var j = 0; j < casted_keys.length; j++) {
            var raw = aggregate_data[i][j];
            table_data[j][i + keyLength] = getData(raw, index, formatter, j, i);
        }
    }

    var column_header = Array.matrix(chartConfig.groups.length + 1, casted_values.length, 0);
    for (var n = 0; n < casted_values.length; n++) {
        for (var m = 0; m < casted_values[n].length; m++) {
            column_header[m][n] = {
                property: 'header_key',
                data: casted_values[n][m]
            };
        }
    }
    for (var y = 0; y < keyLength; y++) {
        keyArr.push({
            property: 'header_key',
            column_header_header: true,
            data: chartConfig.keys[y].alias ? chartConfig.keys[y].alias : chartConfig.keys[y].col
        });
        emptyList.push({
            property: 'header_empty',
            data: null
        });
    }
    for (var j = 0; j < column_header.length; j++) {
        j == column_header.length - 1 ?
            column_header[j] = keyArr. concat(column_header[j]) :
            column_header[j] = emptyList.concat(column_header[j]);
    }
    var chartData = {
        chartConfig: chartConfig,
        data: column_header.concat(table_data)
    };
    table_data = null;
    column_header = null;
    return chartData;
};
