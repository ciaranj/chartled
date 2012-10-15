try {
    if( chartd == undefined) chartd= {};
} catch (e ) {
    chartd= {};
} 
chartd.functions = [
    { name: 'alias', example: 'alias(metric*,\'Aliased Metric Name\')', description: "Aliases a series (or set of series)"},
    { name: 'asPercent', example: 'asPercent(metric*, metric/constant/nothing)', description: "Return the series as a percentage of either the sum of those series, or of a constant, or of another series"},
    { name: 'averageSeries', example: 'averageSeries(metric*)', description: "Averages a series (mean)"},
    { name: 'avg', example: 'avg(metric*)', description: "Averages a series (mean)" },
    { name: 'scale', example: 'scale(metric*, 1.0)', description: "Scales a series by the provided factor"},
    { name: 'sumSeries', example: 'sumSeries(metric*)', description: "Sums a series"}
];