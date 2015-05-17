var w = 1280,
    h = 800,
    r = 720,
    x = d3.scale.linear().range([0, r]),
    y = d3.scale.linear().range([0, r]),
    node,
    color = d3.scale.category20c(),
    format = d3.format(",d"),
    lastMonthDomain ,
    last6MonthsDomain ,
    lastYearDomain,
    root;

var pack = d3.layout.pack()
    .size([r, r])
    .value(function(d) { return d.size })

var vis = d3.select("div.graph").insert("svg:svg", "h2")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g")
    .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");



// Init tooltip
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color", "white")
    .style("padding", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.75)")
    .style("border-radius", "6px")
    .style("font", "12px sans-serif")
    .text("tooltip");

getDatesMinMax = function(children){
      var min = Infinity;
      var max = 0;
      for (var i = children.length - 1; i >= 0; i--) {
        var date = children[i].date;
        var timestamp = (new Date(date)).getTime();
        if (timestamp > max) {
          max = timestamp;
        }
        if (timestamp < min) {
          min = timestamp
        }

        // console.log(timestamp);
      };

      return [min,max];
};

getSize = function(obj){
  var ts = (new Date(obj.date)).getTime();
  // console.log("TIMESTAMP",ts);
  var now = (new Date()).getTime();

  // if the ts is last month
  if (ts + 1000*60*60*24*30 > now) {
    // console.log("LAST MONTH");
    return ( 100 - ((lastMonthDomain(ts) * 100) | 0) ) + 50;
  } else 
  // last 6 months
  if (ts + 1000*60*60*24*30*6 > now) {
    // console.log("LAST 6 MONTH",obj.date,ts);
    return  ( 100 - ((last6MonthsDomain(ts) * 100) | 0) ) + 50;
  } else {
    // last year
    // console.log("LAST YEAR");
    return ( 100 - ((lastYearDomain(ts) * 100) | 0) ) + 50;
  }
};

var parseFormat = function(data){
  // parse the text file
  var lines = data.split("\n");
  var contacts = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.match(/#.+[0-9]{4}$/)) {
      var dateFound = line.replace("#","");
      // remove time, get date only
      dateFound = dateFound.replace(/[0-9]{1,2}\:[0-9]{1,2}\:[0-9]{1,2} \w{3,4}/,"");
      contacts.push(dateFound);
    }
    if (line.match(/displayID=.+\//)) {
      var dislayName = line.match(/displayID=(.+?)\//)[1];
      console.log(dislayName);
      contacts.push(dislayName);
    }

    
  };
  if (contacts.length%2 !== 0) {
    alert("WRONG FILE FORMAT");
    return;
  }

  var lastMonth = {
     "name": "Last Month",
     "type" : "last_month",
     "children" : []
  }
  var last6Months = {
     "name": "Last 6 Months",
     "type" : "last_6_months",
     "children" : []
  }

  var lastYear =  {
     "name": "Last Year",
     "type" : "last_year",
     "children" : []
  }

  for (var i = 0; i < contacts.length; i = i+2) {
    console.log(contacts[i],contacts[i+1]);

    var contactDate = contacts[i];
    var contactName = contacts[i+1];

    var ts = (new Date(contactDate)).getTime();
    // console.log("TIMESTAMP",ts);
    var now = (new Date()).getTime();
    
    // if the ts is last month
    if (ts + 1000*60*60*24*30 > now) {
      // console.log("LAST MONTH");
      lastMonth.children.push({
        name : contactName,
        date : contactDate
      });
    } else 
    // last 6 months
    if (ts + 1000*60*60*24*30*6 > now) {
      // console.log("LAST 6 MONTH",obj.date,ts);
      last6Months.children.push({
        name : contactName,
        date : contactDate
      });
    } else {
      // last year
      // console.log("LAST YEAR");
      lastYear.children.push({
        name : contactName,
        date : contactDate
      });
    }

  };

  var dat = {
    "name": "Contacts",
    children : [lastMonth,last6Months,lastYear]
  }


  // CALCULATE SIZE for the DIAMETER
  for (var i = dat.children.length - 1; i >= 0; i--) {
    if (dat.children[i].type == 'last_month') {
      var ret = getDatesMinMax(dat.children[i].children);
      lastMonthDomain = d3.scale.linear().domain([ret[0],ret[1]]);
      console.log("MIN MAX",[ret[0],ret[1]]);
    } else 
    if (dat.children[i].type == 'last_6_months') {
      var ret = getDatesMinMax(dat.children[i].children);
      last6MonthsDomain = d3.scale.linear().domain([ret[0],ret[1]]);
      console.log("MIN MAX 6 months",[ret[0],ret[1]]);
    } else
    if (dat.children[i].type == 'last_year') {
      var ret = getDatesMinMax(dat.children[i].children);
      lastYearDomain = d3.scale.linear().domain([ret[0],ret[1]]);
      console.log("MIN MAX",[ret[0],ret[1]]);
    }
  };

  for (var i = dat.children.length - 1; i >= 0; i--) {
    for (var j = dat.children[i].children.length - 1; j >= 0; j--) {
      var ret = dat.children[i].children[j];

      dat.children[i].children[j].size = getSize(ret);
      // console.log(getSize(ret),"SIZE");
    };

  }

  return dat;
}

function handleFileSelect()
{               
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    alert('The File APIs are not fully supported in this browser.');
    return;
  }   

  input = document.getElementById('fileinput');
  if (!input) {
    alert("Um, couldn't find the fileinput element.");
  }
  else if (!input.files) {
    alert("This browser doesn't seem to support the `files` property of file inputs.");
  }
  else if (!input.files[0]) {
    alert("Please select a file before clicking 'Load'");               
  }
  else {
    file = input.files[0];
    fr = new FileReader();
    fr.onload = receivedText;
    //fr.readAsText(file);
    fr.readAsText(file);
  }
}

function receivedText() {           
  // console.log("DATA LOADED",fr.result);

  // remove input
  d3.selectAll(".select-file").remove()

  
  var data = fr.result;
  dat = parseFormat(data);

  node = root = dat;
  

  var nodes = pack.nodes(root);

  vis.selectAll("circle")
      .data(nodes)
      .enter().append("svg:circle")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; })
      .on("click", function(d) { return zoom(node == d ? root : d); })
      .style("fill", function(d) { return color(d.size); })
      .on("mouseover", function(d) {
            if (d.size !==  undefined) {
              tooltip.text(d.name + ": " + d.date);
              tooltip.style("visibility", "visible");
            } 
             
      })
      .on("mousemove", function() {
          return tooltip.style("top", (d3.event.pageY-100)+"px").style("left",(d3.event.pageX-120)+"px");
          
      })
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

       

  vis.selectAll("text")
      .data(nodes)
      .enter().append("svg:text")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("opacity", function(d) { return d.r > 20 ? 1 : 0; })
      .text(function(d) { return d.name; });


  d3.select(window).on("click", function() { zoom(root); });

} 

// d3.text("assets/chat_history.txt", function(data,t) {
// });



function zoom(d, i) {
  var k = r / d.r / 2;
  x.domain([d.x - d.r, d.x + d.r]);
  y.domain([d.y - d.r, d.y + d.r]);

  var t = vis.transition()
      .duration(d3.event.altKey ? 7500 : 750);

  t.selectAll("circle")
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); })
      .attr("r", function(d) { return k * d.r; });

  t.selectAll("text")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .style("opacity", function(d) { return k * d.r > 20 ? 1 : 0; });

  node = d;
  d3.event.stopPropagation();
}