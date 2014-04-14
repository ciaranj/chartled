start =
    expression: expression
    { 
        var f= eval( "(function( ctx )  {\n return ctx.$chkSeries(" + expression + ", true, 0, 0).then(function(metric){return metric.seriesList;});\n})" );
        //console.log( f.toString() );
        return f;
    }

expression =
    funct:spaceFunctionName "(" first: expression rest:(argument)* ")"
      {
         rest.unshift ( first ); 
       return "ctx." + funct +"(" + rest.join("") +")"
      } /
    spaceatom:spaceatom
      {
        return spaceatom  
      }

argument = 
  (spacecomma spaceexpression:spaceexpression)
  { return "," + spaceexpression; }

string
    = '"' chars:[^"]+ '"'
    { return 'ctx.$("' + chars.join("") +'")';  }


atom =
    string /
    boolean /
    metric /
    number /

sign = [+-]

number =
    signs:sign? digits:digit+ "." decimals: digit+
    { return digits.join("")+"."+ decimals.join(""); } /
    signs:sign? digits: digit+ 
    { return "ctx.$("+ (signs?signs:"") + digits.join("") +")" }

boolean = "true" / "false"
digit= [0-9]

spaceatom = ws* atom:atom
    { return atom; }

spaceFunctionName = ws* functionName:functionName
    { return functionName; }

functionName
    = "summarize" / "sumSeries" / "sum" / "averageSeries" / "avg" / "transformNull" / "scale" / "aliasByNode" / "asPercent" / "alias" / "bestFit" / "sinFunction" / "sin" / "constantLine" / "offset" / "removeAboveValue" / "removeBelowValue" / "keepLastValue" / "integral" / "derivative" / "diffSeries" / "movingAverage" / "limit" / "timeShift"

spaceexpression  = ws* expression:expression
    { return expression; }

spacecomma= ws* comma
    { return ","; }

ws =
 [ \t]

comma = ","

metric = first: firstmetricatom rest: metricatom*
    {
      rest.unshift(first);
      return 'ctx.$m("' + rest.join("") +'")';
    }

metricatom = backSlash/ dot/ wildcard/ range/ alt/ chars
firstmetricatom = backSlash/ dot/ wildcard/ range/ alt/ charsNoNumbers

chars = chars:[%a-zA-Z0-9_/-]+
    {return chars.join(""); }

charsNoNumbers = chars:[a-zA-Z%]+
    {return chars.join(""); }

dot = "." { return "."; }

backSlash= "\\" { return "\\"; }

wildcard = "*" { return "*"; }

range= 
  "[" end:digits "]"
    {
      return "[" + end + "]";;
    } /
  "[" start:digits "-" end:digits "]"
    {
      return "[" + start + "-" + end +"]";
    }

digits = digits:[0-9]+ { return parseInt(digits.join("")); }

alt= "{" first: altPossibility rest: commaAltPossibility* "}" 
  { 
    var o= ["{"] ;

    rest.unshift(first);
    for(var i=0;i<rest.length;i++) {
      for(var k=0;k< rest[i].length;k++ ) {
         o.push(  (typeof rest[i][k] == 'string' ? rest[i][k] : rest[i][k].o) );
      }
     if(i < rest.length-1)  {
       o.push( ",");
     }
    }
     o[o.length]= "}";
     return o.join("");
  }

altPossibility=  ( backSlash/ dot/ wildcard / range / chars)+


commaAltPossibility= comma string:altPossibility{ return string; }
