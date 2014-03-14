try {
    if( chartd == undefined) chartd= {};
} catch (e ) {
    chartd= {};
}
chartd.functions = [
    { name: 'alias', example: 'alias(metric*,"Aliased Metric Name")',
      description: "Aliases a series (or set of series)"},
    { name: 'aliasByNode', example: 'aliasByNode(metric.*,1)',
      description: "Aliases a series (or set of series) by taking the specific node segment"},
    { name: 'asPercent', example: 'asPercent(metric*, metric/constant/nothing)',
      description: "Return the series as a percentage of either the sum of those series, or of a constant, or of another series"},
    { name: 'averageSeries', example: 'averageSeries(metric*)',
      description: "Averages a series (mean)"},
    { name: 'avg', example: 'avg(metric*)',
      description: "Averages a series (mean)" },
    { name: 'bestFit', example: 'bestFit(metric)',
      description: "Produces a 'Best Fit' line" },
    { name: 'constantLine', example: 'constantLine(value)',
      description: "Produces a line of constant 'value'" },
    { name: 'derivative', example: 'derivative(metric*)',
      description: "Calculates the delta between consecutive data points of a running total metric. (Note: doesn't normalise for time, as a true derivative would)" },
    { name: 'diffSeries', example: 'diffSeries(metric*/1.0)',
      description: "Takes metrics, lists of metrics or constant values (in any order) and subtracts parameters 2 through n from parameter 1. One of parameters must be a metric." },
    { name: 'integral', example: 'integral(metric*)',
      description: "Shows the sum over time (like a continuous addition function). Useful for finding totals or trends in metrics that are collected per minute." },
    { name: 'keepLastValue', example: 'keepLastValue(metric*,limit=inf)',
      description: "Takes one metric or a wildcard metric, and optionally a limit to the number of 'None' values to skip over. Continues the line with the last received value when gaps ('None' values) appear in your data, rather than breaking your line." },      
    { name: 'offset', example: 'offset(metric*, factor)',
      description: "Takes a metric or a wildcard metric followed by a constant that will be applied to each point." },
    { name: 'removeAboveValue', example: 'removeAboveValue(metric*, 3)',
      description: "Removes data above the given threshold from the series or list of series provided. Values above this threshold are assigned a value of 'null'"},
    { name: 'removeBelowValue', example: 'removeBelowValue(metric*, 3)',
      description: "Removes data below the given threshold from the series or list of series provided. Values below this threshold are assigned a value of 'null'"},
    { name: 'scale', example: 'scale(metric*, 1.0)',
      description: "Scales a series by the provided factor"},
    { name: 'sin', example: 'sin("title",amplitude=1)',
      description: "Generates a sine function based on current time range (10s interval)"},
    { name: 'summarize', example: 'summarize(metric*, intervalString, func="sum", alignToFrom=False)',
      description: 'Summarize the data into interval buckets of a certain size. Using the provided aggregation function.'},
    { name: 'sumSeries', example: 'sumSeries(metric*)',
      description: "Sums a series"}
];
