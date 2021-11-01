/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

var treeDepthOffsets = {};

function getOffset(treeDepth) {
    var offset = 0;
    for (var i = 0; i < treeDepth + 1; i++) {
        if (treeDepthOffsets[i] !== undefined) {
            offset += treeDepthOffsets[i];
        }
    }
    return offset;
}

/*
*
*/
function update(source) {
    //console.log("update....", source.dn);

    // [DATA ONLY - NO DOM YET]
    // creates treemap (data only) structure from the given node (root) down the tree
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants();
    //var links = treeData.descendants().slice(1);

    // Normalize for fixed-depth. could calculate this against longest text len based on font px (180 or ...)
    nodes.forEach(function (d) {
        d.y = (d.depth * 280) + getOffset(d.depth);
    });

    // Update the existing node(s) with id's
    // 'g.node' = select all <g> with class 'node' directly within <svg>
    var node = svg.selectAll('g.node').data(nodes, function (d) { return d.id || (d.id = "n" + nextNodeID++); });

    // [ENTER - CREATE DOM ELEMENTS AND LINK TO DATA]
    // Enter (Create.Assign) new DOM nodes for unassigned data and append a <g> (enter-update-exit)
    var nodeEnter = node.enter().append('g');

    // Enter any new nodes at the parent's previous position (source.x/.y)
    nodeEnter
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        });

    // Add Circle for the nodes
    //<g><circle>...</circle></g>
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .attr('id', function (d) { return d.id; })
        .attr('target', function (d) { return d.target; })
        .attr('depth', function (d) { return d.depth; })

        .attr('critical', function (d) { return d.critical; })
        .attr('major', function (d) { return d.major; })
        .attr('minor', function (d) { return d.minor; })
        .attr('warning', function (d) { return d.warning; })
        .attr('info', function (d) { return d.info; })

        .attr("class",
            function (d) {
                if (d.critical > 0) return "node critical";
                if (d.major > 0) return "node major";
                if (d.minor > 0) return "node minor";
                if (d.warning > 0) return "node warning";
                if (d.info > 0) return "node info";
                return "node normal";
            })

        .style("stroke", function (d) { return (d.data.hasOwnProperty("tDn") ? "lightsteelblue" : "steelblue"); })
        //.style("stroke-dasharray",  function(d){ return (d.data.hasOwnProperty("tDn") ? "2,2" : "0") ; })

        // .on('')
        .on('dblclick', dblclickNode)
        .on('click', clickNode)
        .on("mouseover", mouseoverNode)
        .on("mouseout", mouseoutNode)
        .on('contextmenu', d3.contextMenu(nodeContextmenu))
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragging)
            .on("end", dragended));



    // ********************** Add labels for the nodes section ***************************
    updateTextLabels(nodeEnter)
    // ***********************************************************************************

    // [UPDATE]
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        })
        //.transition()
        //.duration(duration)
        ;

    // Update the node attributes and style  - make visible, increase radius size etc
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .attr('cursor', 'pointer');


    // [EXIT]
    // Remove any exiting nodes
    var nodeExit = node.exit()
        // .transition()
        // .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text#textinfo')
        .style('fill-opacity', 1e-6);

    // ******************************** links section *************************************
    updateLinks(source, treeData);
    // ************************************************************************************

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    return;
}

function updateTextLabels(nodeEnter) {
    var infotxt = nodeEnter.append('text')
        .attr("id", "textinfo")
        .attr("text-anchor", "start")

    // node label
    infotxt.append("tspan")
        .attr("id", "nodelabel")
        .classed("text-nodelabel", true)
        .text(function (d) { return d.label; })
        .select(function () { return this.parentNode; })

    // fault count
    var flttxt = nodeEnter.append("text")
        .attr('cursor', 'pointer')
        .attr("class",
            function (d) {
                return d3.select(this.parentNode).select("circle").attr("class").split(" ")[1] + "text";
            })
        .attr("id", "faultcount")
        .attr("text-anchor", "middle")
        .style("font-size", "8px")
        .attr("pointer-events", "none")
        .attr("dx", 1)
        .attr("dy", 1)
        .text(
            function (d) {
                var count = d.critical + d.major + d.minor + d.warning + d.info;
                if (count === undefined || count === 0) { return ""; }
                return (d.critical + d.major + d.minor + d.warning + d.info).toString();
            });
}

