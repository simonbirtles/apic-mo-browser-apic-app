/*
*   LICENSE
*   Copyright (c) 2015-2017, Simon Birtles http://linkedin.com/in/simonbirtles
*   All rights reserved.
*   Dual licensed under the MIT and GPL licenses.
*/

function getChildren(parentNode) {
    //console.log("******************************************************");
    //console.log("Node is ", parentNode);
    var dn;
    var queryFilter = undefined;
    var url = undefined;

    // if the node (parentNode) has a defaultQueryFilter, use it.
    if (parentNode.hasOwnProperty('defaultQueryFilter') && parentNode.defaultQueryFilter) {
        queryFilter = parentNode.defaultQueryFilter;
    }
    else {
        queryFilter = 'query-target=children';
    }

    if (parentNode.data.hasOwnProperty('tDn')) {
        //console.log("Is a Relationship Object (Rt/Rs)")       
        var parentDn = getParentDn(parentNode.data.dn);
        console.log("parentNode.data.hasOwnProperty('tDn') = true");
        console.log("looking for parentDN= ", parentDn);
        // is the given node's (parentNode) DN Parent on the tree as on a direct path back to root - will actually be one hop back.. (or usually?) 
        if ((isObjectOnTreePath(parentNode, parentDn)) || (parentDn.length === 0)) {
            // if it is, then the parentNode.tDn attribute is pointing downstream 
            // and we should "get" the related "real" object
            console.log("ParentDn found on tree back to root");
            console.log("dn = parentNode.data.tDn= ", parentNode.data.tDn);
            // set the DN we want to get info on to the tDn (downstream real MO)
            dn = parentNode.data.tDn;
            // we overwrite the default query target here as the given node (parentNode)
            // is a relationship object (Rt or Rs) and we need to expand to the real 
            // object this relationship object is pointing to/from. Therefore search for self only
            queryFilter = 'query-target=self';
        }
        else {
            // the  given node (parentNode)'s Parent is not on the tree back to root, 
            // so we go in the other direction and get the DN Parent MO (i.e. back one on the DN path)
            // this is assuming that the currently connected upstream object is the object the tDn is pointing 
            // to, therefore we need to expand the DN Parent MO.
            console.log("ParentDn NOT found on tree back to root");
            dn = parentNode.data.dn;
        }
    }
    else {
        //console.log("Is a Containing Object");
        console.log("parentNode.data.hasOwnProperty('tDn') = false");
        // this given object (parentDn) does not have a tDn attribute therefore is not a
        // relationship. This objects upstream MO could be a relationship or MO object.
        // this objects downstream MO could be a relationship or MO object.
        // Either way - get the children of this given MO (parentNode) and use 
        // the query filters found above. 
        dn = parentNode.data.dn;
    }


    // build REST url. 
    url = '/api/mo/' + dn + '.json?' + queryFilter;
    console.log("getChildren URL: ", url);

    // build reply callback
    var lfunc = function (_this_) {
        if (_this_.readyState === 4) {
            respJson = JSON.parse(_this_.responseText);

            // special case, sendToAPIC func does not deal with these.
            if (_this_.status === 400) {
                if (respJson.imdata[0].hasOwnProperty('error')) {
                    var errorCode = respJson.imdata[0].error.attributes.code;
                    var errorText = respJson.imdata[0].error.attributes.text;
                    appMsg.postMessage("getChildren failed with error code " + errorCode + "<b>[" + errorText + "]</b> for \n" + url, "error");
                }
                else {
                    appMsg.postMessage("getChildren failed with 400[" + _this_.statusText + + "] for " + url + ". Check URL/Filter is Valid", "error");
                }
            }

            // ok.
            if (_this_.status === 200) {
                if (respJson.totalCount > 0) {
                    // sort alpha on DN
                    var arr = respJson.imdata.slice(0);
                    arr.sort(function (a, b) {
                        for (classTypeA in a);
                        for (classTypeB in b);

                        if (a[classTypeA].attributes.dn > b[classTypeB].attributes.dn) return 1;
                        if (a[classTypeA].attributes.dn < b[classTypeB].attributes.dn) return -1;
                        return 0;
                    });

                    // create copy of parents children.
                    var pChildren = ((parentNode.hasOwnProperty("children") && parentNode.children !== null) ? parentNode.children.slice(0) : []);
                    // first loop for create/update if child node is in respJson.imdata
                    for (var i = 0; i < respJson.imdata.length; i++) {
                        var childNode = arr[i];
                        var pChildDone = false;
                        for (var j = 0; j < pChildren.length; j++) {
                            for (firstKey in childNode);
                            // get node attributes array
                            var childNodeAttr = childNode[firstKey].attributes;

                            if (pChildren[j].data.dn === childNodeAttr.dn) {
                                // child already exists, so call updateNode, then delete child from pChildren
                                updateNode(parentNode, pChildren[j]);
                                pChildren.splice(j, 1);
                                pChildDone = true;
                                break;
                            }
                        }

                        // if the child is a new one - i.e. Update not called above, then add it.
                        if (!pChildDone) {
                            // child does not exist internally, so call createNode to add it.
                            createNode(parentNode, childNode);
                        }
                    }

                    // pChildren should now only hold objects which were not given by the apic (respJson.imdata)
                    // so we need to delete these from this parent as the APIC no longer has them as children of this parent. (prob deleted)
                    for (var j = 0; j < pChildren.length; j++) {
                        deleteNode(parentNode, pChildren[j]);
                    }

                    update(parentNode);
                    resetNodeTextPos();
                }
                else {
                    appMsg.postMessage(dn + " has no children", "info");
                    showTimedNotify(parentNode, "MO has no children");
                }

            }
            // reset loading indicator for parentNode
            stopNodeLoading(parentNode);
        }
    }  // end callback func

    startNodeLoading(parentNode);
    sendToAPIC("GET", url, lfunc);
    return;
}

