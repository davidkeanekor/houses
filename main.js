readme(document.getElementById("readme"));

var chartElem = d3.select("body #chart");

var yAxisLabel = "Index (2015 average = 100)";
var yAxis2Label = ["YoY %", "QoQ %", "MoM %"];

var margin = {
	top : 20,
	right : 80,
	bottom : 50,
	left : 40
},
width = 960 - margin.left - margin.right,
height2 = 150,
height = 480 - margin.top - margin.bottom - height2;

// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);
var y2 = d3.scale.linear().range([height2, 0]);
var y2domains;

var bisectDate = d3.bisector(function(d) { return d.date; }).left

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(6).tickFormat(d3.time.format("%b"))
	.tickSize(-(height+height2), 0, 0);

var xAxis2 = d3.svg.axis().scale(x)
.orient("bottom").ticks(d3.time.years, 1)
.tickFormat(d3.time.format("%Y")).tickSize(5,0);


var yAxis = d3.svg.axis().scale(y)
.orient("left").ticks(5)
.tickSize(-width, 0, 0);

var yAxis2 = d3.svg.axis().scale(y2)
.orient("left").ticks(5)
.tickSize(-width, 0, 0);

var data, chgData, tableNames, filterData, filterData2;
mungeData();

var svg, focus;
var mouseDateFormat = d3.time.format("%b-%Y");
var mouseNumFormat = d3.format(".1f");

var color = d3.scale.category20();
colorDomain = []; tableNames.forEach(function (d){
	colorDomain.push(d);
	colorDomain.push(d+"c");
});
color.domain(colorDomain);

// Define the lines
var valueline = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d[selectedStat]); });

var valueline2 = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y2(d[selectedStat]) + height; });

var selectedStatNum = parseParamWithDefault(
		's',['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10',
		     'T11','T12','T13','T14','T15','T16','T17','T18','T19','T20']);
var selectedStat = tableNames[selectedStatNum];
var selectedChg = parseParamWithDefault('c',['yoy','qoq','mom']);
document.selS.selS[selectedStatNum].checked = true;
document.selC.selC[selectedChg].checked = true;
doSvg();

/**
 * Selection changed - remove and redo graph
 */
function selStat(s) {
	selectedStat = tableNames[s];
	d3.select("svg").remove();
	doSvg();
}

function selChange(s) {
	selectedChg = s;
	d3.select("svg").remove();
	doSvg();
}

function blankFilter(d) {
	var b = false;
	return d.filter(function (di) {
		if (di[selectedStat] != 0) {
			b = true;
		}
		return b;
	});

}

