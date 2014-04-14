start = first: firstmetricatom rest: metricatom*
    {
      rest.unshift(first);
      return new RegExp("^" + rest.join("") +"$");
    }

metricatom = backSlash/ dot/ wildcard/ range/ alt/ chars
firstmetricatom = backSlash/ dot/ wildcard/ range/ alt/ charsNoNumbers

chars = chars:[%a-zA-Z0-9_/-]+
    {return chars.join(""); }

charsNoNumbers = chars:[a-zA-Z%]+
    {return chars.join(""); }

dot = "." { return "\\."; }

backSlash= "\\" { return "\\\\";}

wildcard = "*" { return ".+"; }

range= 
  "[" end:digits "]"
    {
      var qNDRange= "(?:";
      for(var i=0;i<=end;i++) {
        qNDRange += i;
        if( i!= end) qNDRange += "|";
      }
      qNDRange+= ")";
      return qNDRange;
    } /
  "[" start:digits "-" end:digits "]"
    {
      var qNDRange= "(?:";
      for(var i=start;i<=end;i++) {
        qNDRange += i;
        if( i!= end) qNDRange += "|";
      }
      qNDRange+= ")";
      return qNDRange;
    }

digits = digits:[0-9]+ { return parseInt(digits.join("")); }

alt= "{" first: altPossibility rest: commaAltPossibility* "}" 
  { 
    var r= ["(?:"];

    rest.unshift(first);
    for(var i=0;i<rest.length;i++) {
      for(var k=0;k< rest[i].length;k++ ) {
         r.push( "(?:" );
         r.push( (typeof rest[i][k] == 'string' ? rest[i][k] : rest[i][k].r) );
         r.push( ")" );
      }
      if(i < rest.length-1)  {
         r.push( "|");
      }
    }
     r[r.length]= ")";
     return r.join("");
  }

altPossibility=  ( backSlash/ dot/ wildcard / range / chars)+

commaAltPossibility= comma string:altPossibility{ return string; }

comma = ","