// childNode = childNode.{class}.attributes.xxx
function createNode(parentNode, childNode) {
    // get childNode class name (abstract class name i.e. fvBD)
    for (firstKey in childNode);
    // get node attributes array
    var childNodeAttr = childNode[firstKey].attributes;

    // get the usable DN - prefer dn then tDn
    //var uDn = (  (childNodeAttr.hasOwnProperty('tDn') && (childNodeAttr.tDn.length > 0) ) ? childNodeAttr.tDn : childNodeAttr.dn) 
    var uDn = (childNodeAttr.hasOwnProperty('tDn') ? childNodeAttr.tDn : childNodeAttr.dn)
    // does this node have a tDn or dn ?
    if (uDn === "") {
        //console.log("createNode aborting due to no DN on object.. could be topRoot ()...")
        return false;
    }

    // create node in tree hierarchy using data from APIC (childNodeAttr)
    var newnode = d3.hierarchy(childNodeAttr);//, function(d) { return d.children; });

    // See if this new node (dn) exists in the parent._children arrary using dn 
    // as the check. if so then get reference to it and use the saved data in the node.appdata
    // to complete this node. poss just copy oldnode.appdata to newnode.appdata 
    // then pull out appdata.xyz to node active attrib's

    newnode.appdata = [];   // session data backup []
    if ((parentNode.hasOwnProperty('_children')) && (parentNode._children !== null)) {
        for (var i = 0; i < parentNode._children.length; i++) {
            if (parentNode._children[i].dn === uDn) {
                for (var av in parentNode._children[i].appdata) {
                    //console.log("attr= ", av, " value= ", parentNode._children[i].appdata[av]);
                    newnode.appdata[av] = parentNode._children[i].appdata[av];
                }
                break;
            }
        }
    }

    newnode.dn = uDn;
    newnode.parent = parentNode;
    newnode.children = null;
    newnode._children = null;
    newnode.depth = parentNode.depth + 1;
    newnode.height = parentNode.height - 1;
    newnode.id = "n" + nextNodeID++;
    newnode.absclassname = firstKey;
    newnode.appdata.defaultQueryFilter = "query-target=children";
    newnode.defaultQueryFilter = (newnode.appdata.hasOwnProperty("activeQueryFilter") ? newnode.appdata.activeQueryFilter : newnode.appdata.defaultQueryFilter);
    //newnode.appdata.lastQueryFilter = newnode.defaultQueryFilter;

    // split up DN
    var tmp = newnode.dn.split(/(\/)(?=(?:[^\]]|\[[^\]]*\])*$)/);
    //console.log("dn split: ", tmp);
    var lenDnS = tmp.length;
    newnode.label = '(' + tmp[lenDnS - 1] + ')'; // + "" + '[' + ""+ ']' ;
    newnode.size = childNodeAttr.size;
    newnode.x0 = 0;
    newnode.y0 = 0;

    if (childNodeAttr.hasOwnProperty('faults')) {
        newnode.critical = childNode.faults[0].critical;
        newnode.major = childNode.faults[0].major;
        newnode.minor = childNode.faults[0].minor;
        newnode.warning = childNode.faults[0].warning;
        newnode.info = childNode.faults[0].info;
    }
    else {
        newnode.critical = 0;
        newnode.major = 0;
        newnode.minor = 0;
        newnode.warning = 0;
        newnode.info = 0;
    }

    //If no child array in parentNode, create an empty array
    if ((!parentNode.hasOwnProperty('children')) || parentNode.children === null) { parentNode.children = []; }

    if ((!parentNode.hasOwnProperty('_children')) || parentNode._children === null) { parentNode._children = []; }

    // Push it into parent.children array  
    parentNode.children.push(newnode);
    getNodeFaults(newnode);
    resetNodeTextPos();
    return true;
}