function doSvg() {

    y2.domain(y2domains[selectedChg]);

    // Adds the svg canvas
	svg = chartElem.append("svg")
	        .attr("width", width + margin.left + margin.right)
	        .attr("height", height + height2 + margin.top + margin.bottom)
	    .append("g")
	        .attr("transform", 
	              "translate(" + margin.left + "," + margin.top + ")");

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height + height2) + ")")
        .call(xAxis)
		.selectAll("text")  
		.style("text-anchor", "start")
		.attr("dx", "0em")
		.attr("dy", "1.15em")
		.attr("transform", "rotate(-0)" );

	svg.append("g")
		.attr("class", "x axis2")
		.attr("transform", "translate(0," + (height+height2+25) + ")")
		.call(xAxis2)
		.selectAll("text")
		.style("text-anchor", "start");
    
    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis).append("text")
		.attr("transform", "rotate(-90)").attr("y", 6).attr("dy",
		".71em").style("text-anchor", "end").text(yAxisLabel);

    // Add separator line
    var sepLines = svg.append("g")
    	.attr("transform", "translate(0," + (height) + ")");
    
	sepLines.append("line").attr("x1",0).attr("x2",width).attr("class","ysep");
	sepLines.append("line").attr("x1",0).attr("x2",width).attr("class","ysep2")
    	.attr("transform", "translate(0," + (y2(0)) + ")");

    // Add the Y2 Axis
    svg.append("g")
        .attr("class", "y axis2")
		.attr("transform", "translate(0," + (height) + ")")
        .call(yAxis2).append("text")
		.attr("transform", "rotate(-90)").attr("y", 6).attr("dy",
		".71em").style("text-anchor", "end").text(yAxis2Label[selectedChg]);

    filterData = blankFilter(data);
	var series = svg.selectAll(".series").data([filterData]).enter()
		.append("g").attr("class", "series");
	
    series.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return valueline((d)); })
        .style({stroke: function(d) {return color(selectedStat);}});

    filterData2 = blankFilter(chgData[selectedChg]);
	var series = svg.selectAll(".cseries").data([filterData2]).enter()
		.append("g").attr("class", "cseries");

	series.append("path")
	    .attr("class", "line")
	    .attr("d", function(d) { return valueline2(d); })
	    .style({stroke: function(d) {return color(selectedStat + "c");}});

    // Add focus circle and overlays
    focus = svg.append("g")
	    .attr("class", "focus")
	    .style("display", "none");

	focus.append("circle")
	    .attr("r", 4.5);
	
	focus.append("text")
	    .attr("x", 9)
	    .attr("dy", ".35em");
    
    svg.append("rect")
	    .attr("class", "overlay")
	    .attr("width", width)
	    .attr("height", height)
	    .on("mouseover", function() { focus.style("display", null); })
	    .on("mouseout", function() { focus.style("display", "none"); })
	    .on("mousemove", mousemove);

    svg.append("rect")
	    .attr("class", "overlay")
	    .attr("width", width)
	    .attr("height", height2)
		.attr("transform", "translate(0," + (height) + ")")
	    .on("mouseover", function() { focus.style("display", null); })
	    .on("mouseout", function() { focus.style("display", "none"); })
	    .on("mousemove", mousemove2);

}


function mousemove() {
	mouse(filterData, y, 0);
  }

function mousemove2() {
	mouse(filterData2, y2, height);
  }

function mouse(dataset, scale, yoffset) {
    var x0 = x.invert(d3.mouse(svg[0][0])[0]),
        i = bisectDate(dataset, x0, 1),
        d0 = dataset[i - 1],
        d1 = dataset[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + x(d.date) + "," + (scale(d[selectedStat])+yoffset) + ")");
    var str = mouseNumFormat(d[selectedStat]) + "  (" + mouseDateFormat(d.date) + ")";
    focus.select("text").text(str);
  }


function mungeData() {

	var sheet = extractGistData(gistData["CSO_RPPI.csv"].content);
	
	data = sheet.data;
	chgData = [[],[],[]];
	chgIntervals = [12, 3, 1];
	tableNames = sheet.colNames.filter(function (d) {return d.startsWith("T")});
	var minMaxDate = [], minMaxIndex = [], minMaxChg = [[],[],[]];

	data.forEach(function (d,i) {
		d.date = new Date(+d.Year, +d.Month - 1, 01);
		minMaxDate.push(d.date);
		chgIntervals.forEach(function (ci, n) {chgData[n].push({date: d.date})});
		tableNames.forEach(function (t) {
			d[t] = +d[t];
			minMaxIndex.push(d[t]);
			chgIntervals.forEach(function (ci, n) {
				var prev = (i < ci)? 0 : data[i - ci][t];
				chgData[n][i][t] = (prev == 0)? 0 : d[t] / prev * 100 - 100;
				minMaxChg[n].push(chgData[n][i][t]);
			});
		});
	});
	chgIntervals.forEach(function (ci, i) {
		chgData[i] = chgData[i].filter(function (cd, j) {
			return (ci - 1) < j;
		});
	});
	   // Scale the range of the data
    x.domain(d3.extent(minMaxDate));
    y.domain(d3.extent(minMaxIndex));
    y2domains = [];
	chgIntervals.forEach(function (ci, i) {
	    y2domains[i] = (d3.extent(minMaxChg[i]));
	});
	
}
