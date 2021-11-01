/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

var nextNodeID = 0;
var selectedNode = undefined;
var root;
var bNodePropShown = true;
var bMessageWindowShown = true;
var bToolTips = true;
var duration = 750;
var initalLoadComplete = false;     // i.e. login success and loaded root.
var bShowObjectParentDownstream = true;


/*************** Node Context Menu - needs better styling or replacing *****************/
var nodeContextmenu = [

    {
        title: 'Toggle Fault Tooltips',
        action: function (elm, d, i) {
            bToolTips = !bToolTips;
            d3.select('input#tooltips').property('checked', bToolTips);
        }
    },
    {
        title: 'Edit Query Filter',
        action: function (elm, d, i) {
            editQueryFilter(d);
        }
    },
    {
        title: 'Filter On This Class',
        action: function (elm, d, i) {
            filterSiblings(d);
        }
    },
    {
        title: 'Change Root MO',
        action: function (elm, d, i) {
            chgRootWin.showRootNodeSelection();
        }
    }
];


// Set the dimensions and margins of the diagram
var margin = { top: 20, right: 50, bottom: 30, left: 50 };
var width = window.innerWidth - margin.left - margin.right;
var height = window.innerHeight - margin.top - margin.bottom;


// Create Windows

// create tool tip div <body><g><div>...</div></g>...
var div = d3.select("body")
    .append("g")
    .attr("id", "ttg")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var zoom = d3.zoom()
    .scaleExtent([-Infinity, Infinity])
    .on("zoom", zoomed);


// Main Graph Window 
var svgContainer = d3.select("body").append("div").attr("id", "dcontainer").classed("svg-container");

// create/append the svg object to the body of the page
var svg = d3.select("body")
    .select("div#dcontainer")
    .append("svg")
    .attr("id", "msvg")
    .call(zoom)
    .on("dblclick.zoom", null)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + height + " " + width)
    .classed("svg-content", true)
    .append("g")
    .attr("id", "svg-g")



// declares a tree layout and assigns the size
var treemap = d3.tree()
    //.size([height, width])
    .nodeSize([5, 5])
    .separation(function (a, b) { return 10; }); // seperation between siblings



// GLOBALS
// need to classify queryfilterdialog
const chgRootWin = new ChangeRoot();
const appMsg = new AppMessages();
const objProp = new ObjectProperties();


function zoomed() {
    d3.select("#msvg").select("g").attr("transform", d3.event.transform);
}


function startup() {
    initalLoadComplete = true;
    getRoot();
    return;
}