// childNode is a copy of the child within the parentNode, no ops on the copy
// must re-find the child in the parents child array to perform operations on it.
function updateNode(parentNode, childNode) {
    // todo
    console.log(">>>>>> TODO CODE : >>>>>> updateNode= ", childNode);

    for (var j = 0; j < parentNode.children.length; j++) {
        if (parentNode.children[j].data.dn === childNode.data.dn) {
            // found, update
            d3.select("circle#" + childNode.id)
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
            return;
        }
    }
    return;
}

// both parentNode and childNode are datum in the app.
function deleteNode(parentNode, childNode) {
    //console.log("deleteNode= ", childNode); 
    for (var j = 0; j < parentNode.children.length; j++) {
        if (parentNode.children[j].data.dn === childNode.data.dn) {
            parentNode.children.splice(j, 1);
            return;
        }
    }

    // todo    

    // _children ? collapse function ? how do we know if its really deleted of if its a filter or both ????
    // prob still put in _children as these are just there for reference when we create new ones.. so prob all good.

    return;
}

// filter on this class - context menu
function filterSiblings(node) {
    if (node === undefined) { return; }
    if (node.absclassname === undefined) { return; }
    if (node === root) { return; }

    var queryString = "query-target=children&target-subtree-class=" + node.absclassname;
    var nodeParent = node.parent;
    nodeParent.defaultQueryFilter = queryString;
    //collapse(nodeParent);
    getChildren(nodeParent);
    //update(nodeParent);
    //dblclickNode(nodeParent);
}

function isObjectOnTreePath(startNode, objDN) {
    //console.log("checking for Dn on tree path to root: ", objDN);
    // check to see if this node (d) is already on the path back to root
    var parentNodeObj = startNode.parent;
    while (parentNodeObj !== null) {
        // check to see if the parent node is a relationship by checking for 'tDn'
        // if so use the 'tDn' otherwise use the 'dn'
        var localParentDN;
        // if(parentNodeObj.data.hasOwnProperty('tDn')) {
        //     localParentDN = parentNodeObj.data.tDn;}
        // else{
        localParentDN = parentNodeObj.data.dn;
        //}

        // console.log("current node up tree ", localParentDN);

        // compare the parent dn/tdn and clicked node tdn/dn
        if (localParentDN === objDN) {
            return true;
        }// found the object on the path back to root

        // move up the tree one level
        parentNodeObj = parentNodeObj.parent;
    }
    return false;
}

function toggleParentDownStream() {
    bShowObjectParentDownstream = !bShowObjectParentDownstream;
    d3.select("a#menuParentToggle").attr("class", (bShowObjectParentDownstream ? "toggle-on" : ""));
}

function showNodeProperties(node) {
    objProp.updateNodeProperties(node);
}

function getUserCredentials() {
    //apicLoginCred.getUserCredentials();
}

function updateScale() {
    zoomFit2();
}

