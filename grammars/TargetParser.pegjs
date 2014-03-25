start =
    expression: expression
    { 
        var f= eval( "(function( ctx )  {\n return ctx.$chkSeries(" + expression + ", true).then(function(metric){return metric.seriesList;});\n})" );
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
    { return "ctx.$("+ signs + digits.join("") +")" }

boolean = "true" / "false"
digit= [0-9]

spaceatom = ws* atom:atom
    { return atom; }

spaceFunctionName = ws* functionName:functionName
    { return functionName; }

functionName
    = "summarize" / "sumSeries" / "sum" / "averageSeries" / "avg" / "transformNull" / "scale" / "aliasByNode" / "asPercent" / "alias" / "bestFit" / "sinFunction" / "sin" / "constantLine" / "offset" / "removeAboveValue" / "removeBelowValue" / "keepLastValue" / "integral" / "derivative" / "diffSeries" / "movingAverage" / "limit"

spaceexpression  = ws* expression:expression
    { return expression; }

spacecomma= ws* comma
    { return ","; }

ws =
 [ \t]

comma = ","

metric = first: firstmetricatom rest: metricatom*
    {
      var metricLiteral= {o:"", r:""};
      rest.unshift(first);
      var metricCompiler= function(literal, stk) {
        while( stk.length > 0 ) {
           var o= stk.shift();
          if( typeof o == "string" ) {
             literal.o += o;
             literal.r += o;
          } else {
             literal.o += o.o;
             literal.r += o.r;
          }
        }
        return literal;
      }
      metricLiteral= metricCompiler( {o:"",r:""}, rest );
      metricLiteral.r= "^" + metricLiteral.r +"$";
      return 'ctx.$m(' + JSON.stringify(metricLiteral) +')';
    }

metricatom = backSlash/ dot/ wildcard/ range/ alt/ chars
firstmetricatom = backSlash/ dot/ wildcard/ range/ alt/ charsNoNumbers

chars = chars:[%a-zA-Z0-9_/-]+
    {return chars.join(""); }

charsNoNumbers = chars:[a-zA-Z%]+
    {return chars.join(""); }

dot = "." { return {o:".",r:"\\."};}

backSlash= "\\" { return {o:"\\",r:"\\\\"};}

wildcard = "*" { return {o:"*", r:".+"}; }

range= 
  "[" end:digits "]"
    {
      var qNDRange= "(?:";
      for(var i=0;i<=end;i++) {
        qNDRange += i;
        if( i!= end) qNDRange += "|";
      }
      qNDRange+= ")";
      return { o:"[" + end + "]", r:qNDRange};
    } /
  "[" start:digits "-" end:digits "]"
    {
      var qNDRange= "(?:";
      for(var i=start;i<=end;i++) {
        qNDRange += i;
        if( i!= end) qNDRange += "|";
      }
      qNDRange+= ")";
      return {o:"[" + start + "-" + end +"]", r:qNDRange };
    }

digits = digits:[0-9]+ { return parseInt(digits.join("")); }

alt= "{" first: altPossibility rest: commaAltPossibility* "}" 
  { 
    var r= ["(?:"];
    var o= ["{"] ;

    rest.unshift(first);
    for(var i=0;i<rest.length;i++) {
      for(var k=0;k< rest[i].length;k++ ) {
         r.push( "(?:" );
         r.push( (typeof rest[i][k] == 'string' ? rest[i][k] : rest[i][k].r) );
         r.push( ")" );
         o.push(  (typeof rest[i][k] == 'string' ? rest[i][k] : rest[i][k].o) );
      }
     if(i < rest.length-1)  {
       r.push( "|");
       o.push( ",");
     }
    }
     o[o.length]= "}";
     r[r.length]= ")";
     return { "o": o.join(""), "r":r.join("")};
  }

altPossibility=  ( backSlash/ dot/ wildcard / range / chars)+


commaAltPossibility= comma string:altPossibility{ return string; }