function updateLinks(source, treeData) {
    var links = treeData.descendants().slice(1);

    // Update the links...
    var link = svg.selectAll('path.link')
        .data(links, function (d) { return d.id; });      // returns node id

    // Enter any new links at the parent's previous position 

    // insert a path BEFORE any 'g's (the svg above is svg\g\...)
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d',
            function (d) {
                // d is childnode
                var o = { x: source.x0, y: source.y0 };
                // create path to self using 'parents' / 'source' pos as src & dst, we will set real path in [UPDATE] section.
                return diagonal(o, o);
            })

    // if the relationship between the objects is 
    // * child-parent then draw solid line
    // * Rs (Reln From) or Rt (Reln To) then draw dash line 
    linkEnter.style('stroke-dasharray', function (d) {
        // is either one a contained child of the other ? - if so return 0 for a solid line.
        var pDn1 = getParentDn((d.data.dn ? d.data.dn : ""));
        var pDn2 = getParentDn((d.parent.data.dn ? d.parent.data.dn : ""));
        // is d (pDn1) is contained child of d.parent ?
        if (pDn1 === d.parent.data.dn) { return "0"; }
        // is d.parent (pDn2) is contained child of d ?
        if (pDn2 === d.data.dn) { return "0"; }

        //console.log("Not Related ", d.parent.data.dn);
        //console.log("Not Related ", d.data.dn);

        // at this point, one of the connected objects must have a tDN describing a
        // relationship. If this fails and neither has tDn then we have a parse issue in getParentDn
        var hastDn = (d.data.hasOwnProperty("tDn") || d.parent.data.hasOwnProperty("tDn"));
        if (!hastDn) {
            // neither had tDn so we have a parse issue in getParentDn
            // known issue with example dn:
            //       uni/tn-abhojani1/ap-abhojani1_App/epg-abhojani1_Web/ctrctCtxdefDn-[uni/ctx-[uni/tn-common/ctx-VRF_Common]]
            // multiple [] causing issues i believe in getParentDn
            console.log("neither had tDn so we have a parse issue in getParentDn; hastDn = ", hastDn, d.data.dn, d.parent.data.dn);
            appMsg.postMessage("updateLinks() objects passed logic with no tDn's", "warning");
            return "0"; // ????
        }

        // logic testing... should never hit ( i believe)... remove once tested.
        if ((d.data.hasOwnProperty("tDn") && d.parent.data.hasOwnProperty("tDn"))) {
            console.log("both have tDn so we have a logic issue in getParentDn; hastDn = ", d.data.dn, d.parent.data.dn);
            appMsg.postMessage(">>>> ERROR updateLinks() objects passed logic both with tDn's <br/><b>" + d.data.dn + "<br/> " + d.parent.data.dn, "warning");
        }

        // so is a relationship (Rs or Rt), draw a dashed line
        return "5.5";
    });




    // >>>>>>>>> [UPDATE] <<<<<<<<<< 
    var linkUpdate = linkEnter.merge(link);
    // set correct src/dst for path
    linkUpdate.attr('d', function (d) { return diagonal(d, d.parent) });


    // >>>>>>>>> [EXIT] <<<<<<<<<< 
    // Remove any exiting links
    var linkExit = link
        .exit()
        .attr('d', function (d) {
            var o = { x: source.x, y: source.y }
            return diagonal(o, o)
        })
        .remove();

    return;
}

/* Adjust/(re)set the node text positions */
function resetNodeTextPos() {
    d3.selectAll('g.node')  // get all the nodes
        .each(function (d) {
            /**************** outer <text> wrapper element ****************/
            d3.select(this).select('text#textinfo')
                .attr("text-anchor", "start");

            d3.select(this).select('text#textinfo')
                .attr("y",
                    function (d) {
                        // if(Array.isArray(d.children ))
                        // {
                        //     return  ((d.children.length % 2 == 0) ? 5 : -15);
                        // }
                        return 5;
                    });

            d3.select(this).select('text#textinfo')
                .attr("x",
                    function (d) {
                        return 13;
                        if (!d.children) return 13;
                        if (d.children && (d.children.length % 2 == 0)) return 13;
                        return 0;
                    });

            /**************** <tspan> label ****************/
            d3.select(this).select('text#textinfo').select('tspan#nodelabel')
                .attr("dy", "0")
                .attr("dx",
                    function (d) {
                        return (d.children && (d.children.length % 2 != 0)) ? 0 : 0;
                    }); //13,13

            /**************** <tspan> class abstract/concrete name ****************/
            d3.select(this).select('text#textinfo').select('tspan#nodeclassname')
                .attr("dy", "-14")
                .attr("x", function (d) {
                    return d3.select(this.parentNode).attr("x");
                });

            /**************** <text> fault count ****************/
            d3.select(this).select('text#faultcount')
                .attr("dx", 0)
                .attr("dy", 3)
        });
}


// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path;
}