function zoomFit2() {
    var svg_g = d3.select("g#svg-g"); //.select("g");           //.select("#rootg");svg-g
    var bounds = svg_g.node().getBoundingClientRect();       // the g
    var parent = svg_g.node().parentElement;                 // the svg

    // get SVG h w
    var SVGfullWidth = parent.clientWidth;                     // SVG#msvg width
    var SVGfullHeight = parent.clientHeight;                   // SVG#msvg height

    // get current transform (scale) from parent <svg> for the <g> element 
    // (all elements contained in <svg>, gets applied to all direct children)
    var rootsvg = d3.select("svg#msvg");
    var tformsvg = d3.zoomTransform(rootsvg.node());

    // get root <g> h w
    var Gwidth = bounds.width;                               // <g> width
    var Gheight = bounds.height;                             // <g> height

    //var scale =   Gheight / SVGfullHeight;
    var scale = 2.7; // (SVGfullHeight / (Gheight/tformsvg.k)) * .90 ;

    // get svg mid point
    var svgMidY = SVGfullHeight; ///1.2;

    var localSVG = d3.select("svg#msvg");
    localSVG.call(zoom.transform,
        d3.zoomIdentity
            .translate(margin.left, svgMidY)
            .scale(scale));

    return scale;
}

function showTimedNotify(d, messageText) {
    var padding = 10;
    var dNode = d3.select("circle#" + d.id);
    var ele = dNode.select(function () { return this.parentNode; });

    var eleG = ele.append("g")
        .attr("id", "g-notify-popup-" + d.id)
        .attr("transform", "translate(0,0)");

    var eleRect = eleG.append("rect")
        .style("fill", "#555")
        .style("opacity", .9)
        .style("rx", "6")
        .style("ry", "6")
        .style("width", "100")
        .style("height", "16")
        .style("x", "0")
        .style("y", "0");

    var eleText = eleG.append("text")
        .attr("id", "notify-popup2")
        .attr("dy", "11")
        .style("fill", "white")
        .text(function () { return messageText; });

    var txtLen = eleText.node().getComputedTextLength();
    eleRect.style("width", txtLen + padding);
    eleText.attr("dx", function () {
        return (padding / 2);
    });

    setTimeout(function () {
        d3.select("body").select("g#g-notify-popup-" + d.id)
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
    }, 1500);

    return;
}

function createDNTip(parentSVG, tformy, tformx, cclass, ttid, node) {
    var dn;
    if (node.data.hasOwnProperty('tDn')) {
        dn = node.data.tDn;
    }
    else {
        dn = node.data.dn;
    }

    parentSVG.append("g")
        .attr("transform", "translate(" + 5 + "," + tformx + ")")
        .append("text")
        .attr("text-anchor", "start")
        .attr("x", 10)
        .attr("y", 5)
        // fault type
        .append("tspan")
        .text(function (d) { return dn; })
        .attr("dy", 3)
        .attr("dx", -15)
        .attr("font-weight", "bold")
        .select(function () { return this.parentNode; }) // back to <text>

        .select(function () { return this.parentNode; }) // back to <g>
        .select(function () { return this.parentNode; }) // back to <svg> (passed SVG container)
    return;
}

// svg container, tform y, tform x, circle-class, fault-count-tspan-id, faultname, faultcount
function createFaultCountTip(parentSVG, tformy, tformx, cclass, ttid, faultname, faultcount) {
    parentSVG.append("g")
        .attr("transform", "translate(" + 5 + "," + tformx + ")")
        .append("circle")
        .attr("r", 4)
        .attr("cx", 1)
        .attr("cy", 4)
        .attr('class', cclass)
        .select(function () { return this.parentNode; })    // back to <g>

        .append("text")
        .attr("text-anchor", "start")
        .attr("x", 10)
        .attr("y", 5)
        // fault type
        .append("tspan")
        .text(function (d) { return faultname + ": "; })
        .attr("dy", 3)
        .select(function () { return this.parentNode; }) // back to <text>
        // fault type count
        .append("tspan")
        .attr("id", ttid)
        .text(function (d) { return faultcount; })
        .select(function () { return this.parentNode; }) // back to <text>

        .select(function () { return this.parentNode; }) // back to <g>
        .select(function () { return this.parentNode; }) // back to <svg> (passed SVG container)

}

function showProperties() {
    bNodePropShown = !bNodePropShown;
    objProp.showWindow(bNodePropShown);
    d3.select("a#menuPropToggle").attr("class", (bNodePropShown ? "toggle-on" : ""));
}

