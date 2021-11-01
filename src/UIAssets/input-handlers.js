/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

// Add / remove children 
function clickNode(d) {
    if (d === undefined) { return; }
    showNodeProperties(d);

    // check if this is already selected and if so do nothing or
    // we will overwrite the saved data
    // if we have clicked on a node already selected - EXIT function !!!
    if (selectedNode !== undefined) {
        if (d.id === selectedNode.id) {
            return;
        }
    }

    // for newly selected object
    // save current data (unselected)
    d.appdata.stroke_width = d3.select("circle#" + d.id).style("stroke-width");
    d.appdata.stroke_dasharray = d3.select("circle#" + d.id).style("stroke-dasharray");
    d.appdata.stroke = d3.select("circle#" + d.id).style("stroke");
    d.appdata.r = d3.select("circle#" + d.id).attr("r");
    d.appdata.fill = d3.select("circle#" + d.id).style("fill");
    // set new style (selected)
    d3.select("circle#" + d.id).style("stroke-dasharray", "3 2")
    d3.select("circle#" + d.id).style("stroke", "red")

    // restore previously selected object
    if (selectedNode !== undefined) {
        d3.select("circle#" + selectedNode.id).style("stroke-width", selectedNode.appdata.stroke_width);
        d3.select("circle#" + selectedNode.id).style("stroke-dasharray", selectedNode.appdata.stroke_dasharray);
        d3.select("circle#" + selectedNode.id).style("stroke", selectedNode.appdata.stroke);
    }

    // save new selected node
    selectedNode = d;
    return;
}

// Add / remove children 
function dblclickNode(d) {
    var localDN = d.data.dn;
    var parentDN = getParentDn(localDN);

    // does this clicked node already exist on the path back to root?
    if (isObjectOnTreePath(d, localDN)) {
        appMsg.postMessage(d.data.dn + " already exists on path back to root, cannot show descendants.");
        return;
    }

    // is the parent of this clicked node on the path back to root (parent in the DN path sense)
    var bParentOnPath = isObjectOnTreePath(d, parentDN);

    // collapse/create children
    if (d.children) {
        d._children = d.children;       // save existing data of children to _children before deleting children
        d.children = null;              // delete children of this node - collapses
        update(d);
        resetNodeTextPos();
    }
    else {
        getChildren(d);
        if ((bParentOnPath === false) && (bShowObjectParentDownstream === true)) {
            // get parent node by DN path i.e. /uni/tn-common/BD-myBD; where this node is BD and
            // parent is tn-common.
            getNodeByDn(d, parentDN);   // with called function needs to be made generic
        }
    }

    showNodeProperties(d);
    return;
}

function mouseoverNode(d) {
    if (!bToolTips) { return; }

    var faultCount = parseInt(d.critical) + parseInt(d.major) + parseInt(d.minor) + parseInt(d.warning) + parseInt(d.info);
    // console.log("MouseOver Event - FaultCount = ", faultCount);
    if (faultCount === 0) { return; }

    //console.log("mouseover (d) : ", d);
    // get current transform (scale) from parent <svg> for the <g> element 
    // (all elements contained in <svg>, gets applied to all direct children)
    var rootsvg = d3.select("svg#msvg");
    var tformsvg = d3.zoomTransform(rootsvg.node());
    //console.log("rootsvg Current T-Form Values (x,y,k)", tformsvg);

    var real_x = tformsvg.applyX(d.x); // + 90;// tformsvg.invertX(d.x); // - tformsvg.x;
    var real_y = tformsvg.applyY(d.y); // //tformsvg.invertY(d.y); // - tformsvg.y;
    //console.log("d x y: ", d.cx, d.cy);
    //console.log("real x,y: ",  real_x, real_y);

    var dNode = d3.select("circle#" + d.id);
    var rN = dNode.node().getBoundingClientRect();
    //console.log("BoundRect x,y: ",  rN.left, rN.top);
    // !!!!!! SWAPPED X & Y to make this work !!!!!! ***** 
    var real_y = rN.left;
    var real_x = rN.top;

    // "div" is a really really really bad name... change this.. !!!
    div.html(null);
    var block = div.append("svg")
        .attr("id", "svgfaulttooltip")
        .attr("width", 100)
        .attr("height", 0)
    var y = -10;

    // createDNTip(block, 5, y, '', '', d);
    // div container, tform y, tform x, cclass, cttid, faultname, faultcount
    createFaultCountTip(block, 5, y += 15, 'node critical', 'tooltip-critical', 'Critical', d.critical);
    createFaultCountTip(block, 5, y += 15, 'node major', 'tooltip-major', 'Major', d.major);
    createFaultCountTip(block, 5, y += 15, 'node minor', 'tooltip-minor', 'Minor', d.minor);
    createFaultCountTip(block, 5, y += 15, 'node warning', 'tooltip-warning', 'Warning', d.warning);
    createFaultCountTip(block, 5, y += 15, 'node info', 'tooltip-info', 'Info', d.info);

    d3.select("svg#svgfaulttooltip").attr("height", y += 15);

    div.transition()
        .duration(10)
        .style("opacity", .9)
        .style("left",
            function () {       // needs to check visible screen and place better
                if (real_y - 20 < 0) { return 1 + "px"; };
                return real_y - 20 + "px";
            })
        .style("top", real_x + 20 + "px");

    return;
}

