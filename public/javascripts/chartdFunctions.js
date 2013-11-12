try {
    if( chartd == undefined) chartd= {};
} catch (e ) {
    chartd= {};
} 
chartd.functions = [
    { name: 'alias', example: 'alias(metric*,\'Aliased Metric Name\')', description: "Aliases a series (or set of series)"},
    { name: 'aliasByNode', example: 'aliasByNode(metric.*,1)', description: "Aliases a series (or set of series) by taking the specific node segment"},
    { name: 'asPercent', example: 'asPercent(metric*, metric/constant/nothing)', description: "Return the series as a percentage of either the sum of those series, or of a constant, or of another series"},
    { name: 'averageSeries', example: 'averageSeries(metric*)', description: "Averages a series (mean)"},
    { name: 'avg', example: 'avg(metric*)', description: "Averages a series (mean)" },
    { name: 'bestFit', example: 'bestFit(metric)', description: "Produces a 'Best Fit' line" },
    { name: 'constantLine', example: 'constantLine(value)', description: "Produces a line of constant 'value'" },
    { name: 'offset', example: 'offset(metric*, factor)', description: "Takes a metric or a wildcard metric follwed by a constant that will be applied to each point." },
    { name: 'scale', example: 'scale(metric*, 1.0)', description: "Scales a series by the provided factor"},
    { name: 'sin', example: 'sin("title",amplitude=1)', description: "Generates a sine function based on current time range (10s interval)"},
    { name: 'sumSeries', example: 'sumSeries(metric*)', description: "Sums a series"}
];