function showToolTips() {
    bToolTips = !bToolTips;
    d3.select("a#menuToolTipsToggle").attr("class", (bToolTips ? "toggle-on" : ""));
}

function showMessageWindow() {
    bMessageWindowShown = !bMessageWindowShown;

    var divContainer = d3.select("div#app-msg-content");
    divContainer
        .transition()
        .duration(500)
        .style("opacity", (bMessageWindowShown ? 1 : 0))
        .style("visibility", (bMessageWindowShown ? "visible" : "hidden"))

    d3.select("a#menuMessageToggle").attr("class", (bMessageWindowShown ? "toggle-on" : ""));
}

function appendSVGDefs(svg) {
    // parent node targets (refs) child
    svg.append("svg:defs").selectAll("marker")
        .data(["childtarget"])      // Different link/path types can be defined here
        .enter()
        .append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("orient", "0")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)

        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "rgb(128,128,128)");


    svg.append("svg:defs").selectAll("marker")
        .data(["parenttarget"])      // Different link/path types can be defined here
        .enter()
        .append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("orient", "180")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", -8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)

        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "rgb(128,128,128)");
}

// Collapse the node (d) and all it's children recursivly
function collapse(d) {
    if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
    }
}

function startNodeLoading(node) {
    // set loading indicator for parentNode
    var ele = d3.select("circle#" + node.id);//.select(function(){return this.parentNode;});

    // save original radius for later restores
    if (!node.appdata.hasOwnProperty("r")) {
        node.appdata.r = node.r;
    }

    ele.append("animate")
        .attr("id", "nodeloadingani")
        .attr("attributeType", "xml")
        .attr("attributeName", "r")
        .attr("values", "12; 3; 12")
        .attr("begin", "0")
        .attr("dur", "1.6s")
        .attr("repeatCount", "indefinite")

    return;
}

function stopNodeLoading(node) {
    var ele = d3.select("circle#" + node.id);
    ele.select("animate#nodeloadingani").remove();
    ele.attr("r", node.appdata.r);
}

function getParentDn(Dn) {
    // strip off end of DN where it starts with [, this is not a valid char in a DN name so
    // can strip off the rest of this to get DN parent string as its a special tag for 
    // internal referencing I beleive. uses tDN to get actual target DN
    var arr = Dn.split("[");
    // get the Dn path parent for this node from the node's DN... 
    var arrParentDN = (arr[0].split(/(\/)(?=(?:[^\]]|\[[^\]]*\])*$)/));//;

    // // check to see if the clicked node is a relationship by checking for 'tDn'
    // // if so use the 'tDn' otherwise use the 'dn'
    // var localDN = Dn; //node.dn; //(d.data.hasOwnProperty('tDn')) ? d.data.tDn :d.data.dn;
    // // get the Dn path parent for this node from the node's DN... 
    // var arrParentDN = (localDN.split(/(\/)(?=(?:[^\]]|\[[^\]]*\])*$)/));//;
    arrParentDN.splice(-2, 2);
    var parentDN = arrParentDN.join("");
    return parentDN;
}

function restoreWindowPos() {
    d3.select("div#obj-prop-content")
        .style("left", null)
        .style("bottom", null)
        .style("right", "1px")
        .style("top", "1px");

    d3.select("div#app-msg-content")
        .style("right", "1px")
        .style("bottom", "1px")
        .style("left", null)
        .style("top", null);

    return;
}

function appAbout() {

    var html =
        "APIC Managed Object Browser<br>\
     Version 1.0<br>\
     Written by <a href='mailto:simon.birtles@haystacknetworks.com' target='_top'>Simon Birtles @ Haystack Networks Ltd, UK </a><br>\
     Copyright (c) 2016-2017, Haystack Networks Ltd, UK <a href='https://www.haystacknetworks.com' target='_blank'>www.haystacknetworks.com</a><br>\
     All rights reserved.<br>\
     Dual licensed under the MIT and GPL licenses.<br>\
     <a href='https://haystacknetworks.com/cisco-apic-managed-object-browser' target='_blank'>Application Documentation</a>";

    if (!bMessageWindowShown) {
        showMessageWindow();
        d3.select("div#app-msg-content")
            .style("right", "1px")
            .style("bottom", "1px")
            .style("left", null)
            .style("top", null);
    }
    appMsg.postMessage(html, "info");


    return;
}