function mouseoutNode(d) {
    div.transition()
        .duration(500)
        .style("opacity", 0);
}

function dragstarted(d) {
    if (d === root) { return; }
    var gContainer = d3.select("circle#" + d.id).select(function () { return this.parentNode; });
    var txstr = gContainer.attr("transform");
    var t = txstr.substring(txstr.indexOf("(") + 1, txstr.indexOf(")")).split(",");
    var tx = t[0];
    //var ty = t[1];

    // create line but keep hidden until the mouse is actually dragged
    var rootsvg_g = d3.select("svg#msvg").select("g#svg-g");
    rootsvg_g.append("line")
        .attr("id", "depthmove")
        .attr("stroke-width", 1)
        .attr("stroke", "rgb(128,128,128)")
        .attr("stroke-dasharray", "5,5")
        .attr("x1", tx)
        .attr("y1", -10000)                             // TODO: lazy
        .attr("x2", tx)
        .attr("y2", 10000)                              // TODO: lazy
        .style("display", "none")
        .attr("mx", d3.mouse(this)[0])
        .attr("my", d3.mouse(this)[1]);

    return;
}

function dragging(d) {
    if (d === root) { return; }
    var dragLine = d3.select("svg#msvg").select("g#svg-g").selectAll("line#depthmove");

    // if we havent moved more than a few pix then dont register as a move/drag
    if ((Math.abs(dragLine.attr("mx") - d3.mouse(this)[0]) < 1) //&&
        //(Math.abs(dragLine.attr("my") - d3.mouse(this)[1]) < 2 ) 
    ) {
        return;
    }

    // Show the line and move with mouse
    var gContainer = d3.select(this).select(function () { return this.parentNode; });
    var txstr = gContainer.attr("transform");
    var t = txstr.substring(txstr.indexOf("(") + 1, txstr.indexOf(")")).split(",");
    var tx = parseInt(t[0]);
    //var ty = parseInt(t[1]);
    var mx = parseInt(d3.mouse(this)[0]);
    var newX = tx + mx;
    // move the 'y' line
    d3.select("svg#msvg").select("g#svg-g").select("line#depthmove")
        .style("display", "inline")
        .attr("x1", newX)
        .attr("x2", newX);
    return;
}

function dragended(d) {
    if (d === root) { return; }

    var dragLine = d3.select("svg#msvg").select("g#svg-g").selectAll("line#depthmove");

    // if we havent moved more than a few pix then dont register as a move/drag
    if ((Math.abs(dragLine.attr("mx") - d3.mouse(this)[0]) < 1) //&&
        //(Math.abs(dragLine.attr("my") - d3.mouse(this)[1]) < 2 ) 
    ) {
        d3.select("svg#msvg").select("g#svg-g").selectAll("line#depthmove").remove();
        return;
    }


    // DEAL WITH THE MOVING OF THE NODES ...
    var mx = parseInt(d3.mouse(this)[0]);
    var level = d.depth;

    if (treeDepthOffsets[d.depth] !== undefined) {
        treeDepthOffsets[parseInt(d.depth)] += mx;
    }
    else {
        treeDepthOffsets[parseInt(d.depth)] = mx;
    }
    update(root);

    d3.select("svg#msvg").select("g#svg-g").selectAll("line#depthmove").remove();
    return;
}

